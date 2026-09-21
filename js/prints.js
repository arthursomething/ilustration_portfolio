/* ==========================================================================
   Arthur — Prints / catalog page
   Standalone script: renders js/prints-data.js into cards, plus the same
   header/cursor/language behavior as the main site. No GSAP/Lenis here —
   nothing on this page scrolls or animates yet.
   ========================================================================== */
(() => {
  "use strict";

  document.documentElement.classList.remove("no-js");
  const isCoarse = window.matchMedia("(hover: none)").matches || window.innerWidth < 760;
  const PRINTS = window.PRINTS || [];

  let currentLang = localStorage.getItem("lang") === "en" ? "en" : "es";
  function t(key) {
    const dict = (window.I18N && window.I18N[currentLang]) || {};
    return dict[key] || key;
  }
  function printTitle(p) {
    return currentLang === "es" && p.titleEs ? p.titleEs : p.title;
  }
  function printMedium(p) {
    return currentLang === "es" && p.mediumEs ? p.mediumEs : p.medium;
  }
  function printNote(p) {
    return currentLang === "es" && p.noteEs ? p.noteEs : p.note;
  }

  // Every print photo also has -small (~480w) and -full (original res)
  // siblings, generated the same way as the portfolio's own images.
  function smallSrc(src) {
    return src.replace(/\.webp(\?.*)?$/, "-small.webp$1");
  }
  function fullSrc(src) {
    return src.replace(/\.webp(\?.*)?$/, "-full.webp$1");
  }

  /* ---------------------------------------------------------------------
     Render — a card per piece: a gallery (main photo + clickable
     thumbnails, since this page has no shared lightbox/magnifier of its
     own) and an info column with specs, price and the buy link. Falls
     back to the empty state when there's nothing to sell yet.
     --------------------------------------------------------------------- */
  function printCard(p) {
    const title = printTitle(p);
    const thumbs = p.images
      .map(
        (img, i) => `
        <button class="print-card__thumb${i === 0 ? " is-active" : ""}" type="button" data-thumb data-src="${img}" data-full="${fullSrc(img)}">
          <img src="${smallSrc(img)}" alt="" loading="lazy" />
        </button>`
      )
      .join("");

    const buy = p.buyUrl
      ? `<a class="print-card__buy" href="${p.buyUrl}" target="_blank" rel="noopener noreferrer" data-i18n="prints.buy">${t("prints.buy")}</a>`
      : `<span class="print-card__buy print-card__buy--disabled" data-i18n="prints.comingSoon">${t("prints.comingSoon")}</span>`;

    return `
      <article class="print-card" data-print-id="${p.id}">
        <div class="print-card__gallery">
          <button class="print-card__main" type="button" data-open-lightbox data-cursor="view" data-i18n-cursor="cursor.view">
            <span class="print-card__main-frame">
              <img data-main-img src="${p.images[0]}" srcset="${smallSrc(p.images[0])} 480w, ${p.images[0]} 1200w" sizes="(max-width: 700px) 90vw, 42vw" alt="${title}" />
            </span>
          </button>
          <div class="print-card__thumbs">${thumbs}</div>
        </div>
        <div class="print-card__info">
          <h2 class="print-card__title">${title}</h2>
          <p class="print-card__medium">${printMedium(p)}</p>
          <p class="print-card__size">${p.size}</p>
          <p class="print-card__note">${printNote(p)}</p>
          <div class="print-card__price">$${p.price} ${p.currency}</div>
          ${buy}
        </div>
      </article>`;
  }

  function renderPrints() {
    const root = document.querySelector("[data-prints-root]");
    const empty = document.querySelector("[data-prints-empty]");
    if (!root) return;

    if (!PRINTS.length) {
      root.innerHTML = "";
      if (empty) empty.hidden = false;
      return;
    }

    if (empty) empty.hidden = true;
    root.innerHTML = PRINTS.map(printCard).join("");

    // Thumbnail click swaps the main preview photo; clicking the main
    // photo itself opens the fullscreen lightbox (see initLightbox below).
    root.querySelectorAll(".print-card").forEach((card) => {
      const main = card.querySelector("[data-main-img]");
      card.querySelectorAll("[data-thumb]").forEach((thumb) => {
        thumb.addEventListener("click", () => {
          card.querySelectorAll("[data-thumb]").forEach((el) => el.classList.remove("is-active"));
          thumb.classList.add("is-active");
          const src = thumb.getAttribute("data-src");
          main.src = src;
          main.srcset = `${smallSrc(src)} 480w, ${src} 1200w`;
        });
      });
    });
  }

  /* ---------------------------------------------------------------------
     Fullscreen lightbox — identical component/behavior to the main
     portfolio page's (js/main.js section 10), including pinch/double-tap
     zoom. Clicking a print's main photo opens it here, starting at
     whichever thumbnail is currently active, with prev/next cycling
     through that print's own photos.
     --------------------------------------------------------------------- */
  function initLightbox() {
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

    function fullSrcForImg(img) {
      const base = (img.currentSrc || img.src).replace(/-small\.webp(\?.*)?$/, ".webp$1");
      return base.replace(/\.webp(\?.*)?$/, "-full.webp$1");
    }

    function show(i) {
      index = (i + gallery.length) % gallery.length;
      const img = gallery[index];
      imgEl.src = img.currentSrc || img.src;
      imgEl.alt = img.alt;
      captionEl.textContent = img.alt;
      resetZoom(false);

      const full = fullSrcForImg(img);
      const preload = new Image();
      preload.onload = () => {
        if (gallery[index] === img) imgEl.src = full;
      };
      preload.src = full;
    }

    function open(list, startIndex) {
      gallery = list;
      active = true;
      lightbox.classList.add("is-active");
      lightbox.setAttribute("aria-hidden", "false");
      document.documentElement.classList.add("is-lightbox-open");
      show(startIndex);
    }

    function close() {
      if (!active) return;
      active = false;
      lightbox.classList.remove("is-active");
      lightbox.setAttribute("aria-hidden", "true");
      document.documentElement.classList.remove("is-lightbox-open");
      resetZoom(false);
    }

    // Pinch + double-tap zoom — see js/main.js section 10 for the full
    // rationale; ported as-is since the mechanics don't depend on
    // anything page-specific.
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
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) close();
    });
    document.addEventListener("keydown", (e) => {
      if (!active) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(index - 1);
      if (e.key === "ArrowRight") show(index + 1);
    });

    document.querySelectorAll(".print-card").forEach((card) => {
      const mainBtn = card.querySelector("[data-open-lightbox]");
      if (!mainBtn) return;
      mainBtn.addEventListener("click", () => {
        const list = Array.from(card.querySelectorAll(".print-card__thumb img"));
        const activeIndex = Array.from(card.querySelectorAll(".print-card__thumb")).findIndex((el) =>
          el.classList.contains("is-active")
        );
        open(list, activeIndex >= 0 ? activeIndex : 0);
      });
    });
  }

  /* ---------------------------------------------------------------------
     Language — same dictionary and localStorage key as the main site
     (js/i18n.js), so the choice made on either page carries over.
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

    // Per-item copy (title/medium/note) lives on the PRINTS entry itself,
    // not the dictionary, so it needs its own lookup rather than the
    // generic sweep above.
    document.querySelectorAll("[data-print-id]").forEach((card) => {
      const p = PRINTS.find((pr) => pr.id === card.getAttribute("data-print-id"));
      if (!p) return;
      card.querySelector(".print-card__title").textContent = printTitle(p);
      card.querySelector(".print-card__medium").textContent = printMedium(p);
      card.querySelector(".print-card__note").textContent = printNote(p);
      const mainImg = card.querySelector("[data-main-img]");
      if (mainImg) mainImg.alt = printTitle(p);
    });
  }

  renderPrints();
  initLightbox();

  const langToggle = document.getElementById("langToggle");
  if (langToggle) {
    langToggle.addEventListener("click", () => applyLanguage(currentLang === "es" ? "en" : "es"));
  }
  applyLanguage(currentLang);

  /* ---------------------------------------------------------------------
     Custom cursor — identical to the main site's (js/main.js section 6).
     Runs after renderPrints() so the buy/thumbnail/main-photo elements it
     just created are already in the DOM to bind to.
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

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
