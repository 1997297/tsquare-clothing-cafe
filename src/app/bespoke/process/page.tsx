import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Calendar } from "lucide-react";
import { Button } from "@/components/common/Button";

export const metadata = {
  title: "The Bespoke Process | How It Works | TSquare Clothing Cafe",
  description:
    "A step-by-step exploration of how TSquare Clothing Cafe brings bespoke menswear commissions to life from silhouette discovery to the finished garment in your wardrobe.",
};

export default function BespokeProcessPage() {
  const steps = [
    {
      num: "01",
      name: "Discover",
      tagline: "Explore The House Silhouettes",
      detail:
        "Browse our house archives across Agbada, Senator, Kaftan, Traditional, Bespoke suiting, and Formal evening wear. Pinpoint the silhouette that reflects your aesthetic and occasion.",
      actionLabel: "Explore Silhouettes",
      actionHref: "/collections",
    },
    {
      num: "02",
      name: "Select",
      tagline: "Engage 'Make This Mine'",
      detail:
        "When an archetype resonates, select 'Make This Mine' to lock the design archetype. This initiates your bespoke file within the TSquare atelier.",
      actionLabel: "View Selected Looks",
      actionHref: "/collections",
    },
    {
      num: "03",
      name: "Personalize",
      tagline: "Tailor Details To Your Character",
      detail:
        "Choose your fabric weight, weave, colorway, embroidery density, collar structure, and monogramming preferences with guidance from our style directors.",
      actionLabel: "View Craftsmanship Details",
      actionHref: "/craftsmanship",
    },
    {
      num: "04",
      name: "Measure",
      tagline: "Comprehensive Anatomical Mapping",
      detail:
        "Undergo our 28-point physiological measurement session at the TCC office or via remote bespoke guidance. We chart shoulder slope, chest drop, stance, and neck curvature.",
      actionLabel: "Book Measurement Session",
      actionHref: "/book-a-fitting",
    },
    {
      num: "05",
      name: "Consult / Fit",
      tagline: "Sartorial Alignment & Basted Trial",
      detail:
        "Meet with our head cutter. For suiting, a basted fitting in raw cotton/canvas ensures balance and suppression before primary luxury fabrics are cut.",
      actionLabel: "Schedule Fitting",
      actionHref: "/book-a-fitting",
    },
    {
      num: "06",
      name: "Craft",
      tagline: "Master Needlework & Tailoring",
      detail:
        "Artisans cut, baste, sew, and hand-finish your garment over 2 to 5 weeks. Every seam is pressed open by hand; all embroidery is guided with patient precision.",
      actionLabel: "Learn About Craftsmanship",
      actionHref: "/craftsmanship",
    },
    {
      num: "07",
      name: "Finish",
      tagline: "Rigorous Quality Assurance",
      detail:
        "Every buttonhole, hem, embroidery junction, and lining seam undergoes extensive multi-point inspection to ensure heirloom standard.",
      actionLabel: "Atelier Standards",
      actionHref: "/story",
    },
    {
      num: "08",
      name: "Receive",
      tagline: "Ceremonial Delivery & Permanent Archive",
      detail:
        "Collect your finished piece in person at the TCC office or receive luxury courier delivery. The completed garment enters your permanent digital TSquare Wardrobe.",
      actionLabel: "Private Client Portal",
      actionHref: "/auth/sign-in",
    },
  ];

  return (
    <div className="bg-near-black min-h-screen text-warm-ivory selection:bg-champagne selection:text-near-black pt-28 sm:pt-36 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
          <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold block mb-3">
            Atelier Methodology
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-normal tracking-tight text-warm-ivory">
            The Bespoke Journey: How It Works
          </h1>
          <p className="mt-5 text-sm sm:text-base text-stone-300 font-sans font-light leading-relaxed">
            From initial style discovery to your permanent digital wardrobe, here is the transparent path of how an authentic TSquare garment is brought to life.
          </p>
        </div>

        {/* Vertical Timeline Process */}
        <div className="relative border-l border-stone-800 ml-4 sm:ml-12 pl-6 sm:pl-12 space-y-16">
          {steps.map((step, idx) => (
            <div key={idx} className="relative group">
              {/* Timeline Bullet */}
              <div className="absolute -left-[31px] sm:-left-[55px] top-1 flex h-8 w-8 items-center justify-center bg-near-black border border-stone-700 text-champagne font-mono text-xs font-bold group-hover:border-champagne group-hover:bg-stone-900 transition-colors">
                {step.num}
              </div>

              {/* Step Card Content */}
              <div className="p-6 sm:p-8 bg-stone-950 fine-border hover:border-stone-700 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-3">
                  <h3 className="font-display text-2xl sm:text-3xl text-warm-ivory">
                    {step.num}. {step.name}
                  </h3>
                  <span className="text-xs uppercase font-mono tracking-widest text-champagne">
                    {step.tagline}
                  </span>
                </div>

                <p className="text-sm text-stone-300 font-sans font-light leading-relaxed mb-6">
                  {step.detail}
                </p>

                <div className="pt-4 border-t border-stone-800/80 flex items-center justify-between">
                  <Link
                    href={step.actionHref}
                    className="inline-flex items-center text-xs uppercase tracking-[0.18em] font-semibold text-stone-300 hover:text-champagne transition-colors"
                  >
                    {step.actionLabel}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>

                  <span className="text-[10px] text-stone-500 font-mono tracking-widest uppercase">
                    Stage {step.num} / 08
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Ready to begin callout */}
        <div className="mt-24 p-8 sm:p-12 bg-stone-950 fine-border text-center">
          <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-champagne font-semibold block mb-3">
            Your Commission Awaits
          </span>
          <h2 className="font-display text-3xl text-warm-ivory">
            Ready to initiate your bespoke journey?
          </h2>
          <p className="mt-3 text-sm text-stone-400 font-light max-w-xl mx-auto">
            Book an appointment at the TCC office or begin by exploring our curated signature collections.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button href="/book-a-fitting" variant="champagne" size="lg">
              Book A Fitting Session
            </Button>
            <Button href="/collections" variant="outline" size="lg" className="border-stone-600 text-warm-ivory">
              Explore Collections
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
