import type { Style, ProductCategory } from "@/types";

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
      "/images/styles/agbada-imperial-detail-front.jpg",
      "/images/styles/agbada-imperial-detail-back.jpg",
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
    images: ["/images/styles/agbada-monochrome.jpg"],
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
    images: ["/images/styles/senator-executive.jpg"],
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
    images: ["/images/styles/senator-heritage.jpg"],
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
    images: ["/images/styles/kaftan-embroidered.jpg"],
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
    images: ["/images/styles/kaftan-silk.jpg"],
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
    images: ["/images/styles/traditional-danshiki.jpg"],
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
    images: ["/images/styles/traditional-chieftain.jpg"],
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
    images: ["/images/styles/bespoke-double-breasted.jpg"],
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
    images: ["/images/styles/bespoke-tuxedo.jpg"],
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
    images: ["/images/styles/formal-evening.jpg"],
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
    images: ["/images/styles/formal-ivory-jacket.jpg"],
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

  // --- PHASE 1 CATALOGUE EXPANSION ---
  {
    id: "tsq-agbada-031",
    slug: "tsq-agbada-031-garnet-ceremonial-agbada",
    code: "TSQ AGBADA 031",
    name: "Garnet Ceremonial Agbada",
    category: "agbada",
    categoryLabel: "Agbada",
    description: "A deep garnet ceremonial Agbada balanced by restrained tonal embroidery and an assured, fluid fall.",
    longDescription: "Designed for evening celebrations and family milestones, this composition keeps its ornament precise so the saturated colour and generous drape remain the focus.",
    images: ["/images/styles/agbada/agbada-garnet-031-cover.webp"],
    gallery: [{ src: "/images/styles/agbada/agbada-garnet-031-cover.webp", alt: "Man wearing the garnet ceremonial Agbada full look", isPrimary: true }],
    availableColours: [{ name: "Garnet", hex: "#6F1D2C" }, { name: "Deep Wine", hex: "#3B1820" }, { name: "Onyx", hex: "#11110F" }],
    availableFabrics: [
      { name: "Silk-Wool Damask", description: "A structured ceremonial weave with a low, refined sheen.", weight: "Medium-heavy", finish: "Tonal lustre" },
      { name: "Premium Cotton Jacquard", description: "Breathable cotton with a subtle woven motif.", weight: "Medium", finish: "Matte jacquard" },
    ],
    fabricInformation: "Silk-wool damask or premium cotton jacquard, selected for dignified drape in warm climates.",
    fitInformation: "Ceremonial Grand: generous wings, composed shoulder line, and tapered sokoto.",
    occasions: ["Traditional Wedding", "Groom", "Milestone Celebration"],
    featured: true,
    collection: "Imperial Agbada Series",
    tags: ["Agbada", "Garnet", "Ceremonial", "Tonal Embroidery"],
    leadTimeWeeks: 4,
    craftsmanshipHighlights: ["Balanced tonal chest embroidery", "Hand-finished neckline and wing hems"],
  },
  {
    id: "tsq-agbada-032",
    slug: "tsq-agbada-032-dove-grey-regent-agbada",
    code: "TSQ AGBADA 032",
    name: "Dove Grey Regent Agbada",
    category: "agbada",
    categoryLabel: "Agbada",
    description: "A cool dove-grey Agbada with lilac undertones and dense geometric embroidery for daylight ceremony.",
    longDescription: "The pale palette gives the traditional volume a modern calm, while layered embroidery creates definition without overwhelming the silhouette.",
    images: ["/images/styles/agbada/agbada-dove-032-cover.webp"],
    gallery: [{ src: "/images/styles/agbada/agbada-dove-032-cover.webp", alt: "Man wearing the dove grey Regent Agbada outdoors", isPrimary: true }],
    availableColours: [{ name: "Dove Grey", hex: "#AAA5AA" }, { name: "Silver Lilac", hex: "#918795" }, { name: "Pearl", hex: "#DDD7CE" }],
    availableFabrics: [
      { name: "Lightweight Wool-Silk", description: "A smooth suiting blend with a cool hand and controlled drape.", weight: "Medium", finish: "Soft lustre" },
      { name: "Cotton-Silk Brocade", description: "A breathable brocade for warm daytime celebrations.", weight: "Medium", finish: "Textured" },
    ],
    fabricInformation: "Lightweight wool-silk or cotton-silk brocade with tonal embroidery.",
    fitInformation: "Regent Cut: stately width through the body with an easy, balanced shoulder fall.",
    occasions: ["Traditional Wedding", "Chieftaincy", "Day Ceremony"],
    featured: false,
    collection: "Imperial Agbada Series",
    tags: ["Agbada", "Grey", "Regent", "Embroidery"],
    leadTimeWeeks: 4,
    craftsmanshipHighlights: ["Geometric front-panel embroidery", "Precisely balanced layered hems"],
  },
  {
    id: "tsq-senator-019",
    slug: "tsq-senator-019-sky-blue-babban-riga-set",
    code: "TSQ SENATOR 019",
    name: "Sky Blue Northern Senator Set",
    category: "senator",
    categoryLabel: "Senator",
    description: "A sky-blue two-piece native set with an embroidered bib, easy sleeve line, and clean tapered trousers.",
    longDescription: "A poised interpretation of executive native wear, designed to retain its polish across long celebrations and formal daytime engagements.",
    images: ["/images/styles/senator/senator-adire-earth-019-cover.jpg"],
    gallery: [{ src: "/images/styles/senator/senator-adire-earth-019-cover.jpg", alt: "Full-length sky blue Northern Senator set", isPrimary: true }],
    availableColours: [{ name: "Sky Blue", hex: "#A7C8E5" }, { name: "Powder Blue", hex: "#B8D4E8" }, { name: "Deep Navy", hex: "#182238" }],
    availableFabrics: [
      { name: "Premium Shadda", description: "Crisp, breathable cotton with the structure required for a clean native set.", weight: "Medium", finish: "Subtle sheen" },
      { name: "Tropical Wool", description: "Fine worsted wool with resilient crease recovery.", weight: "Light", finish: "Matte" },
    ],
    fabricInformation: "Premium Shadda cotton or tropical wool, both selected for clean embroidery and warm-weather wear.",
    fitInformation: "Relaxed Executive: straight tunic, easy sleeves, and tapered trouser line.",
    occasions: ["Wedding Guest", "Friday Dressing", "Family Celebration"],
    featured: true,
    collection: "Executive Senator Edition",
    tags: ["Senator", "Sky Blue", "Embroidered Bib", "Native Set"],
    leadTimeWeeks: 3,
    craftsmanshipHighlights: ["Symmetrical bib embroidery", "Hand-balanced trouser taper"],
  },
  {
    id: "tsq-senator-021",
    slug: "tsq-senator-021-graphite-bishop-neck-set",
    code: "TSQ SENATOR 021",
    name: "Graphite Bishop-Neck Senator",
    category: "senator",
    categoryLabel: "Senator",
    description: "A clean graphite-grey Senator set with a shallow bishop neckline and architectural lower-panel pleats.",
    longDescription: "Built around proportion rather than ornament, this versatile two-piece carries from a business engagement to an evening reception with quiet authority.",
    images: ["/images/styles/senator/senator-sapphire-021-cover.jpg"],
    gallery: [{ src: "/images/styles/senator/senator-sapphire-021-cover.jpg", alt: "Full-length graphite bishop-neck Senator set", isPrimary: true }],
    availableColours: [{ name: "Graphite", hex: "#6F7074" }, { name: "Stone", hex: "#8C8881" }, { name: "Midnight Navy", hex: "#182238" }],
    availableFabrics: [
      { name: "English Crepe Wool", description: "A compact wool with elegant drape and minimal shine.", weight: "Medium", finish: "Matte" },
      { name: "Cotton-Linen Twill", description: "Breathable natural fibres with enough body for sharp seams.", weight: "Medium", finish: "Dry touch" },
    ],
    fabricInformation: "English crepe wool or cotton-linen twill for a crisp yet comfortable two-piece.",
    fitInformation: "Modern Senator: a straight torso with subtle shaping and ankle-clean trousers.",
    occasions: ["Corporate", "Wedding Guest", "Evening"],
    featured: false,
    collection: "Executive Senator Edition",
    tags: ["Senator", "Graphite", "Bishop Neck", "Minimalist"],
    leadTimeWeeks: 3,
    craftsmanshipHighlights: ["Engineered contrast lower panel", "Clean hand-finished neckline"],
  },
  {
    id: "tsq-kaftan-026",
    slug: "tsq-kaftan-026-cocoa-column-kaftan",
    code: "TSQ KAFTAN 026",
    name: "Cocoa Column Kaftan",
    category: "kaftan",
    categoryLabel: "Kaftan",
    description: "A cocoa-brown longline kaftan with a minimal collar, subtle chest detail, and an uninterrupted column silhouette.",
    longDescription: "The disciplined front line and warm earthen tone make this an understated statement for evenings, travel, and private celebrations.",
    images: ["/images/styles/kaftan/kaftan-cocoa-026-cover.webp"],
    gallery: [{ src: "/images/styles/kaftan/kaftan-cocoa-026-cover.webp", alt: "Man wearing the cocoa column kaftan", isPrimary: true }],
    availableColours: [{ name: "Cocoa", hex: "#5B3A29" }, { name: "Espresso", hex: "#30251F" }, { name: "Sand", hex: "#B6A58C" }],
    availableFabrics: [
      { name: "Washed Linen", description: "Breathable linen softened for an easy, fluid fall.", weight: "Medium-light", finish: "Washed matte" },
      { name: "Cotton-Silk Twill", description: "Smooth twill with discreet depth of colour.", weight: "Medium", finish: "Low sheen" },
    ],
    fabricInformation: "Washed linen or cotton-silk twill with discreet tonal threadwork.",
    fitInformation: "Long Column: relaxed through the torso with a clean ankle-length fall.",
    occasions: ["Everyday Luxury", "Evening", "Destination Celebration"],
    featured: true,
    collection: "Artisanal Kaftan Series",
    tags: ["Kaftan", "Cocoa", "Longline", "Minimalist"],
    leadTimeWeeks: 2,
    craftsmanshipHighlights: ["Continuous front pattern alignment", "Reinforced side-slit finishing"],
  },
  {
    id: "tsq-kaftan-029",
    slug: "tsq-kaftan-029-burgundy-leisure-kaftan",
    code: "TSQ KAFTAN 029",
    name: "Burgundy Leisure Kaftan",
    category: "kaftan",
    categoryLabel: "Kaftan",
    description: "A saturated burgundy kaftan with a clean neckline and relaxed long silhouette for refined off-duty dressing.",
    longDescription: "Uncomplicated and confident, this design lets colour and proportion lead while concealed finishing preserves a polished surface.",
    images: ["/images/styles/kaftan/kaftan-burgundy-029-cover.webp"],
    gallery: [{ src: "/images/styles/kaftan/kaftan-burgundy-029-cover.webp", alt: "Man wearing the burgundy leisure kaftan outdoors", isPrimary: true }],
    availableColours: [{ name: "Burgundy", hex: "#681F2B" }, { name: "Mulberry", hex: "#512033" }, { name: "Ink Navy", hex: "#121A2E" }],
    availableFabrics: [
      { name: "Mercerised Cotton", description: "Breathable cotton with saturated colour and a smooth hand.", weight: "Medium-light", finish: "Soft lustre" },
      { name: "Linen-Silk", description: "Airy linen enriched with silk for a more fluid drape.", weight: "Light", finish: "Natural texture" },
    ],
    fabricInformation: "Mercerised cotton or linen-silk, chosen for colour depth and all-day comfort.",
    fitInformation: "Relaxed Longline: easy shoulder and torso with side vents for movement.",
    occasions: ["Everyday Luxury", "Weekend", "Intimate Gathering"],
    featured: false,
    collection: "Artisanal Kaftan Series",
    tags: ["Kaftan", "Burgundy", "Relaxed", "Leisure"],
    leadTimeWeeks: 2,
    craftsmanshipHighlights: ["Concealed side pockets", "Hand-finished vent reinforcement"],
  },
  {
    id: "tsq-traditional-019",
    slug: "tsq-traditional-019-rose-dansiki-set",
    code: "TSQ TRADITIONAL 019",
    name: "Rose Heritage Dansiki Set",
    category: "traditional",
    categoryLabel: "Traditional",
    description: "A rose-pink Dansiki set with an open, airy silhouette and graphic woven trim at the neckline and chest.",
    longDescription: "A youthful ceremonial layer grounded in classic West African proportion, designed to move freely while preserving a strong frame.",
    images: ["/images/styles/traditional/dansiki-rose-019-cover.webp"],
    gallery: [{ src: "/images/styles/traditional/dansiki-rose-019-cover.webp", alt: "Man wearing the rose heritage Dansiki set", isPrimary: true }],
    availableColours: [{ name: "Dusty Rose", hex: "#C07A82" }, { name: "Clay", hex: "#A55E4E" }, { name: "Indigo", hex: "#1D2D44" }],
    availableFabrics: [
      { name: "Handwoven Aso-Oke", description: "Artisan strip cloth with natural texture and individual character.", weight: "Medium-heavy", finish: "Handwoven" },
      { name: "Cotton Jacquard", description: "A lighter woven alternative for warm-weather events.", weight: "Medium", finish: "Textured matte" },
    ],
    fabricInformation: "Handwoven Aso-Oke or cotton jacquard with contrast neckline finishing.",
    fitInformation: "Open Heritage: broad body, generous sleeves, and a clean hip-length fall.",
    occasions: ["Cultural Festival", "Traditional Wedding", "Creative Gathering"],
    featured: true,
    collection: "Heritage Roots Collection",
    tags: ["Traditional", "Dansiki", "Rose", "Handwoven"],
    leadTimeWeeks: 4,
    craftsmanshipHighlights: ["Hand-applied woven neckline panel", "Pattern-matched front opening"],
  },
  {
    id: "tsq-traditional-021",
    slug: "tsq-traditional-021-terracotta-longline-native",
    code: "TSQ TRADITIONAL 021",
    name: "Terracotta Longline Native",
    category: "traditional",
    categoryLabel: "Traditional",
    description: "A terracotta longline native set with a simple round neck, restrained embroidery, and a relaxed ceremonial proportion.",
    longDescription: "This warm, grounded design is intentionally unfussy, allowing its length, colour, and subtle front embroidery to carry the look.",
    images: ["/images/styles/traditional/dansiki-ochre-021-cover.jpg"],
    gallery: [{ src: "/images/styles/traditional/dansiki-ochre-021-cover.jpg", alt: "Two men wearing terracotta longline native sets", objectPosition: "70% center", isPrimary: true }],
    availableColours: [{ name: "Terracotta", hex: "#A54F37" }, { name: "Forest", hex: "#314C39" }, { name: "Ochre", hex: "#A87832" }],
    availableFabrics: [
      { name: "Cotton-Linen", description: "A breathable plain weave with a crisp, natural surface.", weight: "Medium-light", finish: "Dry matte" },
      { name: "Soft Shadda", description: "Smooth cotton with enough body for the elongated shape.", weight: "Medium", finish: "Soft sheen" },
    ],
    fabricInformation: "Cotton-linen or soft Shadda with subtle tone-on-tone front embroidery.",
    fitInformation: "Longline Native: relaxed torso, full-length tunic, and straight trousers.",
    occasions: ["Family Celebration", "Cultural Event", "Everyday Luxury"],
    featured: false,
    collection: "Heritage Roots Collection",
    tags: ["Traditional", "Terracotta", "Longline", "Native"],
    leadTimeWeeks: 3,
    craftsmanshipHighlights: ["Measured side-slit placement", "Fine tonal chest embroidery"],
  },
  {
    id: "tsq-bespoke-013",
    slug: "tsq-bespoke-013-noir-sculpted-suit",
    code: "TSQ BESPOKE 013",
    name: "Noir Sculpted Single-Breasted Suit",
    category: "bespoke",
    categoryLabel: "Bespoke",
    description: "A sharply sculpted black suit with lean notch lapels, a clean chest, and precise monochrome styling.",
    longDescription: "Drafted for a confident close fit without restricting movement, this versatile commission moves from ceremony to evening with minimal adjustment.",
    images: ["/images/styles/bespoke/bespoke-noir-013-cover.webp"],
    gallery: [{ src: "/images/styles/bespoke/bespoke-noir-013-cover.webp", alt: "Portrait of the noir sculpted single-breasted suit", isPrimary: true }],
    availableColours: [{ name: "Noir", hex: "#101010" }, { name: "Graphite", hex: "#33363A" }, { name: "Ink Navy", hex: "#121A2E" }],
    availableFabrics: [
      { name: "Super 150s Wool", description: "Fine worsted wool for a smooth, responsive tailored line.", weight: "Medium", finish: "Matte" },
      { name: "Wool-Mohair", description: "Crisp, resilient cloth with subtle evening brilliance.", weight: "Medium-light", finish: "Dry lustre" },
    ],
    fabricInformation: "Super 150s wool or wool-mohair over a full floating canvas.",
    fitInformation: "Sculpted Bespoke: high armholes, suppressed waist, and hand-balanced sleeve pitch.",
    occasions: ["Wedding Guest", "Corporate Gala", "Evening"],
    featured: true,
    collection: "Atelier Bespoke Suiting",
    tags: ["Bespoke", "Black Suit", "Single-Breasted", "Full Canvas"],
    leadTimeWeeks: 5,
    craftsmanshipHighlights: ["Full floating horsehair canvas", "Hand-padded lapels and collar"],
  },
  {
    id: "tsq-bespoke-016",
    slug: "tsq-bespoke-016-graphite-studio-suit",
    code: "TSQ BESPOKE 016",
    name: "Graphite Studio Suit",
    category: "bespoke",
    categoryLabel: "Bespoke",
    description: "A contemporary graphite suit with restrained lapels, a crisp white shirt pairing, and a clean studio silhouette.",
    longDescription: "An adaptable full-canvas commission for clients who want the precision of bespoke construction expressed with understatement.",
    images: ["/images/styles/bespoke/bespoke-graphite-016-cover.webp"],
    gallery: [{ src: "/images/styles/bespoke/bespoke-graphite-016-cover.webp", alt: "Portrait of the graphite studio suit", isPrimary: true }],
    availableColours: [{ name: "Graphite", hex: "#3F4246" }, { name: "Charcoal", hex: "#25282C" }, { name: "Navy", hex: "#182238" }],
    availableFabrics: [
      { name: "Italian Worsted Wool", description: "Smooth, season-spanning cloth with excellent recovery.", weight: "Medium", finish: "Matte" },
      { name: "Wool-Cashmere", description: "A softer option with discreet depth and warmth.", weight: "Medium-heavy", finish: "Brushed" },
    ],
    fabricInformation: "Italian worsted wool or wool-cashmere with a breathable cupro lining.",
    fitInformation: "Contemporary Bespoke: clean shoulder, moderate waist suppression, tapered trousers.",
    occasions: ["Corporate", "Wedding Guest", "Dinner Party"],
    featured: false,
    collection: "Atelier Bespoke Suiting",
    tags: ["Bespoke", "Graphite", "Suit", "Understated"],
    leadTimeWeeks: 5,
    craftsmanshipHighlights: ["Individually drafted paper pattern", "Hand-felled lining and functional cuffs"],
  },
  {
    id: "tsq-formal-019",
    slug: "tsq-formal-019-onyx-modern-evening-suit",
    code: "TSQ FORMAL 019",
    name: "Onyx Modern Evening Suit",
    category: "formal",
    categoryLabel: "Formal",
    description: "A confident onyx evening suit with a lean silhouette and restrained styling for modern formal occasions.",
    longDescription: "Cut to sit sharply under evening light, this two-piece keeps its lines concise and its palette uncompromisingly dark.",
    images: ["/images/styles/formal/formal-onyx-019-cover.webp"],
    gallery: [{ src: "/images/styles/formal/formal-onyx-019-cover.webp", alt: "Man wearing the onyx modern evening suit", isPrimary: true }],
    availableColours: [{ name: "Onyx", hex: "#11110F" }, { name: "Midnight", hex: "#141824" }, { name: "Oxblood", hex: "#441923" }],
    availableFabrics: [
      { name: "Barathea Wool", description: "Classic evening wool with a rich, non-reflective surface.", weight: "Medium", finish: "Fine hopsack" },
      { name: "Wool-Mohair", description: "A crisp cloth that holds a sharp evening line.", weight: "Medium-light", finish: "Subtle lustre" },
    ],
    fabricInformation: "Barathea wool or wool-mohair paired with satin or grosgrain trim options.",
    fitInformation: "Modern Evening: clean chest, close waist, and a precise tapered trouser.",
    occasions: ["Evening", "Corporate Gala", "Awards Gala"],
    featured: true,
    collection: "Formal Occasion Edition",
    tags: ["Formal", "Onyx", "Evening Suit", "Modern"],
    leadTimeWeeks: 3,
    craftsmanshipHighlights: ["Hand-felled collar", "Silk-bound internal seams"],
  },
  {
    id: "tsq-formal-021",
    slug: "tsq-formal-021-monochrome-textured-tuxedo",
    code: "TSQ FORMAL 021",
    name: "Monochrome Textured Tuxedo",
    category: "formal",
    categoryLabel: "Formal",
    description: "A black double-breasted tuxedo with broad satin lapels, a lightly textured body, and crisp monochrome accessories.",
    longDescription: "A composed black-tie statement with texture visible only at close range, preserving formality while adding depth under camera light.",
    images: ["/images/styles/formal/formal-monochrome-021-cover.jpg"],
    gallery: [{ src: "/images/styles/formal/formal-monochrome-021-cover.jpg", alt: "Man wearing the monochrome textured double-breasted tuxedo", isPrimary: true }],
    availableColours: [{ name: "Black", hex: "#0B0B0B" }, { name: "Midnight Navy", hex: "#0E1524" }],
    availableFabrics: [
      { name: "Textured Barathea", description: "A formal wool with a discreet woven surface and excellent structure.", weight: "Medium-heavy", finish: "Textured matte" },
      { name: "Fine Wool-Mohair", description: "Crisp evening cloth with elegant recovery.", weight: "Medium", finish: "Dry sheen" },
    ],
    fabricInformation: "Textured Barathea or fine wool-mohair with pure silk satin lapels.",
    fitInformation: "Double-Breasted Evening: broad lapels, defined waist, and clean high-rise trousers.",
    occasions: ["Black Tie", "Groom", "Awards Gala"],
    featured: false,
    collection: "Formal Occasion Edition",
    tags: ["Formal", "Tuxedo", "Double-Breasted", "Black Tie"],
    leadTimeWeeks: 4,
    craftsmanshipHighlights: ["Hand-padded broad satin lapels", "Pattern-matched textured body panels"],
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
