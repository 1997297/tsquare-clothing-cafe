import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/common/Button";

export const metadata = {
  title: "Artisanal Craftsmanship & Atelier Methods | TSquare Clothing Cafe",
  description:
    "An in-depth visual exploration into the artisanal craftsmanship of TSquare Clothing Cafe: fabric sourcing, 28-point measurement, hand-guided embroidery, full floating canvas, and master tailoring.",
};

export default function CraftsmanshipPage() {
  const crafts = [
    {
      step: "01",
      title: "Prestigious Fabric Selection",
      image: "/images/atelier/tailoring-craft.jpg",
      tagline: "Natural Fibers & Historic Weaves",
      description:
        "Every garment begins with natural fiber integrity. We source Super 140s to 180s virgin wools from Biella, Italy and Yorkshire, England for year-round breathability. For traditional ceremonial ensembles, we commission authentic hand-loomed Nigerian Aso-Oke woven with heritage strip-cloth looms.",
      specs: [
        "Super 140s to 180s Pure Virgin Wools",
        "Mulberry Silk & Linen Blends",
        "Authentic Hand-Loomed Aso-Oke",
        "Breathable Natural Linings",
      ],
    },
    {
      step: "02",
      title: "28-Point Anatomical Measurement",
      image: "/images/atelier/precision-suiting.jpg",
      tagline: "Precision Beyond Standard Sizing",
      description:
        "We capture more than chest and waist circumference. Our master cutters evaluate shoulder slope, spinal curvature, neck pitch, and stride dynamics. These nuances are mapped onto individual card patterns stored permanently in our atelier archives.",
      specs: [
        "28 Anatomical Data Points",
        "Postural & Shoulder Slope Calibration",
        "Custom Hand-Drafted Paper Patterns",
        "Digital Measurement Vault",
      ],
    },
    {
      step: "03",
      title: "Pattern Cutting & Chalk Drafting",
      image: "/images/atelier/bespoke-heritage.jpg",
      tagline: "Sculpting Cloth by Hand",
      description:
        "Our head cutters mark every line directly onto the wool or damask using tailor's chalk and heavy brass shears. Patterns are manipulated to balance stripe or check alignments across pocket welts, lapel rolls, and shoulder seams.",
      specs: [
        "Single-Layer Precision Shearing",
        "Pattern Matching Across Seams",
        "Individual Generous Inlay Allowances",
        "Zero Laser Stamping",
      ],
    },
    {
      step: "04",
      title: "Full Floating Canvas Tailoring",
      image: "/images/styles/bespoke-double-breasted.jpg",
      tagline: "The Living Interior of a Jacket",
      description:
        "Commercial suits fuse cloth with synthetic glue that bubbles over time. In contrast, TSquare jackets feature a full floating chest piece composed of horsehair and wool canvas loosely basted to the outer fabric. It breathes, moves, and molds to your bodily warmth.",
      specs: [
        "100% Horsehair Floating Canvas",
        "Hand-Padded Lapels with Natural Roll",
        "Pliant Armhole Construction",
        "Decades of Longevity",
      ],
    },
    {
      step: "05",
      title: "Hand-Guided Artisanal Embroidery",
      image: "/images/styles/agbada-imperial.jpg",
      tagline: "Intricate Nigerian Geometric Mastery",
      description:
        "Our Agbada chest panels and Kaftan yokes feature intricate, three-dimensional needlework. Master embroidery artisans manually guide the fabric beneath heirloom needle beds, creating geometric textures impossible to achieve on robotic flatbed machines.",
      specs: [
        "Up to 48 Hours of Manual Needlework",
        "Tactile Multi-Thread Cord Density",
        "Yoruba Heritage Motifs & Modern Monograms",
        "Reinforced Neck Collars",
      ],
    },
    {
      step: "06",
      title: "Fittings & Final Inspection",
      image: "/images/styles/senator-executive.jpg",
      tagline: "Rigorous Milestone Approvals",
      description:
        "Before any garment is cleared for handover, it passes through comprehensive basted and balance fitting milestones. Our head tailor assesses the drape in motion, checking sleeve length against shirt cuff exposure and trouser break.",
      specs: [
        "Multi-Stage Fitting Milestones",
        "Pressing on Specialized Buck Irons",
        "Hand-Felled Buttonholes & Hems",
        "Signed Certificate of Atelier Completion",
      ],
    },
  ];

  return (
    <div className="bg-near-black min-h-screen text-warm-ivory selection:bg-champagne selection:text-near-black pt-28 sm:pt-36 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold block mb-3">
            Atelier Standards & Discipline
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-normal tracking-tight text-warm-ivory leading-tight">
            Every detail has a reason.
          </h1>
          <p className="mt-5 text-sm sm:text-base text-stone-300 font-sans font-light leading-relaxed">
            Take a closer look at the artisanal processes that define TSquare Clothing Cafe. From canvas interiors to hand-guided embroidery, we uphold the patient traditions of bespoke luxury.
          </p>
        </div>

        {/* 6 Visual Craft Pillars */}
        <div className="space-y-24 sm:space-y-32">
          {crafts.map((craft, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <div
                key={idx}
                className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center"
              >
                {/* Photo */}
                <div
                  className={`lg:col-span-6 relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-espresso fine-border rounded-2xl sm:rounded-3xl shadow-lg ${
                    !isEven ? "lg:order-2" : ""
                  }`}
                >
                  <Image
                    src={craft.image}
                    alt={craft.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover object-top transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 bg-near-black/80 px-3 py-1 rounded-full border border-stone-800 text-[10px] uppercase font-mono tracking-widest text-champagne">
                    Pillar {craft.step}
                  </div>
                </div>

                {/* Narrative & Specs */}
                <div
                  className={`lg:col-span-6 space-y-5 ${
                    !isEven ? "lg:order-1" : ""
                  }`}
                >
                  <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-champagne font-semibold block">
                    {craft.tagline}
                  </span>

                  <h2 className="font-display text-2xl sm:text-4xl text-warm-ivory font-normal">
                    {craft.title}
                  </h2>

                  <p className="text-sm sm:text-base text-stone-300 font-sans font-light leading-relaxed">
                    {craft.description}
                  </p>

                  <div className="pt-2 border-t border-stone-800/80">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      {craft.specs.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-stone-400">
                          <CheckCircle2 className="h-3.5 w-3.5 text-champagne shrink-0" />
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Closing Invitation */}
        <div className="mt-32 p-8 sm:p-14 bg-stone-950 fine-border rounded-2xl sm:rounded-3xl text-center max-w-4xl mx-auto">
          <span className="text-[10px] uppercase font-mono tracking-[0.28em] text-champagne font-semibold block mb-2">
            Witness It In Person
          </span>
          <h2 className="font-display text-3xl sm:text-4xl text-warm-ivory">
            Visit the TCC Office
          </h2>
          <p className="mt-3 text-sm text-stone-400 font-light max-w-xl mx-auto leading-relaxed">
            Experience our fabric swatches, examine basted suit construction, and discuss your bespoke ideas with our master tailors.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button href="/book-a-fitting" variant="champagne" size="lg">
              Book A Studio Fitting
            </Button>
            <Button href="/collections" variant="outline" size="lg" className="border-stone-600 text-warm-ivory">
              Browse House Silhouettes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
