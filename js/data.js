/**
 * WORK DATA — edit this file to swap in your real pieces.
 *
 * HOW TO ADD YOUR OWN ARTWORK
 * 1. Drop your image file into images/works/ (or images/sketches/ for the
 *    horizontal studies strip). JPG, PNG or WEBP, ideally under ~2MB each.
 * 2. Change the "image" path below to match your filename.
 * 3. Edit title / year / medium / note to describe the piece.
 * 4. Set "category" to one of the CATEGORIES slugs below — this decides
 *    which group the piece falls into in the "Selected Works" index.
 * 5. One entry per category with featured:true becomes that category's
 *    large full-bleed reveal near the top of the page. Every entry
 *    (featured or not) still shows in the index further down.
 *
 * Nothing else in the code needs to change — the page renders from
 * these arrays. Add or remove works freely; add a new category by
 * adding it to CATEGORIES and using its slug on some works.
 */
window.CATEGORIES = [
  { slug: "faces", label: "Faces" },
  { slug: "concepts", label: "Concepts" },
  { slug: "fauna", label: "Fauna" },
  { slug: "flora", label: "Flora" }];

window.WORKS = [
  { id: "01", title: "Portrait — Warm Contrast", titleEs: "Retrato en Contraste Cálido", year: "", medium: "Illustration", note: "", image: "images/works/01.webp", category: "faces", featured: true },
  { id: "02", title: "Portrait Study I", titleEs: "Estudio de Retrato I", year: "", medium: "Illustration", note: "", image: "images/works/02.webp", category: "faces", featured: false, bw: true },
  { id: "03", title: "Portrait Study II", titleEs: "Estudio de Retrato II", year: "", medium: "Illustration", note: "", image: "images/works/03.webp", category: "faces", featured: false },
  { id: "04", title: "Classical Head Study", titleEs: "Estudio de Cabeza Clásica", year: "", medium: "Illustration", note: "", image: "images/works/04.webp", category: "faces", featured: false, bw: true },
  { id: "05", title: "The Match", titleEs: "El Partido", year: "", medium: "Illustration", note: "", image: "images/works/05.webp", category: "concepts", featured: true, bw: true },
  { id: "06", title: "Smoke Study", titleEs: "Estudio de Humo", year: "", medium: "Illustration", note: "", image: "images/works/06.webp", category: "concepts", featured: false, bw: true },
  { id: "07", title: "Face Among Fish", titleEs: "Rostro Entre Peces", year: "", medium: "Illustration", note: "", image: "images/works/07.webp", category: "concepts", featured: false, bw: true },
  { id: "08", title: "Masked Vigilante", titleEs: "Vigilante Enmascarado", year: "", medium: "Illustration", note: "", image: "images/works/08.webp", category: "concepts", featured: false, bw: true },
  { id: "09", title: "Beetle", titleEs: "Vocho", year: "", medium: "Illustration", note: "", image: "images/works/09.webp", category: "concepts", featured: false, bw: true },
  { id: "10", title: "Still Life — Kettle", titleEs: "Naturaleza Muerta con Tetera", year: "", medium: "Illustration", note: "", image: "images/works/10.webp", category: "concepts", featured: false, bw: true },
  { id: "11", title: "Hourglass", titleEs: "Reloj de Arena", year: "", medium: "Illustration", note: "", image: "images/works/11.webp", category: "concepts", featured: false, bw: true },
  { id: "12", title: "The Star", titleEs: "La Estrella", year: "", medium: "Illustration", note: "", image: "images/works/12.webp", category: "concepts", featured: false, bw: true },
  { id: "13", title: "Lucha Cherub", titleEs: "Querubín Luchador", year: "", medium: "Illustration", note: "", image: "images/works/13.webp", category: "concepts", featured: false },
  { id: "14", title: "Smoke & Bulb", titleEs: "Humo y Foco", year: "", medium: "Illustration", note: "", image: "images/works/14.webp", category: "concepts", featured: false, bw: true },
  { id: "15", title: "2026", titleEs: "2026", year: "", medium: "Illustration", note: "", image: "images/works/15.webp", category: "concepts", featured: false, bw: true },
  { id: "16", title: "Mechanical Pufferfish", titleEs: "Pez Globo Mecánico", year: "", medium: "Illustration", note: "", image: "images/works/16.webp", category: "concepts", featured: false, bw: true },
  { id: "17", title: "The Bell Jar", titleEs: "La Campana de Cristal", year: "", medium: "Illustration", note: "", image: "images/works/17.webp", category: "concepts", featured: false, bw: true },
  { id: "18", title: "Leaf Head I", titleEs: "Cabeza de Hojas I", year: "", medium: "Illustration", note: "", image: "images/works/18.webp", category: "concepts", featured: false, bw: true },
  { id: "19", title: "Signal", titleEs: "Semáforo", year: "", medium: "Illustration", note: "", image: "images/works/19.webp", category: "concepts", featured: false, bw: true },
  { id: "20", title: "Leaf Head II", titleEs: "Cabeza de Hojas II", year: "", medium: "Illustration", note: "", image: "images/works/20.webp", category: "concepts", featured: false },
  { id: "21", title: "Octopus I", titleEs: "Pulpo I", year: "", medium: "Illustration", note: "", image: "images/works/21.webp", category: "fauna", featured: true },
  { id: "22", title: "Octopus II", titleEs: "Pulpo II", year: "", medium: "Illustration", note: "", image: "images/works/22.webp", category: "fauna", featured: false },
  { id: "23", title: "Peony", titleEs: "Peonía", year: "", medium: "Illustration", note: "", image: "images/works/23.webp", category: "flora", featured: true },
  { id: "24", title: "Potted Plant I", titleEs: "Planta en Maceta I", year: "", medium: "Illustration", note: "", image: "images/works/24.webp", category: "flora", featured: false },
  { id: "25", title: "Floral Branch I", titleEs: "Rama Floral I", year: "", medium: "Illustration", note: "", image: "images/works/25.webp", category: "flora", featured: false },
  { id: "26", title: "Magnolia Branch", titleEs: "Rama de Magnolia", year: "", medium: "Illustration", note: "", image: "images/works/26.webp", category: "flora", featured: false },
  { id: "27", title: "Petunia Bouquet", titleEs: "Ramo de Petunias", year: "", medium: "Illustration", note: "", image: "images/works/27.webp", category: "flora", featured: false },
  { id: "28", title: "Hibiscus Bouquet", titleEs: "Ramo de Hibisco", year: "", medium: "Illustration", note: "", image: "images/works/28.webp", category: "flora", featured: false },
  { id: "29", title: "Potted Plant II", titleEs: "Planta en Maceta II", year: "", medium: "Illustration", note: "", image: "images/works/29.webp", category: "flora", featured: false },
  { id: "30", title: "Potted Plant III", titleEs: "Planta en Maceta III", year: "", medium: "Illustration", note: "", image: "images/works/30.webp", category: "flora", featured: false },
  { id: "31", title: "Floral Study I", titleEs: "Estudio Floral I", year: "", medium: "Illustration", note: "", image: "images/works/31.webp", category: "flora", featured: false },
  { id: "32", title: "Floral Study II", titleEs: "Estudio Floral II", year: "", medium: "Illustration", note: "", image: "images/works/32.webp", category: "flora", featured: false },
  { id: "33", title: "Flowers in a Jar", titleEs: "Flores en un Frasco", year: "", medium: "Illustration", note: "", image: "images/works/33.webp", category: "flora", featured: false },
  { id: "34", title: "Flower Stem", titleEs: "Tallo de Flor", year: "", medium: "Illustration", note: "", image: "images/works/34.webp", category: "flora", featured: false },
  { id: "35", title: "Rose Pattern", titleEs: "Patrón de Rosas", year: "", medium: "Illustration", note: "", image: "images/works/35.webp", category: "flora", featured: false },
  { id: "36", title: "Eagle & Serpent", titleEs: "Águila y Serpiente", year: "", medium: "Illustration", note: "", image: "images/works/36.webp", category: "concepts", featured: false, bw: true },
  { id: "37", title: "Carousel Horse", titleEs: "Caballo de Carrusel", year: "", medium: "Illustration", note: "", image: "images/works/37.webp", category: "concepts", featured: false, bw: true }
];

