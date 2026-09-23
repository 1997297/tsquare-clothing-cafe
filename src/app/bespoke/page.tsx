import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Scissors, Ruler, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/common/Button";

export const metadata = {
  title: "Bespoke Sartorial Commission | TSquare Clothing Cafe",
  description:
    "Discover the bespoke sartorial experience at TSquare Clothing Cafe. Individual geometry, 28-point anatomy, hand-drafted paper patterns, and master tailoring at TCC.",
};

export default function BespokePage() {
  const pillars = [
    {
      num: "01",
      title: "Individual Geometry & Anatomy",
      desc: "We do not believe in standardized sizing blocks. Your posture, shoulder slope, chest curvature, and stride are analyzed to construct a dedicated paper pattern cut exclusively for you.",
      highlight: "28 Unique Physiological Data Points",
    },
    {
      num: "02",
      title: "Prestigious Fabric Curation",
      desc: "Direct access to Europe's most revered mills (Scabal, Dormeuil, and Loro Piana), alongside authentic hand-loomed Nigerian Aso-Oke woven by veteran artisan families.",
      highlight: "Pure Natural Fibers & Heritage Weaves",
    },
    {
      num: "03",
      title: "Full Floating Canvas Architecture",
      desc: "Our bespoke jackets feature 100% natural horsehair canvas hand-stitched into the chest and lapel. Over time, the canvas molds to your warmth and physique, creating a bespoke fit that improves with age.",
      highlight: "Zero Glued Fusing",
    },
    {
      num: "04",
      title: "Artisanal Hand-Guided Embroidery",
      desc: "Our Agbada and Kaftan embroidery is not computer-stamped. Our master artisans manually guide every needle stroke, producing intricate geometric motifs with dimensional texture.",
      highlight: "Up to 50 Hours of Dedicated Needlework",
    },
    {
      num: "05",
      title: "Progressive Fitting Milestones",
      desc: "Every commission encompasses structured fitting checkpoints: from the initial basted fitting in raw cotton/canvas to the balance fitting and final inspection.",
      highlight: "Guaranteed Silhouette Balance",
    },
    {
      num: "06",
      title: "The Permanent Digital Wardrobe",
      desc: "Once your bespoke pattern is perfected, your unique measurements and garment histories are preserved in our digital atelier vault, streamlining future commissions.",
      highlight: "Enduring Sartorial Relationship",
    },
  ];

  return (
    <div className="bg-near-black min-h-screen text-warm-ivory selection:bg-champagne selection:text-near-black">
      {/* Editorial Hero */}
      <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden pt-28 pb-16">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=85&w=2000&auto=format&fit=crop"
            alt="TSquare Bespoke Tailoring Experience"
            fill
            priority
            className="object-cover object-center filter brightness-[0.45]"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-near-black via-near-black/50 to-near-black/70" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold mb-4">
            TSquare Clothing Cafe Atelier
          </span>

          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-warm-ivory leading-tight max-w-4xl">
            A garment made from you. Not simply for you.
          </h1>

          <p className="mt-6 text-base sm:text-xl text-stone-300 font-sans font-light max-w-2xl leading-relaxed">
            True bespoke is an intimate journey of anatomy, heritage textiles, and deliberate craftsmanship. Welcome to the digital extension of our fashion house.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <Button href="/book-a-fitting" variant="champagne" size="lg">
              Start Your Bespoke Journey
            </Button>
            <Button href="/bespoke/process" variant="outline" size="lg" className="border-stone-400 text-warm-ivory">
              Read How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* Philosophy Introduction */}
      <section className="py-24 sm:py-32 border-b border-stone-900 bg-near-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-[10px] uppercase font-mono tracking-[0.28em] text-champagne font-semibold block">
                The House Philosophy
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-normal tracking-tight text-warm-ivory leading-tight">
                Craftsmanship is a discipline of patient millimeters.
              </h2>
              <p className="text-stone-300 font-sans font-light leading-relaxed text-sm sm:text-base">
                In an era dominated by instant fast fashion, TSquare stands for enduring prestige. A bespoke commission is not purchased off a rack; it is co-created with master cutters who understand African ceremonial grandeur and classic sartorial poise.
              </p>
              <p className="text-stone-400 font-sans font-light leading-relaxed text-sm">
                Whether creating an imposing grand Agbada with 40 hours of hand-guided embroidery or an architectural midnight tuxedo with full floating canvas, every stitch serves your posture, presence, and status.
              </p>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="relative aspect-[3/4] bg-espresso fine-border overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1618886614638-80e3c103d31a?q=80&w=800&auto=format&fit=crop"
                  alt="Pattern cutting and chalk marks"
                  fill
                  sizes="25vw"
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-[3/4] bg-espresso fine-border overflow-hidden translate-y-6">
                <Image
                  src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop"
                  alt="Hand stitching and lapel roll"
                  fill
                  sizes="25vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 6 Pillars of TSquare Bespoke */}
      <section className="py-24 sm:py-32 bg-[#0E0E0C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <span className="text-[10px] uppercase font-mono tracking-[0.28em] text-champagne font-semibold block mb-3">
              The Sartorial Pillars
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-normal tracking-tight text-warm-ivory">
              The Architecture of Bespoke
            </h2>
            <p className="mt-4 text-sm sm:text-base text-stone-400 font-sans font-light leading-relaxed">
              Every garment carrying the TCC mark adheres to rigorous standards of fabric, anatomy, and artisanal finish.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pillars.map((p, idx) => (
              <div
                key={idx}
                className="p-8 bg-near-black fine-border flex flex-col justify-between hover:border-champagne/50 transition-colors"
              >
                <div>
                  <span className="text-2xl font-mono font-bold text-champagne block mb-4">
                    {p.num}
                  </span>
                  <h3 className="font-display text-lg sm:text-xl text-warm-ivory mb-3">
                    {p.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-400 font-sans font-light leading-relaxed mb-6">
                    {p.desc}
                  </p>
                </div>
                <div className="pt-4 border-t border-stone-800/80">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-champagne font-medium">
                    {p.highlight}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Start From An Idea ── */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-espresso/10 to-transparent" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold block mb-3">
            Your Vision, Our Craft
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-normal tracking-tight text-warm-ivory">
            Start From An Idea
          </h2>
          <p className="mt-4 text-sm sm:text-base text-stone-300 font-sans font-light max-w-xl mx-auto leading-relaxed">
            Some customers know what they want before they have seen it. If you already have a garment type in mind, you can begin your bespoke configuration directly.
          </p>
          <div className="mt-8">
            <Button href="/bespoke/create/idea" variant="outline" size="lg" className="border-champagne/40 text-champagne hover:bg-champagne/10">
              <Sparkles className="mr-2 h-4 w-4" />
              Begin Your Idea
            </Button>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 sm:py-28 text-center border-t border-stone-800/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold block mb-3">
            TCC Office
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-normal tracking-tight text-warm-ivory">
            Begin Your Bespoke Journey
          </h2>
          <p className="mt-4 text-sm sm:text-base text-stone-300 font-sans font-light max-w-xl mx-auto leading-relaxed">
            Reserve your consultation session with our master tailoring team to explore fabrics, capture measurements, and initiate your commission.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button href="/book-a-fitting" variant="champagne" size="lg">
              Book A Consultation Session
            </Button>
            <Button href="/collections" variant="outline" size="lg" className="border-stone-500 text-warm-ivory">
              Explore Available Silhouettes
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
