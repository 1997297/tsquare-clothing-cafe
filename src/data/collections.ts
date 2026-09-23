import { Collection, ProductCategory } from "@/types";

export const COLLECTIONS: Collection[] = [
  {
    id: "col-agbada",
    slug: "agbada",
    name: "Imperial Agbada",
    tagline: "Architecture of African Majesty",
    description:
      "A celebration of regal volume, structural integrity, and hand-embroidered discipline. Our Agbada collections balance historic grandeur with weightless, fluid wearability.",
    heroImage: "/images/styles/agbada-imperial.jpg",
    featuredQuote:
      "The Agbada is not merely a garment; it is an entrance, an announcement of character and lineage.",
    characteristics: [
      "Monumental silhouette with balanced drapery",
      "Hand-guided artisanal embroidery patterns",
      "Reinforced collars and crisp neckline contours",
      "Custom woven 4-piece ensembles",
    ],
  },
  {
    id: "col-senator",
    slug: "senator",
    name: "Executive Senator",
    tagline: "Linear Precision & Quiet Authority",
    description:
      "The uniform of contemporary African leaders and thinkers. Defined by immaculate shoulder lines, concealed plackets, and razor-sharp trousers.",
    heroImage: "/images/styles/senator-executive.jpg",
    featuredQuote:
      "Authority does not need shouting. It reveals itself in the pitch of a shoulder and the line of a cuff.",
    characteristics: [
      "Precision chest and waist darting",
      "Minimalist concealed button plackets",
      "High-grade tropical wools engineered for heat",
      "Sharp flat-front trouser tapers",
    ],
  },
  {
    id: "col-kaftan",
    slug: "kaftan",
    name: "Artisanal Kaftan",
    tagline: "Effortless Grace & Tactile Luxury",
    description:
      "Elongated tunics crafted from Irish linens, raw silks, and Egyptian cottons. Designed for effortless weekend elegance and intimate celebratory gatherings.",
    heroImage: "/images/styles/kaftan-embroidered.jpg",
    featuredQuote:
      "Luxury experienced in motion. Relaxed yet uncompromisingly tailored.",
    characteristics: [
      "Sculpted mandarin and stand collars",
      "Breathable natural fiber compositions",
      "Discreet side pockets and clean slit hems",
      "Tone-on-tone artisanal stitch details",
    ],
  },
  {
    id: "col-traditional",
    slug: "traditional",
    name: "Heritage Roots",
    tagline: "Ancestral Weaving Reimagined",
    description:
      "Direct collaborations with master weavers from Western Nigeria. Integrating hand-loomed Aso-Oke, damask, and ancestral dyes into contemporary menswear.",
    heroImage: "/images/styles/traditional-danshiki.jpg",
    featuredQuote:
      "We do not leave our heritage behind to be modern. We elevate our heritage until it defines modernity.",
    characteristics: [
      "Direct provenance from master artisan weavers",
      "Hand-assembled strip cloth integration",
      "Heirloom longevity and ceremonial dignity",
      "Custom woven family patterns upon commission",
    ],
  },
  {
    id: "col-bespoke",
    slug: "bespoke",
    name: "Atelier Bespoke",
    tagline: "Individual Geometry & Master Tailoring",
    description:
      "The pinnacle of our sartorial house. Hand-drafted patterns cut specifically for your unique posture, anatomy, and lifestyle. Full floating canvas suiting crafted without shortcuts.",
    heroImage: "/images/styles/bespoke-double-breasted.jpg",
    featuredQuote:
      "A bespoke suit is not made to fit you. It is created from you.",
    characteristics: [
      "100% full floating horsehair canvas interior",
      "Individual hand-drafted paper patterns",
      "Three distinct fitting checkpoints",
      "Finest British and Italian luxury wools",
    ],
  },
  {
    id: "col-formal",
    slug: "formal",
    name: "Formal Occasion",
    tagline: "Evening Drama & Black-Tie Refinement",
    description:
      "From midnight dinner jackets with hand-beaded shawl collars to architectural evening suits, formalwear engineered for life's defining stages.",
    heroImage: "/images/styles/formal-ivory-jacket.jpg",
    featuredQuote:
      "When the dress code says black tie, TSquare delivers a statement that transcends conformity.",
    characteristics: [
      "Pure silk grosgrain and satin facing accents",
      "Hand-beaded and micro-embroidered lapel options",
      "Side-adjuster formal evening trousers",
      "Dramatically sculpted waist suppression",
    ],
  },
];

export function getAllCollections(): Collection[] {
  return COLLECTIONS;
}

export function getCollectionBySlug(slug: ProductCategory | string): Collection | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}
