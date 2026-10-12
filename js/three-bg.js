/* ==========================================================================
   Arthur — Illustration portfolio
   Ambient WebGL background. A single fixed canvas (see .three-bg) sitting
   behind every section for the whole scroll — desktop/pointer-fine only,
   see the guard below; touch and prefers-reduced-motion visitors never
   even get the canvas, just the existing static grain look.

   A drifting field of small round off-white points — monochromatic, only
   brightness varies, not hue. Each one wanders its own slow, independent
   orbit (see the per-particle phase/speed/amplitude below) rather than
   the whole field just rotating as one rigid body, so it reads as alive
   rather than mechanical. Brightness comes from three things stacked
   together: a fixed per-particle baseline (so the field reads as having
   real depth even standing still — some points are just dimmer, as if
   farther away), the particle's actual z position (nearer the camera
   brightens it, same idea, but animated as it drifts), and cursor
   proximity (warms/lifts whatever's nearby).
   ========================================================================== */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

(() => {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarse = window.matchMedia("(hover: none)").matches || window.innerWidth < 760;
  if (prefersReduced || isCoarse) return;

  // Logged rather than left to fail silently — a WebGL error here would
  // otherwise just look like "the background does nothing", with no clue
  // why from the page itself.
  try {

  const FG = 0xf2f1ec; // --fg

  const canvas = document.createElement("canvas");
  canvas.className = "three-bg";
  document.body.prepend(canvas);

  // Faded in (see .three-bg.is-in, css/styles.css) once main.js's own
  // intro sequence finishes, rather than the instant this module loads —
  // otherwise the field just pops in out of step with the hero logo draw
  // and text reveal. window.__introComplete covers the case where main.js
  // already finished its intro before this (deferred, slower-to-start)
  // module script even got a listener registered; the timeout covers the
  // rare case where neither the event nor the flag ever arrives (e.g. the
  // GSAP CDN failed to load) — the canvas should never stay invisible.
  function revealCanvas() {
    canvas.classList.add("is-in");
  }
  if (window.__introComplete) {
    revealCanvas();
  } else {
    window.addEventListener("portfolio:introend", revealCanvas, { once: true });
    setTimeout(revealCanvas, 4000);
  }

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 26;

  function smoothstep(edge0, edge1, x) {
    const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
    return t * t * (3 - 2 * t);
  }

  // A soft radial-gradient sprite so points render as round glowing dots
  // instead of PointsMaterial's default hard-edged square.
  function makeDotTexture() {
    const size = 64;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.5, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }

  let mouseX = 0;
  let mouseY = 0; // normalized -1..1, drives the camera's own subtle parallax
  window.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    updatePointerWorld(e.clientX, e.clientY);
  });

  let scrollProgress = 0;
  function readScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = max > 0 ? window.scrollY / max : 0;
  }
  window.addEventListener("scroll", readScroll, { passive: true });
  readScroll();

  /* ---------------------------------------------------------------------
     Cursor warmth — raycast the real cursor onto the field's z=0 plane so
     "near the cursor" is judged in the same world space the particles
     drift in, not screen space.
     --------------------------------------------------------------------- */
  const raycaster = new THREE.Raycaster();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const pointerWorld = new THREE.Vector3(9999, 9999, 0); // off-field until the mouse actually moves
  const pointerNdc = new THREE.Vector2();
  const hitPoint = new THREE.Vector3();

  function updatePointerWorld(clientX, clientY) {
    pointerNdc.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(pointerNdc, camera);
    if (raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
      pointerWorld.copy(hitPoint);
    }
  }

  const POINTER_RADIUS = 7;
  const POINTER_STRENGTH = 0.9;
  const POINTER_Z_LIFT = 1.6;

  // z spread is ±10 (below) plus up to ±2.4*0.6≈±1.4 of drift — ±11.5
  // covers the real range without clipping brightness at either end.
  const DEPTH_NEAR = 11.5;
  const DEPTH_FAR = -11.5;
  const DEPTH_MIN_BRIGHTNESS = 0.18;

  const COUNT = 760; // a little denser than the original 520
  const basePositions = new Float32Array(COUNT * 3);
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  // Each particle's own little orbit — random phase/speed/amplitude per
  // axis so the field never falls into a visibly synchronized pattern.
  const phase = new Float32Array(COUNT * 3);
  const speed = new Float32Array(COUNT * 3);
  const amp = new Float32Array(COUNT * 3);
  // Fixed per-particle baseline brightness — independent of depth or the
  // cursor, this is what makes some points read as permanently faint
  // ("farther away") and others as bright, even at rest.
  const baseBrightness = new Float32Array(COUNT);

  const baseColor = new THREE.Color(FG);

  // Kept inside the camera's actual view frustum (55° fov, z=26 away) —
  // a wider spread just wastes particles off-screen where they'd never
  // be seen at all.
  for (let i = 0; i < COUNT; i++) {
    const x = (Math.random() - 0.5) * 34;
    const y = (Math.random() - 0.5) * 22;
    const z = (Math.random() - 0.5) * 20;
    basePositions[i * 3] = x;
    basePositions[i * 3 + 1] = y;
    basePositions[i * 3 + 2] = z;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    for (let a = 0; a < 3; a++) {
      phase[i * 3 + a] = Math.random() * Math.PI * 2;
      speed[i * 3 + a] = 0.15 + Math.random() * 0.35;
      amp[i * 3 + a] = 0.8 + Math.random() * 2.4;
    }

    // Skewed toward dim (squared) — a field of mostly-faint points with a
    // few standouts reads as "depth" far better than an even spread.
    baseBrightness[i] = Math.pow(Math.random(), 2) * 0.85 + 0.15;

    colors[i * 3] = baseColor.r;
    colors[i * 3 + 1] = baseColor.g;
    colors[i * 3 + 2] = baseColor.b;
  }

  const geometry = new THREE.BufferGeometry();
  const positionAttr = new THREE.BufferAttribute(positions, 3);
  const colorAttr = new THREE.BufferAttribute(colors, 3);
  positionAttr.setUsage(THREE.DynamicDrawUsage);
  colorAttr.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("position", positionAttr);
  geometry.setAttribute("color", colorAttr);

  const material = new THREE.PointsMaterial({
    map: makeDotTexture(),
    size: 0.34,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // The field itself rotates over time (see points.rotation.y/x below) —
  // the cursor's raycast hit is in world space, so it has to be converted
  // into the field's own local space each frame before comparing it
  // against particles' local x/y, or the warm spot would drift away from
  // the actual cursor as the rotation accumulates.
  const localPointer = new THREE.Vector3();

  const clock = new THREE.Clock();
  function animate() {
    if (!document.hidden) {
      const elapsed = clock.elapsedTime;

      points.rotation.y = elapsed * 0.03 + scrollProgress * 1.4;
      points.rotation.x = scrollProgress * 0.3;
      points.updateMatrixWorld();
      localPointer.copy(pointerWorld);
      points.worldToLocal(localPointer);

      for (let i = 0; i < COUNT; i++) {
        const ix = i * 3;
        const iy = ix + 1;
        const iz = ix + 2;
        const x = basePositions[ix] + Math.sin(elapsed * speed[ix] + phase[ix]) * amp[ix];
        const y = basePositions[iy] + Math.cos(elapsed * speed[iy] + phase[iy]) * amp[iy];

        const pdist = Math.hypot(x - localPointer.x, y - localPointer.y);
        const warmth = smoothstep(POINTER_RADIUS, 0, pdist) * POINTER_STRENGTH;

        const z = basePositions[iz] + Math.sin(elapsed * speed[iz] + phase[iz]) * amp[iz] * 0.6;
        positions[ix] = x;
        positions[iy] = y;
        positions[iz] = z + warmth * POINTER_Z_LIFT;

        // Depth, baseline and cursor warmth all stack as brightness only
        // — hue never shifts, so the field stays strictly monochromatic
        // even when something's lit up by the cursor.
        const depthBrightness = DEPTH_MIN_BRIGHTNESS + (1 - DEPTH_MIN_BRIGHTNESS) * smoothstep(DEPTH_FAR, DEPTH_NEAR, z);
        const brightness = Math.min(baseBrightness[i] * depthBrightness + warmth, 1.4);
        colors[ix] = baseColor.r * brightness;
        colors[iy] = baseColor.g * brightness;
        colors[iz] = baseColor.b * brightness;
      }
      positionAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;

      camera.position.x += (mouseX * 3 - camera.position.x) * 0.04;
      camera.position.y += (-mouseY * 2 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  } catch (err) {
    console.error("[three-bg] failed to initialize", err);
  }
})();