window.SKETCHES = [
  { id: "s1", image: "images/sketches/s1.webp" },
  { id: "s2", image: "images/sketches/s2.webp" },
  { id: "s3", image: "images/sketches/s3.webp" },
  { id: "s4", image: "images/sketches/s4.webp" },
  { id: "s5", image: "images/sketches/s5.webp" },
  { id: "s6", image: "images/sketches/s6.webp" },
  { id: "s7", image: "images/sketches/s7.webp" },
  { id: "s8", image: "images/sketches/s8.webp" },
  { id: "s9", image: "images/sketches/s9.webp" },
  { id: "s10", image: "images/sketches/s10.webp" },
  { id: "s11", image: "images/sketches/s11.webp" },
  { id: "s12", image: "images/sketches/s12.webp" },
  { id: "s13", image: "images/sketches/s13.webp" },
  { id: "s14", image: "images/sketches/s14.webp" },
  { id: "s15", image: "images/sketches/s15.webp" },
  { id: "s16", image: "images/sketches/s16.webp" },
  { id: "s17", image: "images/sketches/s17.webp" },
  { id: "s18", image: "images/sketches/s18.webp" },
  { id: "s19", image: "images/sketches/s19.webp" },
  { id: "s20", image: "images/sketches/s20.webp" },
  { id: "s21", image: "images/sketches/s21.webp" }
];
