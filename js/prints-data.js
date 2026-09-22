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
 *    size (sizeEs optional, only needed if the size text itself
 *    contains words to translate, e.g. "Tabloid"), note/noteEs and the
 *    images array. images can point straight at an existing WORKS
 *    image (js/data.js) instead of a new photo shoot, e.g. for a
 *    pre-order poster of a piece that hasn't been printed yet.
 * 3. Set buyUrl to the Stripe Payment Link for this piece once created
 *    (stripe.com/payment-links — no code needed, just a product + a
 *    price in the Stripe dashboard). Leave it "" to show "Coming soon"
 *    instead of a working buy button.
 * 4. portfolioId is optional — set it to a WORKS id (js/data.js) to
 *    link back to the original digital piece, if there is one.
 * 5. images[0] is used as the card's main photo (see .print-card__main
 *    in css/styles.css) at a fixed 3:4 ratio, and is also what opens in
 *    the lightbox — so if the raw photo needs a specific crop to look
 *    right (e.g. it's a tall phone photo with a lot of bare table),
 *    pre-crop that source file itself rather than trying to fix it with
 *    CSS object-position, so the lightbox's full-res view matches what
 *    the card shows instead of opening the uncropped original.
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
  {
    id: "02",
    title: "Shawn James Mexico 2026",
    titleEs: "Shawn James Mexico 2026",
    price: 348,
    currency: "MXN",
    medium: "Risograph print, one ink color, on 200gsm Bristol paper",
    mediumEs: "Risografía, un color de tinta, sobre papel Bristol de 200gr",
    size: "Tabloid (28 × 43 cm)",
    sizeEs: "Tabloide (28 × 43 cm)",
    note: "Pre-order. Printed once orders are in, delivered in person in Mexico City",
    noteEs: "Pre-venta. Se imprime una vez recibidos los pedidos, con entrega en persona en Ciudad de México",
    images: ["images/works/11.webp"],
    buyUrl: "https://buy.stripe.com/eVqaEQdGK0b1c9a5m05sA01",
    portfolioId: "11",
  },
];
