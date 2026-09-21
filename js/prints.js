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
          <a class="print-card__main" href="${fullSrc(p.images[0])}" target="_blank" rel="noopener noreferrer" data-cursor="view" data-i18n-cursor="cursor.view">
            <img data-main-img src="${p.images[0]}" srcset="${smallSrc(p.images[0])} 480w, ${p.images[0]} 1200w" sizes="(max-width: 700px) 90vw, 42vw" alt="${title}" />
          </a>
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

    // Thumbnail click swaps the main photo (both the visible img and the
    // "open full-res" link it sits inside) rather than navigating anywhere.
    root.querySelectorAll(".print-card").forEach((card) => {
      const main = card.querySelector("[data-main-img]");
      const mainLink = card.querySelector(".print-card__main");
      card.querySelectorAll("[data-thumb]").forEach((thumb) => {
        thumb.addEventListener("click", () => {
          card.querySelectorAll("[data-thumb]").forEach((el) => el.classList.remove("is-active"));
          thumb.classList.add("is-active");
          const src = thumb.getAttribute("data-src");
          main.src = src;
          main.srcset = `${smallSrc(src)} 480w, ${src} 1200w`;
          mainLink.href = thumb.getAttribute("data-full");
        });
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
