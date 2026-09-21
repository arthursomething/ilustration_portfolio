/* ==========================================================================
   Arthur — Prints / catalog page
   Standalone script: header, custom cursor and the language toggle only.
   No GSAP/Lenis here — nothing on this page scrolls or animates yet. Once
   real pieces exist, render them into [data-prints-root] (see the empty
   [data-prints-empty] block this replaces) and reuse the bento-style
   card markup so the existing lightbox/magnifier code can pick them up.
   ========================================================================== */
(() => {
  "use strict";

  document.documentElement.classList.remove("no-js");
  const isCoarse = window.matchMedia("(hover: none)").matches || window.innerWidth < 760;

  /* ---------------------------------------------------------------------
     Language — same dictionary and localStorage key as the main site
     (js/i18n.js), so the choice made on either page carries over.
     --------------------------------------------------------------------- */
  let currentLang = localStorage.getItem("lang") === "en" ? "en" : "es";
  function t(key) {
    const dict = (window.I18N && window.I18N[currentLang]) || {};
    return dict[key] || key;
  }

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
  }

  const langToggle = document.getElementById("langToggle");
  if (langToggle) {
    langToggle.addEventListener("click", () => applyLanguage(currentLang === "es" ? "en" : "es"));
  }
  applyLanguage(currentLang);

  /* ---------------------------------------------------------------------
     Custom cursor — identical to the main site's (js/main.js section 6).
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
