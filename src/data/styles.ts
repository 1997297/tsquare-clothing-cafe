import { Style, ProductCategory } from "@/types";

export const STYLES: Style[] = [
  // --- AGBADA ---
  {
    id: "tsq-agbada-024",
    slug: "tsq-agbada-024-imperial-grand-agbada",
    code: "TSQ AGBADA 024",
    name: "Imperial Grand Agbada 4-Piece",
    category: "agbada",
    categoryLabel: "Agbada",
    description:
      "A commanding four-piece ceremonial ensemble featuring intricate geometric hand-guided embroidery across a structured, heavyweight pure virgin wool and silk-blend base.",
    longDescription:
      "Designed for dignitaries and momentous occasions, the TSQ AGBADA 024 embodies contemporary regal power. Sculpted shoulders and a deliberate draped fall ensure maximum fluidity in movement while preserving an architectural silhouette. Complete with matching inner buba, tailored sokoto trousers, and a hand-folded fila cap.",
    images: [
      "/images/styles/agbada-imperial.jpg",
      "https://images.unsplash.com/photo-1788035963223-06abb95a1289?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1788035962791-b12a5b5c59dd?q=80&w=1200&auto=format&fit=crop",
    ],
    availableColours: [
      { name: "Obsidian Black", hex: "#11110F" },
      { name: "Raw Ivory", hex: "#F3EFE7" },
      { name: "Deep Royal Emerald", hex: "#16382C" },
      { name: "Midnight Navy", hex: "#131C2E" },
    ],
    fabricInformation:
      "Heavyweight Italian Virgin Wool (Super 140s) infused with Mulberry Silk sheen. Resists creasing while offering majestic drape.",
    fitInformation:
      "Regal Cut: Structured broad shoulders with wide cascading arm wings and tapered ankle sokoto.",
    occasions: ["Groom", "Traditional Wedding", "Chieftaincy", "State Banquet"],
    featured: true,
    collection: "Imperial Agbada Series",
    tags: ["Agbada", "Embroidery", "Ceremonial", "Groom", "Luxury"],
    leadTimeWeeks: 4,
    craftsmanshipHighlights: [
      "Over 48 hours of artisanal chest and shoulder embroidery",
      "Hand-rolled hems and concealed silk pocket linings",
      "Reinforced inner buba neck collar for permanent crispness",
    ],
  },
  {
    id: "tsq-agbada-018",
    slug: "tsq-agbada-018-minimalist-monochrome-agbada",
    code: "TSQ AGBADA 018",
    name: "Minimalist Monochrome Agbada",
    category: "agbada",
    categoryLabel: "Agbada",
    description:
      "A modern reinvention of the classic Yoruba silhouette, prioritizing pristine line-work, concealed fasteners, and whisper-quiet tone-on-tone embroidery.",
    longDescription:
      "For the man who commands respect without raising his voice. The TSQ 018 eschews overt ornamentation in favor of obsessive pattern precision, crisp knife pleats, and tactile jacquard micro-textures.",
    images: [
      "/images/styles/agbada-monochrome.jpg",
      "/images/editorial/hero-editorial.jpg",
    ],
    availableColours: [
      { name: "Pure Sandstone", hex: "#A79C8C" },
      { name: "Midnight Onyx", hex: "#151515" },
      { name: "Rich Espresso", hex: "#30251F" },
    ],
    fabricInformation:
      "Double-weave matte cashmere-cotton blend imported from Biella, Italy.",
    fitInformation:
      "Modern Tailored Agbada: Calibrated wing width optimized for ease of movement and contemporary poise.",
    occasions: ["Wedding Guest", "Evening", "Corporate Gala", "Anniversary"],
    featured: false,
    collection: "Imperial Agbada Series",
    tags: ["Agbada", "Monochrome", "Minimalist", "Modern"],
    leadTimeWeeks: 3,
    craftsmanshipHighlights: [
      "Tone-on-tone hand-stitched border cord work",
      "Micro-pleated inner sleeve guards",
    ],
  },

  // --- SENATOR ---
  {
    id: "tsq-senator-012",
    slug: "tsq-senator-012-asymmetric-placket-senator",
    code: "TSQ SENATOR 012",
    name: "Asymmetric Placket Executive Senator",
    category: "senator",
    categoryLabel: "Senator",
    description:
      "Clean architectural lines intersect with a sharp diagonal hidden placket, delivering executive authority with an unmistakable modern African edge.",
    longDescription:
      "Meticulously balanced for both boardrooms and high-profile evening engagements. Cut close to the torso with precise chest darting and a mandarin collar that sits flush against the neck.",
    images: [
      "/images/styles/senator-executive.jpg",
      "/images/editorial/hero-editorial.jpg",
    ],
    availableColours: [
      { name: "Midnight Charcoal", hex: "#1C1F22" },
      { name: "Warm Taupe", hex: "#8C8275" },
      { name: "Bespoke Navy", hex: "#182238" },
    ],
    fabricInformation:
      "Super 160s Tropical Wool with natural stretch and moisture-wicking properties ideal for the West African climate.",
    fitInformation:
      "Sleek Tailored: Contoured chest and waist with sharp crease flat-front trousers.",
    occasions: ["Corporate", "Executive Meetings", "Wedding Guest", "Sunday Luxury"],
    featured: true,
    collection: "Executive Senator Edition",
    tags: ["Senator", "Executive", "Corporate", "Tailored"],
    leadTimeWeeks: 2,
    craftsmanshipHighlights: [
      "Concealed hand-sewn button loops",
      "Reinforced sleeve cuff plackets with monogram option",
    ],
  },
  {
    id: "tsq-senator-007",
    slug: "tsq-senator-007-geometric-piped-senator",
    code: "TSQ SENATOR 007",
    name: "Contrast Piped Heritage Senator",
    category: "senator",
    categoryLabel: "Senator",
    description:
      "Distinct champagne-gold micro-piping accents along the yoke and cuffs, transforming a timeless silhouette into a statement of quiet mastery.",
    longDescription:
      "A tribute to precision sartorial craftsmanship. Every seam is pressed open by hand and bound with ultra-fine silk piping. Pairs effortlessly with handcrafted leather loafers.",
    images: [
      "/images/styles/senator-heritage.jpg",
      "/images/styles/senator-executive.jpg",
    ],
    availableColours: [
      { name: "Espresso Brown", hex: "#30251F" },
      { name: "Deep Bottle Green", hex: "#142820" },
      { name: "Near Black", hex: "#11110F" },
    ],
    fabricInformation:
      "High-density English Crepe Wool with structured drape and zero shine.",
    fitInformation:
      "Classic Executive: Generous chest ease with cleanly tapered trousers.",
    occasions: ["Corporate", "Birthday", "Evening", "Wedding Guest"],
    featured: false,
    collection: "Executive Senator Edition",
    tags: ["Senator", "Piping", "Heritage", "Luxury"],
    leadTimeWeeks: 2,
    craftsmanshipHighlights: [
      "Hand-inserted champagne silk cord piping",
      "Double back vents for seated elegance",
    ],
  },

  // --- KAFTAN ---
  {
    id: "tsq-kaftan-018",
    slug: "tsq-kaftan-018-embroidered-high-collar-kaftan",
    code: "TSQ KAFTAN 018",
    name: "Embroidered High-Collar Kaftan",
    category: "kaftan",
    categoryLabel: "Kaftan",
    description:
      "Lengthened silhouette featuring a high sculpted stand collar and delicate central rib embroidery influenced by Yoruba architectural motifs.",
    longDescription:
      "Refined ease meets bespoke discipline. The TSQ KAFTAN 018 falls gracefully past the knee with side vents engineered for effortless stride. Designed for the discerning gentleman seeking relaxed majesty.",
    images: [
      "/images/styles/kaftan-embroidered.jpg",
      "/images/styles/kaftan-silk.jpg",
    ],
    availableColours: [
      { name: "Warm Ivory", hex: "#F3EFE7" },
      { name: "Smoked Sage", hex: "#7C887A" },
      { name: "Rich Terracotta", hex: "#8A4732" },
      { name: "Near Black", hex: "#11110F" },
    ],
    fabricInformation:
      "Irish Linen and Egyptian Giza Cotton blend with breathability and enduring structure.",
    fitInformation:
      "Fluid Sartorial: Elongated tunic body with relaxed shoulder line and tapered matching trousers.",
    occasions: ["Everyday Luxury", "Traditional Wedding", "Art Gallery Openings", "Intimate Gatherings"],
    featured: true,
    collection: "Artisanal Kaftan Series",
    tags: ["Kaftan", "Linen", "Embroidery", "Relaxed Luxury"],
    leadTimeWeeks: 2,
    craftsmanshipHighlights: [
      "Artisan central threadwork executed on heirloom pedal machines",
      "Mother-of-pearl collar studs and reinforced slit hems",
    ],
  },
  {
    id: "tsq-kaftan-022",
    slug: "tsq-kaftan-022-silk-blend-signature-kaftan",
    code: "TSQ KAFTAN 022",
    name: "Silk-Blend Minimalist Robe Kaftan",
    category: "kaftan",
    categoryLabel: "Kaftan",
    description:
      "A fluid study in proportion, cut from luminous silk-cotton shantung with clean side pockets and a subtle concealed chest welt.",
    longDescription:
      "Stripped of distraction to highlight pure fabric and proportion. Catches low evening light with subtle luster while maintaining a completely masculine presence.",
    images: [
      "/images/styles/kaftan-silk.jpg",
      "/images/styles/kaftan-embroidered.jpg",
    ],
    availableColours: [
      { name: "Champagne Sand", hex: "#C7B9A3" },
      { name: "Espresso", hex: "#30251F" },
      { name: "Midnight Navy", hex: "#182238" },
    ],
    fabricInformation:
      "Silk-Cotton Shantung woven with natural organic slubs and a soft brushed hand feel.",
    fitInformation:
      "Flowing Relaxed: Soft drape with structured cuffs and neckband.",
    occasions: ["Evening", "Everyday Luxury", "Destination Celebration"],
    featured: false,
    collection: "Artisanal Kaftan Series",
    tags: ["Kaftan", "Silk", "Minimalist", "Evening"],
    leadTimeWeeks: 2,
    craftsmanshipHighlights: [
      "French-seamed internal construction",
      "Concealed deep welt pockets designed for discretion",
    ],
  },

  // --- TRADITIONAL ---
  {
    id: "tsq-traditional-005",
    slug: "tsq-traditional-005-heritage-aso-oke-tunic",
    code: "TSQ TRADITIONAL 005",
    name: "Heritage Aso-Oke Infused Danshiki",
    category: "traditional",
    categoryLabel: "Traditional",
    description:
      "Handwoven artisan Aso-Oke paneling sourced directly from master weavers, seamlessly integrated into a bespoke wool-crepe ceremonial tunic.",
    longDescription:
      "Rooted deeply in Yoruba tradition yet built for the modern cosmopolitan man. The TSQ TRADITIONAL 005 honors age-old loom techniques while reinterpreting them through razor-sharp contemporary tailoring.",
    images: [
      "/images/styles/traditional-danshiki.jpg",
      "/images/styles/traditional-chieftain.jpg",
    ],
    availableColours: [
      { name: "Indigo Heritage", hex: "#1D2D44" },
      { name: "Ochre & Charcoal", hex: "#2A2624" },
      { name: "Raw Ecru & Gold", hex: "#DCD5C6" },
    ],
    fabricInformation:
      "Authentic hand-loomed Nigerian Aso-Oke strip cloth integrated with premium British fine wool.",
    fitInformation:
      "Heritage Fit: Broad chest allowance with sculpted sleeve tapers.",
    occasions: ["Traditional Wedding", "Groom", "Cultural Festivals", "Milestone Celebrations"],
    featured: true,
    collection: "Heritage Roots Collection",
    tags: ["Traditional", "Aso-Oke", "Heritage", "Handwoven", "Cultural"],
    leadTimeWeeks: 4,
    craftsmanshipHighlights: [
      "Authentic handloom Aso-Oke woven by veteran artisan weavers",
      "Hand-stabilized intersections to ensure zero fraying across seams",
    ],
  },
  {
    id: "tsq-traditional-014",
    slug: "tsq-traditional-014-ceremonial-chieftain-set",
    code: "TSQ TRADITIONAL 014",
    name: "Ceremonial Chieftain 3-Piece Set",
    category: "traditional",
    categoryLabel: "Traditional",
    description:
      "Heavyweight damask tunic with embroidered collar and cuffs, paired with tailored trousers and ceremonial stole.",
    longDescription:
      "Dignified and timeless. Crafted for high-status cultural occasions, coronations, and family elder milestones.",
    images: [
      "/images/styles/traditional-chieftain.jpg",
      "/images/styles/traditional-danshiki.jpg",
    ],
    availableColours: [
      { name: "Imperial Gold & Cream", hex: "#E2D3B3" },
      { name: "Obsidian", hex: "#11110F" },
    ],
    fabricInformation:
      "Austrian Cotton Brocade with raised jacquard motifs and silk lining.",
    fitInformation:
      "Classic Dignitary: Generous traditional drape with tailored trousers.",
    occasions: ["Chieftaincy", "Traditional Wedding", "Ceremony"],
    featured: false,
    collection: "Heritage Roots Collection",
    tags: ["Traditional", "Damask", "Ceremonial", "Chieftain"],
    leadTimeWeeks: 3,
    craftsmanshipHighlights: [
      "Authentic Austrian brocade hand-matched across pattern repeats",
      "Padded ceremonial neckline construction",
    ],
  },

  // --- BESPOKE ---
  {
    id: "tsq-bespoke-001",
    slug: "tsq-bespoke-001-double-breasted-wool-cashmere",
    code: "TSQ BESPOKE 001",
    name: "Sculpted Double-Breasted Wool-Cashmere",
    category: "bespoke",
    categoryLabel: "Bespoke",
    description:
      "A pinnacle bespoke 6x2 double-breasted suit featuring full floating canvas construction, wide peak lapels, and rope shoulders.",
    longDescription:
      "Cut entirely from scratch from your individual measurement profile. Hand-padded lapels roll with natural grace, while the suppressed waist creates an athletic, commanding silhouette.",
    images: [
      "/images/styles/bespoke-double-breasted.jpg",
      "/images/styles/formal-evening.jpg",
    ],
    availableColours: [
      { name: "Near Black Midnight", hex: "#11110F" },
      { name: "Espresso Brown", hex: "#30251F" },
      { name: "Deep Camel", hex: "#9E7B56" },
    ],
    fabricInformation:
      "Dormeuil or Scabal Super 150s Wool-Cashmere with cupro jacquard lining.",
    fitInformation:
      "Full Bespoke: Drafted by hand onto paper patterns according to your exact anatomy.",
    occasions: ["Groom", "Black Tie", "High Finance", "State Dinner"],
    featured: true,
    collection: "Atelier Bespoke Suiting",
    tags: ["Bespoke", "Suiting", "Double-Breasted", "Cashmere", "Full Canvas"],
    leadTimeWeeks: 5,
    craftsmanshipHighlights: [
      "100% full floating horsehair canvas interior",
      "Hand-sewn milanese lapel buttonhole",
      "Working cuff buttonholes with genuine horn buttons",
      "Three mandatory fitting stages included",
    ],
  },
  {
    id: "tsq-bespoke-009",
    slug: "tsq-bespoke-009-tuxedo-hand-beaded-lapels",
    code: "TSQ BESPOKE 009",
    name: "Midnight Tuxedo with Hand-Beaded Lapels",
    category: "bespoke",
    categoryLabel: "Bespoke",
    description:
      "Dramatic evening tuxedo marrying Savile Row tailoring structure with contemporary African beadwork embroidery along the shawl collar.",
    longDescription:
      "Created for galas, red carpets, and the groom who desires unforgettable presence. Jet-black glass beads are sewn one by one onto pure silk faille lapels.",
    images: [
      "/images/styles/bespoke-tuxedo.jpg",
      "/images/styles/formal-evening.jpg",
    ],
    availableColours: [
      { name: "True Midnight Navy", hex: "#0E1524" },
      { name: "Obsidian Black", hex: "#11110F" },
      { name: "Vintage Wine", hex: "#3B1820" },
    ],
    fabricInformation:
      "Heavyweight British Barathea Wool paired with duchess silk satin details.",
    fitInformation:
      "Bespoke Tailored: High armholes, tapered waist, single button closure with high-rise side-adjuster trousers.",
    occasions: ["Groom", "Black Tie", "Red Carpet", "Awards Gala"],
    featured: false,
    collection: "Atelier Bespoke Suiting",
    tags: ["Bespoke", "Tuxedo", "Beaded", "Black Tie", "Evening"],
    leadTimeWeeks: 5,
    craftsmanshipHighlights: [
      "Over 35 hours of manual micro-bead embroidery",
      "Silk satin braided trouser outseams",
      "Hand-finished interior ticket and cigar pockets",
    ],
  },

  // --- FORMAL ---
  {
    id: "tsq-formal-003",
    slug: "tsq-formal-003-structural-midnight-evening-suit",
    code: "TSQ FORMAL 003",
    name: "Structural Midnight Black Evening Suit",
    category: "formal",
    categoryLabel: "Formal",
    description:
      "Sharp single-breasted two-piece suit with clean satin welt pockets and sculpted waist darting for supreme evening formality.",
    longDescription:
      "The quintessential evening suit for the modern gentleman. Cut with a high stance, clean chest drape, and tapered trousers with side adjusters, eliminating the need for belts.",
    images: [
      "/images/styles/formal-evening.jpg",
      "/images/styles/bespoke-double-breasted.jpg",
    ],
    availableColours: [
      { name: "Midnight Black", hex: "#11110F" },
      { name: "Smoky Charcoal", hex: "#22252A" },
      { name: "Deep Ink Navy", hex: "#121A2E" },
    ],
    fabricInformation:
      "Super 130s Merino Wool with natural recovery and luxurious drape.",
    fitInformation:
      "Modern Structured: Clean shoulder pads, sculpted chest, side adjusters.",
    occasions: ["Evening", "Corporate Gala", "Wedding Guest", "Dinner Party"],
    featured: true,
    collection: "Formal Occasion Edition",
    tags: ["Formal", "Evening", "Two-Piece", "Minimalist"],
    leadTimeWeeks: 3,
    craftsmanshipHighlights: [
      "Hand-felled collar and canvas chest piece",
      "Custom internal monogram embroidery included",
    ],
  },
  {
    id: "tsq-formal-015",
    slug: "tsq-formal-015-ivory-dinner-jacket-ensemble",
    code: "TSQ FORMAL 015",
    name: "Ivory Dinner Jacket Ensemble",
    category: "formal",
    categoryLabel: "Formal",
    description:
      "An iconic warm-ivory dinner jacket cut with wide sweeping shawl lapels in rich silk grosgrain, paired with jet-black formal trousers.",
    longDescription:
      "The epitome of celebratory sophistication. Designed for tropical formal evenings where high contrast and effortless charisma are required.",
    images: [
      "/images/styles/formal-ivory-jacket.jpg",
      "/images/styles/formal-evening.jpg",
    ],
    availableColours: [
      { name: "Warm Ivory", hex: "#F3EFE7" },
      { name: "Champagne Pearl", hex: "#DDD7CE" },
    ],
    fabricInformation:
      "Bamboo-Silk blend with subtle natural sheen and cooling touch.",
    fitInformation:
      "Contemporary Formal: Soft shoulder construction, clean drape, satin covered button.",
    occasions: ["Groom", "Black Tie Optional", "Summer Gala", "Milestone Celebration"],
    featured: false,
    collection: "Formal Occasion Edition",
    tags: ["Formal", "Dinner Jacket", "Ivory", "Shawl Lapel", "Groom"],
    leadTimeWeeks: 3,
    craftsmanshipHighlights: [
      "Pure silk grosgrain shawl collar with zero puckering",
      "Concealed interior breast pockets and silk lining",
    ],
  },
];

export function getAllStyles(): Style[] {
  return STYLES;
}

export function getFeaturedStyles(): Style[] {
  return STYLES.filter((s) => s.featured);
}

export function getStyleBySlug(slug: string): Style | undefined {
  return STYLES.find((s) => s.slug === slug);
}

export function getStyleById(id: string): Style | undefined {
  return STYLES.find((s) => s.id === id);
}

export function getStylesByCategory(category: ProductCategory): Style[] {
  return STYLES.filter((s) => s.category === category);
}

export function getRelatedStyles(currentStyle: Style, limit = 3): Style[] {
  return STYLES.filter(
    (s) => s.id !== currentStyle.id && (s.category === currentStyle.category || s.occasions.some((o) => currentStyle.occasions.includes(o)))
  ).slice(0, limit);
}

export function searchStyles(query: string): Style[] {
  if (!query || query.trim() === "") return [];
  const q = query.toLowerCase().trim();
  return STYLES.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.categoryLabel.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.fabricInformation.toLowerCase().includes(q) ||
      s.occasions.some((o) => o.toLowerCase().includes(q)) ||
      s.tags.some((t) => t.toLowerCase().includes(q))
  );
}
