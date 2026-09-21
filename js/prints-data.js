/**
 * PRINTS — physical pieces for sale (screen prints, pre-orders of
 * originals, etc). Rendered by js/prints.js into prints.html.
 *
 * HOW TO ADD A PIECE
 * 1. Drop its photos into images/prints/ as print-<id>-01.webp,
 *    -02.webp, etc (see js/prints-data.js images array below — the
 *    processing script used to generate the -small/-full tiers lives
 *    in the session scratchpad; ask for it again if you need it, or
 *    just resize to ~1200w display / ~480w small / original-w full).
 * 2. Add an entry here with title/titleEs, price, medium/mediumEs,
 *    size, note/noteEs and the images array.
 * 3. Set buyUrl to the Stripe Payment Link for this piece once created
 *    (stripe.com/payment-links — no code needed, just a product + a
 *    price in the Stripe dashboard). Leave it "" to show "Coming soon"
 *    instead of a working buy button.
 * 4. portfolioId is optional — set it to a WORKS id (js/data.js) to
 *    link back to the original digital piece, if there is one.
 */
window.PRINTS = [
  {
    id: "01",
    title: "Elegant Vase",
    titleEs: "Florero Elegante",
    price: 250,
    currency: "MXN",
    medium: "Screen print on textured paper, hand-finished details",
    mediumEs: "Serigrafía sobre papel texturizado, con detalles hechos a mano",
    size: "28 × 21 cm",
    note: "One physical piece. Delivered in person in Mexico City",
    noteEs: "Pieza física. Entrega en persona en Ciudad de México",
    images: [
      "images/prints/print-01-01.webp",
      "images/prints/print-01-02.webp",
      "images/prints/print-01-03.webp",
      "images/prints/print-01-04.webp",
      "images/prints/print-01-05.webp",
    ],
    buyUrl: "https://buy.stripe.com/9B628kgSWg9Zehi9Cg5sA00",
    portfolioId: "33",
  },
];
