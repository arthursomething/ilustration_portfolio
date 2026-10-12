/* ==========================================================================
   Arthur — Illustration portfolio
   Casual-save deterrents, shared by both pages. Worth being honest about
   what this actually does: it removes the native right-click "Save Image
   As" menu, nothing more. It does NOT stop anyone who opens devtools, uses
   "view source", reads the Network tab, or just takes a screenshot — none
   of that is preventable client-side, by this or by anything else. This
   only raises the casual, one-click path.

   Index.html's own bento/carousel images (data-magnify, see js/main.js
   section 9) already call preventDefault() in their own contextmenu
   handler to open the zoom lens instead — this document-level listener
   runs in addition to that, not instead of it, so the lens is unaffected.
   What it actually adds is coverage for every image that handler doesn't
   reach: prints.html's cards, the shared lightbox, and any future gallery
   that doesn't have its own data-magnify zoom (e.g. a plain carousel).
   ========================================================================== */
(() => {
  "use strict";
  document.addEventListener(
    "contextmenu",
    (e) => {
      if (e.target.tagName === "IMG") e.preventDefault();
    },
    true
  );
})();
