/* ==========================================================================
   Arthur — Illustration portfolio
   Lenis smooth scroll + GSAP ScrollTrigger. No frameworks, no build step.
   ========================================================================== */
(() => {
  "use strict";

  document.documentElement.classList.remove("no-js");

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarse = window.matchMedia("(hover: none)").matches || window.innerWidth < 760;
  const WORKS = window.WORKS || [];
  const SKETCHES = window.SKETCHES || [];

  /* ---------------------------------------------------------------------
     0. Language — Spanish is the default, English is the toggle. Static
     copy lives in js/i18n.js (window.I18N); work titles carry their own
     title/titleEs pair in js/data.js since they're per-item, not fixed UI
     strings. No DOM subtree is ever re-rendered on switch — applyLanguage
     (section 11) sweeps existing elements in place, so it can't disturb
     the bento/carousel/magnifier listeners already bound to them.
     --------------------------------------------------------------------- */
  let currentLang = localStorage.getItem("lang") === "en" ? "en" : "es";
  function t(key) {
    const dict = (window.I18N && window.I18N[currentLang]) || {};
    return dict[key] || key;
  }
  function workTitle(w) {
    return currentLang === "es" && w.titleEs ? w.titleEs : w.title;
  }

  // Every work/sketch also has a "-small" webp (~480px wide, see
  // images/works/*-small.webp) generated from the full-res source — a
  // grid/carousel thumbnail never needs the full "display" resolution,
  // especially now that the bento grid stays 3 columns even on phones
  // (see css: no small-screen column collapse), where a tile renders
  // barely 100px wide. srcset lets the browser pick per device instead
  // of every visitor downloading the same 1600px file.
  function smallSrcFor(src) {
    return src.replace(/\.webp(\?.*)?$/, "-small.webp$1");
  }

  // Reassigned once the magnifier (section 9) sets itself up; declared
  // here so the carousel engine (section 7) can close the lens on every
  // slide change without caring what order the two sections run in.
  let closeMagnifier = () => {};

  // Motion is an enhancement. If the CDN scripts (GSAP/ScrollTrigger)
  // don't load — blocked, offline, slow network — everything they'd
  // normally reveal is shown immediately via this fallback class instead
  // of staying permanently hidden.
  window.addEventListener("load", () => {
    setTimeout(() => {
      if (!window.gsap || !window.ScrollTrigger) {
        document.documentElement.classList.add("no-motion-fallback");
      }
    }, 1500);
  });

  /* ---------------------------------------------------------------------
     1. Render data-driven sections
     --------------------------------------------------------------------- */
  // Every "faces" + "concepts" piece goes into the bento grid — fauna,
  // flora and the anatomy sketches get their own carousels instead (see
  // renderCarousels below). Three columns, opening with a hand-placed
  // "hero block" (a landscape piece flanked by two tall portraits, with
  // a second landscape piece filling in underneath it) so the grid reads
  // as curated rather than a uniform table, then a recurring full-bleed
  // row breaking the rhythm every few pieces (see FULL_BLEED_EVERY) for
  // the rest. Cropped with object-fit so nothing has to stretch past its
  // native resolution.
  const BENTO_CATEGORIES = new Set(["faces", "concepts"]);
  // Tuned for the 18 pieces left over once the hero block below claims
  // its 4 (2 landscape anchors + the 2 portraits flanking them): full,
  // two rows of three, full, two rows of three, full, one last clean
  // row of three — no ragged leftover row at the tail. If the total
  // count changes, retune so (count - 1) is a multiple of this.
  const FULL_BLEED_EVERY = 7;

  function bentoFigure(w, extraClass) {
    const isFull = !!extraClass && extraClass.indexOf("bento__item--full") !== -1;
    return `
      <figure class="bento__item${extraClass ? " " + extraClass : ""}">
        <img src="${w.image}" srcset="${smallSrcFor(w.image)} 480w, ${w.image} 1120w" sizes="${isFull ? "100vw" : "33vw"}" alt="${workTitle(w)}" loading="lazy" data-magnify data-cursor="view" data-i18n-cursor="cursor.view" data-id="${w.id}" />
        <span class="zoom-hint" aria-hidden="true" data-i18n="zoomhint.text">${t("zoomhint.text")}</span>
      </figure>`;
  }

  function renderBento() {
    const root = document.querySelector("[data-bento-root]");
    if (!root) return;
    const all = WORKS.filter((w) => BENTO_CATEGORIES.has(w.category));

    // The two landscape-format pieces anchor the opening hero block —
    // everything else is portrait, so these are what actually break the
    // "every tile is the same shape" feeling.
    const eagle = all.find((w) => w.id === "36");
    const horse = all.find((w) => w.id === "37");

    // Black-and-white pieces lead the rest of the grid, color work fills
    // in after — a stable sort keeps each group in its original curated
    // order. The two portraits flanking the hero block are simply the
    // first two of that sorted list; everything left over flows into
    // the regular rhythm below.
    const rest = all
      .filter((w) => w !== eagle && w !== horse)
      .sort((a, b) => (b.bw ? 1 : 0) - (a.bw ? 1 : 0));
    const flankLeft = rest.shift();
    const flankRight = rest.shift();

    const heroBlock =
      eagle && horse && flankLeft && flankRight
        ? `<div class="bento__hero-block">
            ${bentoFigure(flankLeft, "bento__item--tall")}
            ${bentoFigure(eagle, "bento__item--half")}
            ${bentoFigure(flankRight, "bento__item--tall")}
            ${bentoFigure(horse, "bento__item--half")}
          </div>`
        : "";

    const grid = `<div class="bento__grid">${rest
      .map((w, i) => bentoFigure(w, i % FULL_BLEED_EVERY === 0 ? "bento__item--full" : ""))
      .join("")}</div>`;

    root.innerHTML = heroBlock + grid;
  }

  // Fauna, flora and the anatomy studies live in slow, smooth carousels
  // rather than the grid — small categories read better one at a time.
  const CAROUSEL_SOURCES = {
    fauna: () => WORKS.filter((w) => w.category === "fauna").map((w) => ({ id: w.id, image: w.image })),
    flora: () => WORKS.filter((w) => w.category === "flora").map((w) => ({ id: w.id, image: w.image })),
    anatomy: () => SKETCHES.map((s, i) => ({ num: i + 1, image: s.image })),
  };

  function sketchTitle(num) {
    return `${t("sketch.label")} ${String(num).padStart(2, "0")}`;
  }

  function renderCarousels() {
    document.querySelectorAll("[data-carousel]").forEach((root) => {
      const key = root.getAttribute("data-carousel-category");
      const getItems = CAROUSEL_SOURCES[key];
      const track = root.querySelector("[data-carousel-track]");
      if (!getItems || !track) return;
      const items = getItems();
      track.innerHTML = items
        .map((w, i) => {
          const title = w.id ? workTitle(WORKS.find((wk) => wk.id === w.id)) : sketchTitle(w.num);
          const idAttr = w.id ? `data-id="${w.id}"` : `data-num="${w.num}"`;
          return `
        <figure class="flying-carousel__card">
          <img src="${w.image}" srcset="${smallSrcFor(w.image)} 480w, ${w.image} 1120w" sizes="(max-width: 560px) 64vw, 34vw" alt="${title}" loading="${i === 0 ? "eager" : "lazy"}" data-magnify ${idAttr} />
          <span class="zoom-hint" aria-hidden="true" data-i18n="zoomhint.text">${t("zoomhint.text")}</span>
        </figure>`;
        })
        .join("");
    });
  }

  renderBento();
  renderCarousels();

  /* ---------------------------------------------------------------------
     2. Self-drawing logo — shared by the loader and the hero banner.
     Each stroked path normalizes its own length to 1 via the SVG
     "pathLength" attribute (see index.html), so this never has to
     measure real path geometry — it only staggers the reveal and
     resolves once the whole thing has actually finished drawing.
     --------------------------------------------------------------------- */
  function drawLogo(svg, opts = {}) {
    const {
      lineStagger = 40,
      lineDuration = 1000,
      dotStagger = 90,
      dotDuration = 600,
      dotGap = 250,
    } = opts;

    return new Promise((resolve) => {
      if (!svg) return resolve();
      const lines = Array.from(svg.querySelectorAll(".draw-line"));
      const dots = Array.from(svg.querySelectorAll(".draw-dot"));

      // Hard-reset to the hidden state with transitions off, so calling
      // this again on an already-drawn logo (the hero's click-to-replay)
      // snaps back invisibly instead of visibly "undrawing" first. Uses a
      // dedicated class rather than the "transition" shorthand inline —
      // that shorthand also resets transition-duration/-delay, which
      // would wipe the per-line stagger set just below.
      svg.classList.remove("is-drawing");
      dots.forEach((dot) => dot.classList.remove("is-visible"));
      svg.classList.add("is-resetting");
      void svg.offsetWidth; // force the reset above to commit before continuing

      lines.forEach((line, i) => {
        line.style.transitionDuration = `${lineDuration}ms`;
        line.style.transitionDelay = `${i * lineStagger}ms`;
      });
      const dotStart = lines.length * lineStagger + dotGap;
      dots.forEach((dot, i) => {
        dot.style.transitionDuration = `${dotDuration}ms`;
        dot.style.transitionDelay = `${dotStart + i * dotStagger}ms`;
      });

      requestAnimationFrame(() => {
        svg.classList.remove("is-resetting");
        // one more rAF so the browser commits the resting (fully-hidden)
        // state before the class flip, otherwise it can collapse straight
        // to drawn
        requestAnimationFrame(() => {
          svg.classList.add("is-drawing");
          dots.forEach((dot) => dot.classList.add("is-visible"));
        });
      });

      const totalMs = dotStart + Math.max(0, dots.length - 1) * dotStagger + dotDuration;
      setTimeout(resolve, totalMs);
    });
  }

  /* ---------------------------------------------------------------------
     3. Fullscreen overlay loader — waits on both real asset decode and
     the logo drawing. Not used on initial page load (see revealIntro()
     below); kept ready for whenever a real load gate is needed again.
     --------------------------------------------------------------------- */
  function boot() {
    const loader = document.getElementById("loader");
    loader.classList.add("is-active");
    const images = Array.from(document.images);

    const drawing = drawLogo(document.getElementById("loaderLogo"));

    const loaded = images.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) return resolve();
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        })
    );
    // race real asset loads against a short hard cap, so a slow or
    // blocked asset never traps the loader.
    const assetsReady = Promise.race([
      Promise.all(loaded),
      new Promise((resolve) => setTimeout(resolve, 1200)),
    ]);
    // the drawing itself needs time to read — never exit before it's done,
    // even when every asset is already cached and resolves instantly.
    const drawSettled = drawing.then(() => new Promise((resolve) => setTimeout(resolve, 200)));

    Promise.all([assetsReady, drawSettled]).then(finish);

    function finish() {
      if (loader.dataset.done) return;
      loader.dataset.done = "1";
      if (window.gsap) {
        gsap.to(loader, {
          yPercent: -100,
          duration: 0.9,
          ease: "power4.inOut",
          delay: 0.15,
          onComplete: () => (loader.style.display = "none"),
        });
      } else {
        loader.style.display = "none";
      }
      revealIntro();
    }
  }

  // Guards against the click-to-replay (see below) overlapping a run
  // already in progress — including the very first, page-load one.
  let heroIntroPlaying = false;

  function playHeroIntro() {
    const heroLogo = document.getElementById("heroLogo");
    if (heroIntroPlaying || !window.gsap || !heroLogo) return Promise.resolve();
    heroIntroPlaying = true;

    // the hero logo draws in slower and more deliberately than the loader's
    // — it's the first thing a visitor actually lingers on.
    return drawLogo(heroLogo, {
      lineStagger: 70,
      lineDuration: 1600,
      dotStagger: 140,
      dotDuration: 800,
      dotGap: 400,
    })
      .then(
        () =>
          new Promise((resolve) => {
            const textLines = ".hero__handle .line, .hero__tag .line";
            // GSAP caches whatever pixel offset the CSS translateY(110%)
            // already resolves to as its own separate "y" baseline the
            // first time it touches the element, then applies yPercent
            // additively on top of that — so tweening straight to
            // yPercent:0 leaves the CSS offset untouched instead of
            // clearing it. Explicitly zeroing y here decouples the two
            // (and gsap.set re-arms it cleanly on every replay too).
            gsap.set(textLines, { y: 0, yPercent: 110 });
            gsap.to(textLines, {
              yPercent: 0,
              duration: 0.9,
              ease: "power4.out",
              stagger: 0.08,
              onComplete: resolve,
            });
          })
      )
      .then(() => {
        heroIntroPlaying = false;
      });
  }

  function revealIntro() {
    const nav = document.querySelector("[data-reveal-nav]");
    if (nav) nav.classList.add("is-in");

    function unlockScroll() {
      document.documentElement.classList.remove("is-intro-locked");
      if (lenis) lenis.start();
    }

    if (!window.gsap || !document.getElementById("heroLogo")) {
      unlockScroll();
      return;
    }

    // nobody can scroll past the logo mid-draw on the first, page-load run
    document.documentElement.classList.add("is-intro-locked");
    if (lenis) lenis.stop();
    playHeroIntro().then(unlockScroll);
  }

  // Click the hero logo any time to watch it draw itself in again —
  // ignored while a run (including the initial one) is already playing.
  const heroLogoLink = document.querySelector(".hero__title a");
  if (heroLogoLink) {
    heroLogoLink.addEventListener("click", () => playHeroIntro());
  }

  /* ---------------------------------------------------------------------
     4. Text splitting — chars for the hero title, lines everywhere else
     --------------------------------------------------------------------- */
  function splitChars(el) {
    const text = el.textContent.trim();
    el.innerHTML = "";
    [...text].forEach((ch) => {
      const span = document.createElement("span");
      span.className = "char";
      span.textContent = ch === " " ? " " : ch;
      el.appendChild(span);
    });
  }

  function splitLines(el) {
    // Wrap existing inline markup (e.g. <em>) word by word, then group
    // words into line spans via a measuring pass.
    const words = el.innerHTML.trim().split(/\s+/);
    el.innerHTML = words
      .map((w) => `<span class="word" style="display:inline-block">${w}</span>`)
      .join(" ");

    const wordEls = Array.from(el.querySelectorAll(".word"));
    if (!wordEls.length) return;

    const lines = [];
    let currentTop = null;
    let currentWords = [];
    wordEls.forEach((w) => {
      const top = w.offsetTop;
      if (currentTop === null) currentTop = top;
      if (Math.abs(top - currentTop) > 2) {
        lines.push(currentWords);
        currentWords = [];
        currentTop = top;
      }
      currentWords.push(w.textContent);
    });
    if (currentWords.length) lines.push(currentWords);

    el.innerHTML = lines
      .map(
        (words) =>
          `<span class="line"><span>${words.join(" ")}</span></span>`
      )
      .join(" ");
  }

  document.querySelectorAll("[data-split-chars]").forEach(splitChars);
  document.querySelectorAll("[data-split-lines]").forEach(splitLines);

  /* ---------------------------------------------------------------------
     5. Smooth scroll (Lenis) + GSAP ScrollTrigger sync
     --------------------------------------------------------------------- */
  let lenis;
  if (window.Lenis && !prefersReduced) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
    });
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    // progress rail
    const railFill = document.getElementById("railFill");
    if (railFill) {
      gsap.to(railFill, {
        height: "100%",
        ease: "none",
        scrollTrigger: { start: 0, end: "max", scrub: true },
      });
    }

    // statement + about line reveals
    document.querySelectorAll(".statement__text .line > span, .about__text .line > span").forEach((span) => {
      // see the matching note in revealIntro(): without this y:0, GSAP
      // caches the CSS translateY(110%) as its own baseline and the
      // tween to yPercent:0 never actually clears the offset.
      gsap.set(span, { y: 0, yPercent: 110 });
      gsap.to(span, {
        yPercent: 0,
        duration: 1,
        ease: "power4.out",
        scrollTrigger: { trigger: span, start: "top 92%" },
      });
    });

  }

  const bentoItems = document.querySelectorAll(".bento__item");
  if (bentoItems.length) {
    if (window.IntersectionObserver) {
      const bentoObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              bentoObserver.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.01 }
      );
      bentoItems.forEach((item) => bentoObserver.observe(item));
    } else {
      bentoItems.forEach((item) => item.classList.add("is-in"));
    }
  }

  /* ---------------------------------------------------------------------
     6. Custom cursor
     --------------------------------------------------------------------- */
  if (!isCoarse) {
    const cursor = document.getElementById("cursor");
    const cursorLabel = document.getElementById("cursorLabel");
    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;
    let tx = cx;
    let ty = cy;

    window.addEventListener("mousemove", (e) => {
      tx = e.clientX;
      ty = e.clientY;
    });

    const render = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cursor.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);

    document.querySelectorAll("[data-cursor], a, button").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        cursor.classList.add("cursor--hover");
        cursorLabel.textContent = el.getAttribute("data-cursor") || "";
      });
      el.addEventListener("mouseleave", () => {
        cursor.classList.remove("cursor--hover");
        cursorLabel.textContent = "";
      });
    });

  }

  /* ---------------------------------------------------------------------
     7. Flying-card carousels (Fauna, Flora, Anatomy) — no boxed track,
     no arrows, no dots: every card floats on the page at once, the one
     at center is in full focus, and every other card fades, shrinks and
     softens the further it sits from center. Autoplay when idle, pauses
     on hover, drag/swipe to browse, click a side card to bring it to
     center.
     --------------------------------------------------------------------- */
  const AUTOPLAY_MS = 4200;

  // Populated per-carousel below, keyed by its root element, so the
  // magnifier (section 9, defined later) can pause/resume autoplay for
  // whichever carousel it just zoomed into — see zoomPaused below for why.
  const carouselAutoplay = new Map();

  function initCarousel(root) {
    const track = root.querySelector("[data-carousel-track]");
    const cards = track ? Array.from(track.children) : [];
    const section = root.closest(".carousel-section");
    const caption = section ? section.querySelector("[data-carousel-caption]") : null;
    if (!track || !cards.length) return;

    let index = 0;
    let timer = null;
    // True for as long as the zoom lens is open on this carousel's
    // centered card. Autoplay advancing the carousel would force-close
    // the lens (layout() below calls closeMagnifier() on every tick) —
    // hovering already clears the interval, but right-clicking doesn't
    // reliably keep "hovered" in every browser, so this is the
    // authoritative lock rather than a hover-timing side effect.
    let zoomPaused = false;

    function layout() {
      const n = cards.length;
      const spread = Math.max(root.clientWidth * 0.32, 160);
      cards.forEach((card, i) => {
        let offset = i - index;
        if (offset > n / 2) offset -= n;
        if (offset < -n / 2) offset += n;
        const abs = Math.abs(offset);
        const isCenter = abs === 0;
        const x = offset * spread;
        const scale = Math.max(0.48, 1 - abs * 0.22);
        const opacity = abs > 2.4 ? 0 : Math.max(0, 1 - abs * 0.42);
        const blur = isCenter ? 0 : Math.min(abs * 1.5, 4);
        card.style.transform = `translate(-50%, -50%) translateX(${x}px) scale(${scale})`;
        card.style.opacity = String(opacity);
        card.style.filter = isCenter ? "none" : `blur(${blur}px)`;
        card.style.zIndex = String(100 - Math.round(abs * 10));
        card.style.pointerEvents = abs > 2.4 ? "none" : "auto";
        card.classList.toggle("is-center", isCenter);
      });
      if (caption) {
        const img = cards[index] && cards[index].querySelector("img");
        caption.textContent = img ? img.getAttribute("alt") || "" : "";
        caption.classList.toggle("is-visible", !!img);
      }
      // scoped to this carousel — a different carousel's autoplay
      // shouldn't be able to close a lens that isn't even showing one
      // of its own pieces (see closeMagnifier's definition, section 9)
      closeMagnifier(root);
    }

    function go(next) {
      const n = cards.length;
      index = (next + n) % n;
      layout();
    }
    function restart() {
      clearInterval(timer);
      if (zoomPaused || prefersReduced || cards.length < 2) return;
      timer = setInterval(() => go(index + 1), AUTOPLAY_MS);
    }

    carouselAutoplay.set(root, {
      pause() {
        zoomPaused = true;
        clearInterval(timer);
      },
      resume() {
        zoomPaused = false;
        restart();
      },
    });

    cards.forEach((card, i) => {
      card.addEventListener("click", () => {
        if (i !== index) {
          go(i);
          restart();
        }
      });
    });

    root.addEventListener("mouseenter", () => clearInterval(timer));
    root.addEventListener("mouseleave", () => restart());

    // drag / swipe — released anywhere on the page, not just over the track
    let dragging = false;
    let startX = 0;
    track.addEventListener("pointerdown", (e) => {
      dragging = true;
      startX = e.clientX;
    });
    window.addEventListener("pointerup", (e) => {
      if (!dragging) return;
      dragging = false;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 40) {
        go(index + (dx < 0 ? 1 : -1));
        restart();
      }
    });

    window.addEventListener("resize", layout);

    layout();
    restart();
  }

  document.querySelectorAll("[data-carousel]").forEach(initCarousel);

  /* ---------------------------------------------------------------------
     8. Magnetic buttons
     --------------------------------------------------------------------- */
  if (!isCoarse && window.gsap) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      const strength = 0.4;
      const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * strength);
        yTo((e.clientY - r.top - r.height / 2) * strength);
      });
      el.addEventListener("mouseleave", () => {
        xTo(0);
        yTo(0);
      });
    });
  }

  /* ---------------------------------------------------------------------
     9. Right-click-to-magnify lens — right-click any bento/carousel
     image and a larger circle follows the cursor, showing that same
     image zoomed in at its native resolution (the fix for "I want to
     see detail" that doesn't reintroduce the earlier pixelation
     problem, since it reveals real pixels rather than stretching a
     small file bigger).

     Every work has a matching "-full" webp (see js/data.js images vs.
     images/works/*-full.webp) at roughly double the linear resolution —
     kept out of the on-page <img> so normal browsing never pays for it,
     and only fetched the moment the lens actually opens. The lens shows
     the on-page image instantly (already loaded, no wait), then swaps
     to the full-res one the moment it's decoded — a flash of the
     already-visible image beats a blank lens while the bigger file
     downloads.
     --------------------------------------------------------------------- */
  // Shared by the magnifier below and the fullscreen lightbox (section 10)
  // — every work has a matching "-full" webp at roughly double the linear
  // resolution (see js/data.js images vs. images/works/*-full.webp).
  function fullSrcFor(img) {
    // currentSrc reflects whichever srcset candidate the browser actually
    // picked — on a phone that's usually the "-small" thumbnail, so that
    // has to be normalized back to the base name before appending "-full",
    // or this would resolve to a nonexistent "*-small-full.webp".
    const base = (img.currentSrc || img.src).replace(/-small\.webp(\?.*)?$/, ".webp$1");
    return base.replace(/\.webp(\?.*)?$/, "-full.webp$1");
  }

  if (!isCoarse) {
    const magnifier = document.getElementById("magnifier");
    const ZOOM = 4;
    const LENS = 420;
    let active = false;
    let activeImg = null;
    let rect = null;
    // Whichever carousel's autoplay is currently paused for the lens, if
    // any — set in open(), cleared and resumed in close().
    let pausedCarousel = null;

    function place(clientX, clientY) {
      magnifier.style.transform = `translate(${clientX - LENS / 2}px, ${clientY - LENS / 2}px)`;
      // Clamped rather than closed on out-of-bounds: right-click is a
      // deliberate "enter zoom mode" now, not a hover state, so drifting
      // slightly past the source image's edge while exploring detail
      // near a corner shouldn't slam the lens shut. It just holds the
      // nearest edge of the image until the cursor comes back over it.
      const relX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const relY = Math.max(0, Math.min(rect.height, clientY - rect.top));
      magnifier.style.backgroundPosition = `${-(relX * ZOOM - LENS / 2)}px ${-(relY * ZOOM - LENS / 2)}px`;
    }

    function open(img, clientX, clientY) {
      active = true;
      activeImg = img;
      rect = img.getBoundingClientRect();
      magnifier.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
      magnifier.style.backgroundSize = `${rect.width * ZOOM}px ${rect.height * ZOOM}px`;
      magnifier.classList.add("is-active");
      document.documentElement.classList.add("is-magnifying");
      place(clientX, clientY);

      // Autoplay advancing mid-zoom would force-close the lens (see
      // layout()'s closeMagnifier() call) — pause it for as long as the
      // lens is open, not just while the mouse happens to still read as
      // "hovering" after a right-click.
      const carouselRoot = img.closest("[data-carousel]");
      if (carouselRoot && carouselAutoplay.has(carouselRoot)) {
        carouselAutoplay.get(carouselRoot).pause();
        pausedCarousel = carouselRoot;
      }

      const fullSrc = fullSrcFor(img);
      const preload = new Image();
      preload.onload = () => {
        if (activeImg === img) magnifier.style.backgroundImage = `url("${fullSrc}")`;
      };
      preload.src = fullSrc;
    }

    function close() {
      if (!active) return;
      active = false;
      activeImg = null;
      magnifier.classList.remove("is-active");
      document.documentElement.classList.remove("is-magnifying");
      if (pausedCarousel) {
        carouselAutoplay.get(pausedCarousel).resume();
        pausedCarousel = null;
      }
    }
    // closeMagnifier is shared globally (every carousel's layout() calls
    // it, see section 7) — without a scope check here, ANY carousel's
    // autoplay tick would close a lens that's actually showing a piece
    // from a completely different carousel (or bento). Passing a scope
    // element makes it a no-op unless the currently zoomed image is
    // actually inside that element; called with no argument, it always
    // closes (used by the lightbox, which should dismiss any lens
    // regardless of where it came from).
    closeMagnifier = (scopeEl) => {
      if (scopeEl && (!activeImg || !scopeEl.contains(activeImg))) return;
      close();
    };

    // Right-click opens the lens, on every piece everywhere (bento and
    // carousel alike) — a plain hover or left-click both already do
    // something else (nothing, and open the fullscreen lightbox, see
    // section 10), so hanging the lens off either of those meant two
    // features fighting over one gesture. A separate mouse button
    // sidesteps that entirely, no matter which gallery the piece is in.
    // Carousel cards still only respond while centered — off-center
    // ones are faded/scaled and not meant to be inspected.
    document.querySelectorAll("[data-magnify]").forEach((img) => {
      const flyingCard = img.closest(".flying-carousel__card");
      img.addEventListener("contextmenu", (e) => {
        // suppressed unconditionally so right-click reads as "this is the
        // zoom button" everywhere, never a surprise native menu — even on
        // an off-center carousel card, where it just doesn't open the lens
        e.preventDefault();
        if (flyingCard && !flyingCard.classList.contains("is-center")) return;
        if (active && activeImg === img) {
          close();
          return;
        }
        open(img, e.clientX, e.clientY);
      });
    });

    window.addEventListener("mousemove", (e) => {
      if (active) place(e.clientX, e.clientY);
    });
    window.addEventListener("scroll", close, { passive: true, capture: true });
    window.addEventListener("resize", close);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  /* ---------------------------------------------------------------------
     10. Fullscreen lightbox — click/tap any work to see it large, at
     full resolution, with prev/next through whichever gallery it came
     from. Deliberately outside the `isCoarse` gate above: the magnifier
     needs a mouse to drag around, so it's desktop-only, but this is the
     only way touch visitors get to see any extra detail at all.
     --------------------------------------------------------------------- */
  (function initLightbox() {
    const lightbox = document.getElementById("lightbox");
    if (!lightbox) return;
    const imgEl = document.getElementById("lightboxImg");
    const captionEl = document.getElementById("lightboxCaption");
    const closeBtn = document.getElementById("lightboxClose");
    const prevBtn = document.getElementById("lightboxPrev");
    const nextBtn = document.getElementById("lightboxNext");

    let gallery = [];
    let index = 0;
    let active = false;

    function show(i) {
      index = (i + gallery.length) % gallery.length;
      const img = gallery[index];
      // same instant-then-upgrade trick as the magnifier: the on-page
      // thumbnail is already loaded, so show that first rather than a
      // blank frame while the much bigger full-res file downloads.
      imgEl.src = img.currentSrc || img.src;
      imgEl.alt = img.alt;
      captionEl.textContent = img.alt;
      resetZoom(false);

      const fullSrc = fullSrcFor(img);
      const preload = new Image();
      preload.onload = () => {
        if (gallery[index] === img) imgEl.src = fullSrc;
      };
      preload.src = fullSrc;
    }

    function open(list, startIndex) {
      gallery = list;
      active = true;
      lightbox.classList.add("is-active");
      lightbox.setAttribute("aria-hidden", "false");
      document.documentElement.classList.add("is-lightbox-open");
      if (lenis) lenis.stop();
      closeMagnifier();
      show(startIndex);
    }

    function close() {
      if (!active) return;
      active = false;
      lightbox.classList.remove("is-active");
      lightbox.setAttribute("aria-hidden", "true");
      document.documentElement.classList.remove("is-lightbox-open");
      if (lenis) lenis.start();
      resetZoom(false);
    }

    /* ---------------------------------------------------------------------
       Pinch + double-tap zoom. No mouse-drag lens equivalent exists on
       touch (see section 9's own comment on why a loupe doesn't work
       under a finger) — this is the touch-native substitute: pinch to
       zoom continuously, drag to pan once zoomed, double-tap to toggle.
       Built on Pointer Events so the same code also gives desktop mouse
       users double-click-to-zoom for free, at no extra cost.
       --------------------------------------------------------------------- */
    const MIN_SCALE = 1;
    const MAX_SCALE = 4;
    const DOUBLE_TAP_SCALE = 2.5;
    let scale = 1;
    let panX = 0;
    let panY = 0;
    const pointers = new Map();
    let pinchStartDist = 0;
    let pinchStartScale = 1;
    let dragLast = null;
    let lastTap = { time: 0, x: 0, y: 0 };
    let tapStart = null;

    function clampNum(v, lo, hi) {
      return Math.min(hi, Math.max(lo, v));
    }

    function clampPan() {
      const maxX = Math.max(0, (imgEl.offsetWidth * (scale - 1)) / 2);
      const maxY = Math.max(0, (imgEl.offsetHeight * (scale - 1)) / 2);
      panX = clampNum(panX, -maxX, maxX);
      panY = clampNum(panY, -maxY, maxY);
    }

    function applyZoomTransform(animate) {
      imgEl.style.transition = animate ? "transform .3s var(--ease)" : "none";
      imgEl.style.transform = scale === 1 ? "" : `translate(${panX}px, ${panY}px) scale(${scale})`;
      imgEl.classList.toggle("is-zoomed", scale > 1);
    }

    function resetZoom(animate) {
      scale = 1;
      panX = 0;
      panY = 0;
      applyZoomTransform(animate);
    }

    // Rescales toward (clientX, clientY) while keeping that point visually
    // still — the standard "zoom to point" trick: transform-origin sits at
    // the element's own center, so a point's unscaled offset from that
    // center can be read straight off the live (already-transformed)
    // bounding rect, then re-applied as a pan delta once the new scale
    // moves it. Self-correcting every call, so it never drifts even
    // across many rapid pinch/pointermove events.
    function zoomToPoint(clientX, clientY, newScale, animate) {
      newScale = clampNum(newScale, MIN_SCALE, MAX_SCALE);
      const rect = imgEl.getBoundingClientRect();
      const localX = (clientX - rect.left - rect.width / 2) / scale;
      const localY = (clientY - rect.top - rect.height / 2) / scale;
      panX += -localX * (newScale - scale);
      panY += -localY * (newScale - scale);
      scale = newScale;
      clampPan();
      applyZoomTransform(animate);
    }

    imgEl.addEventListener("pointerdown", (e) => {
      if (!active) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        tapStart = { x: e.clientX, y: e.clientY, time: Date.now() };
        if (scale > 1) dragLast = { x: e.clientX, y: e.clientY };
      } else if (pointers.size === 2) {
        tapStart = null;
        const [a, b] = Array.from(pointers.values());
        pinchStartDist = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        pinchStartScale = scale;
      }
    });

    imgEl.addEventListener("pointermove", (e) => {
      if (!active || !pointers.has(e.pointerId)) return;
      e.preventDefault();
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 2) {
        const [a, b] = Array.from(pointers.values());
        const dist = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        const newScale = (pinchStartScale * dist) / pinchStartDist;
        zoomToPoint((a.x + b.x) / 2, (a.y + b.y) / 2, newScale, false);
      } else if (pointers.size === 1 && dragLast) {
        panX += e.clientX - dragLast.x;
        panY += e.clientY - dragLast.y;
        dragLast = { x: e.clientX, y: e.clientY };
        clampPan();
        applyZoomTransform(false);
      }
    });

    function endPointer(e) {
      pointers.delete(e.pointerId);
      dragLast = null;
      if (pointers.size === 0 && tapStart) {
        const moved = Math.hypot(e.clientX - tapStart.x, e.clientY - tapStart.y);
        const quick = Date.now() - tapStart.time < 400;
        if (moved < 12 && quick) {
          const since = tapStart.time - lastTap.time;
          const near = Math.hypot(tapStart.x - lastTap.x, tapStart.y - lastTap.y) < 40;
          if (since < 300 && near) {
            if (scale > 1) resetZoom(true);
            else zoomToPoint(tapStart.x, tapStart.y, DOUBLE_TAP_SCALE, true);
            lastTap = { time: 0, x: 0, y: 0 };
          } else {
            lastTap = { time: tapStart.time, x: tapStart.x, y: tapStart.y };
          }
        }
      }
      tapStart = null;
      if (pointers.size === 1 && scale > 1) {
        const [p] = Array.from(pointers.values());
        dragLast = { x: p.x, y: p.y };
      }
    }
    imgEl.addEventListener("pointerup", endPointer);
    imgEl.addEventListener("pointercancel", endPointer);
    window.addEventListener("resize", () => clampPan());

    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", () => show(index - 1));
    nextBtn.addEventListener("click", () => show(index + 1));
    // click the backdrop (not the image or the buttons) to dismiss
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) close();
    });
    document.addEventListener("keydown", (e) => {
      if (!active) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(index - 1);
      if (e.key === "ArrowRight") show(index + 1);
    });

    document.querySelectorAll(".bento__item img").forEach((img) => {
      img.addEventListener("click", () => {
        const list = Array.from(document.querySelectorAll(".bento__item img"));
        open(list, list.indexOf(img));
      });
    });

    // Carousel cards already have their own click handler that recenters
    // an off-center card (see initCarousel) — this only ever fires for
    // the centered one, so the two never fight over the same click.
    document.querySelectorAll(".flying-carousel__card img").forEach((img) => {
      img.addEventListener("click", () => {
        const card = img.closest(".flying-carousel__card");
        if (!card.classList.contains("is-center")) return;
        const track = card.closest(".flying-carousel__track");
        const list = Array.from(track.querySelectorAll("img"));
        open(list, list.indexOf(img));
      });
    });
  })();

  /* ---------------------------------------------------------------------
     11. Language switch — sweeps existing DOM in place rather than
     re-rendering, so it never disturbs the bento/carousel/magnifier
     listeners already bound above. Per-item titles go through WORKS/
     SKETCHES via data-id/data-num (set by bentoFigure/renderCarousels)
     since they're per-item data, not fixed dictionary strings.
     --------------------------------------------------------------------- */
  function applyLanguage(lang) {
    currentLang = lang === "en" ? "en" : "es";
    try {
      localStorage.setItem("lang", currentLang);
    } catch (e) {}
    document.documentElement.lang = currentLang;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });
    document.querySelectorAll("[data-i18n-cursor]").forEach((el) => {
      el.setAttribute("data-cursor", t(el.getAttribute("data-i18n-cursor")));
    });
    document.querySelectorAll("[data-id]").forEach((img) => {
      const w = WORKS.find((wk) => wk.id === img.getAttribute("data-id"));
      if (w) img.alt = workTitle(w);
    });
    document.querySelectorAll("[data-num]").forEach((img) => {
      img.alt = sketchTitle(Number(img.getAttribute("data-num")));
    });

    // Carousel captions and each carousel's layout() read the alt text
    // straight off the currently-centered card, so a resize tick (already
    // wired to layout() per carousel) is all that's needed to refresh them.
    window.dispatchEvent(new Event("resize"));
  }

  const langToggle = document.getElementById("langToggle");
  if (langToggle) {
    langToggle.addEventListener("click", () => applyLanguage(currentLang === "es" ? "en" : "es"));
  }
  applyLanguage(currentLang);

  /* ---------------------------------------------------------------------
     12. Misc
     --------------------------------------------------------------------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Runs last, once everything above (including Lenis in section 5) has
  // initialized — the hero banner's own logo-draw is the entry animation
  // now, no fullscreen overlay needed for a page with no real asset wait.
  // boot() still exists, fully wired, for whenever a real load gate is
  // needed again (e.g. a slow initial data fetch) — just call it instead.
  revealIntro();
})();
