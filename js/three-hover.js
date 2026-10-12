/* ==========================================================================
   Arthur — Illustration portfolio
   Bento hover-distortion. One shared WebGL plane, re-textured with
   whichever bento image is currently under the cursor, that ripples
   toward the pointer. Desktop-only (see the guard below) and scoped to
   the curated bento grid alone — the fauna/flora/anatomy carousels
   already carry their own scale/blur focus motion (see initCarousel in
   main.js), so layering a second effect there would fight it rather than
   add to it.

   The real <img> fades to opacity:0 the moment this plane takes over (see
   .is-distorting in css/styles.css) and back the moment it lets go, so
   only one of the two is ever visible — this never replaces the DOM
   image, click/right-click/lightbox all still target the real element
   underneath exactly as before.
   ========================================================================== */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

(() => {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarse = window.matchMedia("(hover: none)").matches || window.innerWidth < 760;
  if (prefersReduced || isCoarse) return;

  const bentoRoot = document.querySelector("[data-bento-root]");
  if (!bentoRoot) return;

  // Logged rather than left to fail silently — a WebGL/shader error here
  // would otherwise just look like "the effect does nothing", with no clue
  // why from the page itself.
  try {

  const canvas = document.createElement("canvas");
  canvas.className = "three-hover";
  document.body.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  let width = window.innerWidth;
  let height = window.innerHeight;
  // Pixel-space camera: left/right/top/bottom match CSS viewport
  // coordinates directly (top=0, bottom=height), so mesh.position can just
  // be a DOM getBoundingClientRect() rect's center, no conversion needed.
  const camera = new THREE.OrthographicCamera(0, width, 0, height, 0.1, 1000);
  camera.position.z = 1;
  renderer.setSize(width, height);

  const textureLoader = new THREE.TextureLoader();
  const textureCache = new Map();
  function textureFor(src) {
    if (textureCache.has(src)) return textureCache.get(src);
    const tex = textureLoader.load(src);
    // Deliberately NOT tex.colorSpace = SRGBColorSpace: that would have
    // the GPU decode the (already sRGB-encoded) source image to linear
    // light on sample, but a plain custom ShaderMaterial — unlike three's
    // built-in materials — never re-encodes back to sRGB before writing
    // gl_FragColor (that only happens automatically for ShaderLib-based
    // materials). The result was every hovered image rendering too dark.
    // Leaving colorSpace at its default (NoColorSpace) makes this shader
    // a true passthrough — raw encoded texel in, same value out — which
    // is exactly correct for an sRGB-expecting canvas with no lighting
    // math involved.
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    textureCache.set(src, tex);
    return tex;
  }

  const material = new THREE.ShaderMaterial({
    transparent: true,
    // The camera's top/bottom are swapped below (to match CSS pixel
    // coordinates directly), which flips the projected winding order of
    // every triangle — with the default FrontSide, that flip gets the
    // whole plane back-face culled into invisibility. DoubleSide sidesteps
    // it outright rather than fighting winding order.
    side: THREE.DoubleSide,
    uniforms: {
      uTexture: { value: null },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uHover: { value: 0 },
      uTime: { value: 0 },
      // Natural pixel size of the loaded texture and the on-screen size of
      // the container it's filling — the fragment shader uses the ratio
      // between them to replicate CSS object-fit:cover (crop, don't
      // stretch), same as the real <img> underneath. Both default to
      // (1,1) — a no-op crop — until the real texture has actually
      // finished loading and its true size is known (see updateTexSize).
      uTexSize: { value: new THREE.Vector2(1, 1) },
      uContainerSize: { value: new THREE.Vector2(1, 1) },
    },
    vertexShader: `
      varying vec2 vUv;
      uniform vec2 uMouse;
      uniform float uHover;
      uniform float uTime;
      void main(){
        vUv = uv;
        vec3 pos = position;
        float d = distance(uv, uMouse);
        float ripple = sin(d * 18.0 - uTime * 3.0) * 0.12;
        pos.z += ripple * uHover * smoothstep(0.55, 0.0, d);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTexture;
      uniform vec2 uMouse;
      uniform float uHover;
      uniform vec2 uTexSize;
      uniform vec2 uContainerSize;
      void main(){
        // Ripple warp happens in container space (0..1 across the plane,
        // same space uMouse is already in) — untouched by the cover crop
        // below, so the ripple always tracks the cursor correctly
        // regardless of the image's own aspect ratio.
        vec2 uv = vUv;
        vec2 dir = uv - uMouse;
        float dist = length(dir);
        float force = smoothstep(0.5, 0.0, dist) * uHover;
        uv -= dir * force * 0.06;

        // Replicate CSS object-fit:cover — crop to the container's aspect
        // ratio instead of stretching the raw texture to fill it (which
        // is what a plain 0..1 UV sample against a differently-shaped
        // source image does by default).
        float containerAspect = uContainerSize.x / max(uContainerSize.y, 1.0);
        float texAspect = uTexSize.x / max(uTexSize.y, 1.0);
        vec2 scale = texAspect > containerAspect
          ? vec2(containerAspect / texAspect, 1.0)
          : vec2(1.0, texAspect / containerAspect);
        vec2 offset = (1.0 - scale) * 0.5;
        vec2 texUv = uv * scale + offset;

        gl_FragColor = texture2D(uTexture, texUv);
      }
    `,
  });

  const geometry = new THREE.PlaneGeometry(1, 1, 24, 24);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.visible = false;
  scene.add(mesh);

  let activeImg = null;
  let hoverTarget = 0;
  let hoverValue = 0;
  const relMouse = new THREE.Vector2(0.5, 0.5);

  function positionMesh() {
    if (!activeImg) return;
    const rect = activeImg.getBoundingClientRect();
    mesh.position.set(rect.left + rect.width / 2, rect.top + rect.height / 2, 0);
    // Negative Y scale: the camera's top/bottom are swapped (see its
    // comment above) so its projection already mirrors the plane's own
    // local up/down — this cancels that back out so the texture renders
    // right-side up instead of flipped, without touching the UV math.
    mesh.scale.set(rect.width, -rect.height, 1);
    material.uniforms.uContainerSize.value.set(rect.width, rect.height);
  }

  // Called on entering a (possibly still-loading) image and again every
  // frame while active — TextureLoader.load() returns a texture whose
  // .image isn't populated until the network fetch actually resolves, so
  // this just keeps checking until the real pixel size is available.
  function updateTexSize(tex) {
    if (tex && tex.image && tex.image.width) {
      material.uniforms.uTexSize.value.set(tex.image.width, tex.image.height);
    }
  }

  function onEnter(img) {
    activeImg = img;
    const tex = textureFor(img.currentSrc || img.src);
    material.uniforms.uTexture.value = tex;
    updateTexSize(tex);
    mesh.visible = true;
    hoverTarget = 1;
    positionMesh();
    canvas.classList.add("is-active");
    img.closest(".bento__item").classList.add("is-distorting");
  }

  function onMove(e, img) {
    if (activeImg !== img) return;
    const rect = img.getBoundingClientRect();
    relMouse.set((e.clientX - rect.left) / rect.width, 1 - (e.clientY - rect.top) / rect.height);
  }

  function onLeave(img) {
    hoverTarget = 0;
    if (activeImg === img) {
      img.closest(".bento__item").classList.remove("is-distorting");
    }
  }

  const SELECTOR = ".bento__item img[data-magnify]";
  bentoRoot.addEventListener("mouseover", (e) => {
    const img = e.target.closest(SELECTOR);
    if (img && img !== activeImg) onEnter(img);
  });
  bentoRoot.addEventListener("mousemove", (e) => {
    const img = e.target.closest(SELECTOR);
    if (img) onMove(e, img);
  });
  bentoRoot.addEventListener("mouseout", (e) => {
    const img = e.target.closest(SELECTOR);
    const to = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(SELECTOR);
    if (img && img !== to) onLeave(img);
  });

  const clock = new THREE.Clock();
  function animate() {
    hoverValue += (hoverTarget - hoverValue) * 0.12;
    material.uniforms.uHover.value = hoverValue;
    material.uniforms.uTime.value = clock.elapsedTime;
    material.uniforms.uMouse.value.lerp(relMouse, 0.25);

    if (activeImg) {
      positionMesh();
      updateTexSize(material.uniforms.uTexture.value);
    }

    if (hoverValue < 0.01 && hoverTarget === 0 && mesh.visible) {
      mesh.visible = false;
      canvas.classList.remove("is-active");
      activeImg = null;
    }

    if (!document.hidden) renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  window.addEventListener("resize", () => {
    width = window.innerWidth;
    height = window.innerHeight;
    camera.right = width;
    camera.bottom = height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });

  } catch (err) {
    console.error("[three-hover] failed to initialize", err);
  }
})();
