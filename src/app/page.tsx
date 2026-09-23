import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Scissors, ShieldCheck, Ruler, Calendar, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import { StyleCard } from "@/components/features/styles/StyleCard";
import { getFeaturedStyles } from "@/data/styles";
import { COLLECTIONS } from "@/data/collections";
import { OCCASIONS } from "@/data/occasions";

export default function HomePage() {
  const featuredStyles = getFeaturedStyles();

  return (
    <div className="flex flex-col bg-near-black text-warm-ivory selection:bg-champagne selection:text-near-black font-sans">
      {/* ------------------------------------------------------------- */}
      {/* 1. HERO SECTION                                              */}
      {/* ------------------------------------------------------------- */}
      <section className="relative min-h-[95vh] sm:min-h-screen flex items-center justify-center overflow-hidden">
        {/* Full Bleed Background Editorial Image of Man in Grand Agbada */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/editorial/hero-editorial.jpg"
            alt="TSquare Clothing Cafe Luxury African Menswear Campaign"
            fill
            priority
            className="object-cover object-top filter brightness-[0.70]"
            sizes="100vw"
          />
          {/* Subtle Vignette & Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-near-black via-near-black/40 to-near-black/60" />
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16 flex flex-col items-center">
          <h1 className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight text-warm-ivory leading-[1.12] max-w-4xl animate-in fade-in slide-in-from-bottom-3 duration-700">
            Crafted for the man who commands presence.
          </h1>

          <p className="mt-5 sm:mt-7 text-sm sm:text-lg md:text-xl text-stone-300 font-sans font-light max-w-2xl leading-relaxed tracking-wide animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            Bespoke menswear shaped by craftsmanship, character and individuality.
          </p>

          {/* Action CTAs with Rounded-xl */}
          <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-5 duration-700 delay-300">
            <Button
              href="/collections"
              variant="champagne"
              size="lg"
              className="w-full sm:w-auto rounded-xl"
            >
              Explore The Collection
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Button
              href="/book-a-fitting"
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-warm-ivory border-stone-400 hover:bg-warm-ivory/10 rounded-xl"
            >
              Book A Fitting
            </Button>
          </div>
        </div>

        {/* Down Scroll Indicator */}
        <div className="absolute bottom-6 inset-x-0 flex justify-center text-stone-400/80 animate-bounce pointer-events-none">
          <span className="text-[9px] uppercase tracking-[0.25em] font-mono">
            Scroll To Discover
          </span>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. THE TSQUARE MAN                                           */}
      {/* ------------------------------------------------------------- */}
      <section className="py-24 sm:py-32 border-b border-stone-900 bg-near-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Narrative */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-[10px] uppercase font-mono tracking-[0.28em] text-champagne font-semibold block">
                TSQUARE CLOTHING CAFE
              </span>

              <h2 className="font-display text-3xl sm:text-5xl font-normal tracking-tight text-warm-ivory leading-tight">
                The TSquare Man.
              </h2>

              <p className="font-display text-xl sm:text-2xl text-stone-200 font-light italic leading-relaxed border-l-2 border-champagne pl-4 my-6">
                &ldquo;He does not simply dress for the room. He arrives with presence.&rdquo;
              </p>

              <div className="space-y-4 text-stone-400 font-sans font-light leading-relaxed text-sm sm:text-base">
                <p>
                  TSquare creates contemporary menswear for men who value craftsmanship, individuality, and the unapologetic confidence of wearing garments cut precisely to their proportions.
                </p>
                <p>
                  Rooted in Abeokuta, Ogun State, our tailoring house blends centuries of Nigerian ceremonial sartorial majesty, from the structured fall of the grand Agbada to the architectural symmetry of the Senator, with Savile Row bespoke discipline.
                </p>
              </div>

              <div className="pt-4">
                <Link
                  href="/story"
                  className="inline-flex items-center text-xs uppercase tracking-[0.22em] font-bold text-champagne hover:text-champagne-light transition-colors"
                >
                  Discover Our Brand Story
                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Right Editorial Portraits with Rounded-2xl */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="relative aspect-[3/4] overflow-hidden bg-espresso rounded-2xl fine-border shadow-lg">
                <Image
                  src="/images/styles/agbada-imperial.jpg"
                  alt="Imperial Grand Agbada"
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="object-cover object-top transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute bottom-3 left-3 bg-near-black/85 px-3 py-1 text-[9px] uppercase tracking-widest text-warm-ivory font-mono rounded-lg border border-stone-800">
                  Imperial Grand Agbada
                </div>
              </div>

              <div className="relative aspect-[3/4] overflow-hidden bg-espresso rounded-2xl fine-border shadow-lg sm:translate-y-8">
                <Image
                  src="/images/styles/senator-executive.jpg"
                  alt="Executive Senator Attire"
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="object-cover object-top transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute bottom-3 left-3 bg-near-black/85 px-3 py-1 text-[9px] uppercase tracking-widest text-stone-300 font-mono rounded-lg border border-stone-800">
                  Executive Senator
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. SIGNATURE COLLECTIONS (Asymmetric & Rounded)              */}
      {/* ------------------------------------------------------------- */}
      <section className="py-24 sm:py-32 bg-[#0E0E0C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-[0.28em] text-stone-400 font-semibold block mb-2">
                House Silhouettes
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-normal tracking-tight text-warm-ivory">
                Signature Collections
              </h2>
            </div>
            <p className="text-stone-400 text-xs sm:text-sm font-sans font-light max-w-md">
              Six foundational pillars of modern African luxury, crafted to command every room, coronation, and boardroom.
            </p>
          </div>

          {/* Asymmetric Editorial Grid with Rounded-3xl */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* 1. Agbada - Large Hero Left (7 Cols) */}
            <div className="md:col-span-7 group relative aspect-[4/5] overflow-hidden bg-espresso fine-border rounded-3xl shadow-md">
              <Image
                src={COLLECTIONS[0].heroImage}
                alt={COLLECTIONS[0].name}
                fill
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-near-black via-near-black/20 to-transparent opacity-85 group-hover:opacity-90 transition-opacity" />
              <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 right-6 z-10">
                <span className="text-[10px] uppercase tracking-[0.25em] text-champagne font-mono font-semibold">
                  Volumetric Grandeur
                </span>
                <h3 className="font-display text-2xl sm:text-4xl text-warm-ivory mt-1">
                  {COLLECTIONS[0].name}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-stone-300 font-light max-w-md hidden sm:block">
                  {COLLECTIONS[0].tagline}
                </p>
                <Link
                  href={`/collections/${COLLECTIONS[0].slug}`}
                  className="mt-4 inline-flex items-center text-xs uppercase tracking-[0.2em] font-semibold text-warm-ivory hover:text-champagne transition-colors"
                >
                  Explore Agbada Collection <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* 2. Senator - Tall Right (5 Cols) */}
            <div className="md:col-span-5 group relative aspect-[3/4] md:aspect-auto overflow-hidden bg-espresso fine-border rounded-3xl shadow-md">
              <Image
                src={COLLECTIONS[1].heroImage}
                alt={COLLECTIONS[1].name}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-near-black via-near-black/30 to-transparent opacity-85 group-hover:opacity-90 transition-opacity" />
              <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-8 right-6 z-10">
                <span className="text-[10px] uppercase tracking-[0.25em] text-champagne font-mono font-semibold">
                  Executive Authority
                </span>
                <h3 className="font-display text-2xl sm:text-3xl text-warm-ivory mt-1">
                  {COLLECTIONS[1].name}
                </h3>
                <p className="mt-2 text-xs text-stone-300 font-light hidden sm:block">
                  {COLLECTIONS[1].tagline}
                </p>
                <Link
                  href={`/collections/${COLLECTIONS[1].slug}`}
                  className="mt-4 inline-flex items-center text-xs uppercase tracking-[0.2em] font-semibold text-warm-ivory hover:text-champagne transition-colors"
                >
                  Explore Senator <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* 3. Kaftan (4 Cols) */}
            <div className="md:col-span-4 group relative aspect-[3/4] overflow-hidden bg-espresso fine-border rounded-3xl shadow-md">
              <Image
                src={COLLECTIONS[2].heroImage}
                alt={COLLECTIONS[2].name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-near-black via-near-black/30 to-transparent opacity-85" />
              <div className="absolute bottom-6 left-6 right-6 z-10">
                <span className="text-[9px] uppercase tracking-widest text-champagne font-mono">
                  Tactile Luxury
                </span>
                <h3 className="font-display text-xl sm:text-2xl text-warm-ivory mt-0.5">
                  {COLLECTIONS[2].name}
                </h3>
                <Link
                  href={`/collections/${COLLECTIONS[2].slug}`}
                  className="mt-3 inline-flex items-center text-xs uppercase tracking-widest font-semibold text-warm-ivory hover:text-champagne transition-colors"
                >
                  View Collection →
                </Link>
              </div>
            </div>

            {/* 4. Traditional (4 Cols) */}
            <div className="md:col-span-4 group relative aspect-[3/4] overflow-hidden bg-espresso fine-border rounded-3xl shadow-md">
              <Image
                src={COLLECTIONS[3].heroImage}
                alt={COLLECTIONS[3].name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-near-black via-near-black/30 to-transparent opacity-85" />
              <div className="absolute bottom-6 left-6 right-6 z-10">
                <span className="text-[9px] uppercase tracking-widest text-champagne font-mono">
                  Ancestral Weaving
                </span>
                <h3 className="font-display text-xl sm:text-2xl text-warm-ivory mt-0.5">
                  {COLLECTIONS[3].name}
                </h3>
                <Link
                  href={`/collections/${COLLECTIONS[3].slug}`}
                  className="mt-3 inline-flex items-center text-xs uppercase tracking-widest font-semibold text-warm-ivory hover:text-champagne transition-colors"
                >
                  View Collection →
                </Link>
              </div>
            </div>

            {/* 5. Bespoke & Formal (4 Cols) */}
            <div className="md:col-span-4 flex flex-col gap-6">
              {/* Bespoke */}
              <div className="flex-1 group relative aspect-[16/9] md:aspect-auto overflow-hidden bg-espresso fine-border rounded-2xl shadow-md p-6 flex flex-col justify-end">
                <Image
                  src={COLLECTIONS[4].heroImage}
                  alt={COLLECTIONS[4].name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-near-black via-near-black/50 to-transparent opacity-90" />
                <div className="relative z-10">
                  <span className="text-[9px] uppercase tracking-widest text-champagne font-mono">
                    Full Floating Canvas
                  </span>
                  <h3 className="font-display text-xl text-warm-ivory mt-0.5">
                    {COLLECTIONS[4].name}
                  </h3>
                  <Link
                    href={`/collections/${COLLECTIONS[4].slug}`}
                    className="mt-2 inline-flex items-center text-xs uppercase tracking-widest font-semibold text-warm-ivory hover:text-champagne transition-colors"
                  >
                    Explore Bespoke →
                  </Link>
                </div>
              </div>

              {/* Formal */}
              <div className="flex-1 group relative aspect-[16/9] md:aspect-auto overflow-hidden bg-espresso fine-border rounded-2xl shadow-md p-6 flex flex-col justify-end">
                <Image
                  src={COLLECTIONS[5].heroImage}
                  alt={COLLECTIONS[5].name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-near-black via-near-black/50 to-transparent opacity-90" />
                <div className="relative z-10">
                  <span className="text-[9px] uppercase tracking-widest text-champagne font-mono">
                    Black Tie & Galas
                  </span>
                  <h3 className="font-display text-xl text-warm-ivory mt-0.5">
                    {COLLECTIONS[5].name}
                  </h3>
                  <Link
                    href={`/collections/${COLLECTIONS[5].slug}`}
                    className="mt-2 inline-flex items-center text-xs uppercase tracking-widest font-semibold text-warm-ivory hover:text-champagne transition-colors"
                  >
                    Explore Formal →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. SELECTED LOOKS                                             */}
      {/* ------------------------------------------------------------- */}
      <section className="py-24 sm:py-32 bg-near-black border-b border-stone-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-[0.28em] text-champagne font-semibold block mb-2">
                Curated Editorial
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-normal tracking-tight text-warm-ivory">
                Selected Looks
              </h2>
            </div>
            <Link
              href="/collections"
              className="inline-flex items-center text-xs uppercase tracking-[0.2em] font-semibold text-warm-ivory hover:text-champagne transition-colors"
            >
              View Full Archive
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {featuredStyles.slice(0, 6).map((style, idx) => (
              <StyleCard key={style.id} style={style} priority={idx < 2} />
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. BESPOKE HOMEPAGE INTRODUCTION                             */}
      {/* ------------------------------------------------------------- */}
      <section className="py-24 sm:py-32 bg-[#141412] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <span className="text-[10px] uppercase font-mono tracking-[0.28em] text-champagne font-semibold block mb-3">
              The Sartorial Process
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-normal tracking-tight text-warm-ivory">
              Made for you. Down to the detail.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-stone-300 font-sans font-light leading-relaxed">
              Every commission is an intimate collaboration between client and master artisan. We do not adapt you to a standard size; we build the garment around your presence.
            </p>
          </div>

          {/* 6 Steps with Rounded-2xl */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {[
              {
                num: "01",
                title: "Discover your style",
                desc: "Explore our signature silhouettes across Agbada, Senator, Kaftan, and Bespoke suiting.",
              },
              {
                num: "02",
                title: "Personalize your look",
                desc: "Select fabric weight, tonal embroidery motifs, placket architecture, and lining jacquards.",
              },
              {
                num: "03",
                title: "Apply your measurements",
                desc: "Comprehensive 28-point physiological profile taken in person at our Abeokuta atelier or via concierge.",
              },
              {
                num: "04",
                title: "Meet your stylist",
                desc: "One-on-one consultation to align your commission with your specific event, posture, and timeline.",
              },
              {
                num: "05",
                title: "Crafted by TSquare",
                desc: "Hand-guided cutting, needlework, and progressive canvas fittings executed with zero shortcuts.",
              },
              {
                num: "06",
                title: "Receive your finished piece",
                desc: "Handed over in ceremonial garment casing, permanently preserved in your digital TSquare Wardrobe.",
              },
            ].map((step, idx) => (
              <div
                key={idx}
                className="p-8 bg-near-black fine-border rounded-2xl flex flex-col justify-between hover:border-champagne/40 transition-colors duration-300 shadow-sm"
              >
                <div className="text-2xl font-mono font-bold text-champagne mb-4">
                  {step.num}
                </div>
                <div>
                  <h3 className="font-display text-lg text-warm-ivory uppercase tracking-wider mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-stone-400 font-sans font-light leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button href="/bespoke" variant="champagne" size="lg" className="rounded-xl">
              Begin Your Bespoke Journey
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. CRAFTSMANSHIP                                             */}
      {/* ------------------------------------------------------------- */}
      <section className="py-24 sm:py-32 bg-near-black border-b border-stone-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <span className="text-[10px] uppercase font-mono tracking-[0.28em] text-champagne font-semibold block">
                Atelier Discipline
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-normal tracking-tight text-warm-ivory leading-tight">
                Every detail has a reason.
              </h2>
              <p className="text-sm sm:text-base text-stone-300 font-sans font-light leading-relaxed">
                From the tension of our hand-guided embroidery thread to the weight distribution of an Agbada shoulder yoke, nothing is arbitrary.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  "Super 160s Wools",
                  "28-Point Anatomy",
                  "Knife-Edge Pleating",
                  "Aso-Oke Heritage",
                  "Floating Canvas",
                  "Hand-Felled Linings",
                  "Ceremonial Ensembles",
                  "Heirloom Durability",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-stone-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-champagne shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Button href="/craftsmanship" variant="outline" size="md" className="rounded-xl">
                  Explore Atelier Craftsmanship
                </Button>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="relative aspect-[3/4] bg-espresso fine-border rounded-2xl overflow-hidden shadow-md">
                <Image
                  src="/images/styles/traditional-danshiki.jpg"
                  alt="Aso-Oke fabric and texture"
                  fill
                  sizes="33vw"
                  className="object-cover"
                />
                <span className="absolute bottom-2 left-2 text-[9px] uppercase font-mono tracking-widest text-warm-ivory bg-near-black/80 px-2 py-0.5 rounded-md">
                  01 Fabric
                </span>
              </div>

              <div className="relative aspect-[3/4] bg-espresso fine-border rounded-2xl overflow-hidden shadow-md sm:translate-y-6">
                <Image
                  src="/images/styles/senator-heritage.jpg"
                  alt="Cutting and pattern drafting"
                  fill
                  sizes="33vw"
                  className="object-cover"
                />
                <span className="absolute bottom-2 left-2 text-[9px] uppercase font-mono tracking-widest text-warm-ivory bg-near-black/80 px-2 py-0.5 rounded-md">
                  02 Cutting
                </span>
              </div>

              <div className="relative aspect-[3/4] bg-espresso fine-border rounded-2xl overflow-hidden shadow-md">
                <Image
                  src="/images/styles/agbada-monochrome.jpg"
                  alt="Master tailoring and weaving"
                  fill
                  sizes="33vw"
                  className="object-cover"
                />
                <span className="absolute bottom-2 left-2 text-[9px] uppercase font-mono tracking-widest text-warm-ivory bg-near-black/80 px-2 py-0.5 rounded-md">
                  03 Tailoring
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 7. OCCASION DISCOVERY (Rounded-2xl)                           */}
      {/* ------------------------------------------------------------- */}
      <section className="py-24 sm:py-32 bg-[#0C0C0B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[10px] uppercase font-mono tracking-[0.28em] text-champagne font-semibold block mb-2">
              Curated Dress Codes
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-normal tracking-tight text-warm-ivory">
              Dress for the moment.
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-stone-400 font-sans font-light">
              Filter our house archives according to your life&apos;s most significant moments.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {OCCASIONS.map((occ) => (
              <Link
                key={occ.id}
                href={`/collections?occasion=${encodeURIComponent(occ.name)}`}
                className="group relative aspect-[4/5] overflow-hidden bg-espresso fine-border rounded-2xl p-5 flex flex-col justify-end transition-all duration-300 shadow-sm"
              >
                <Image
                  src={occ.image}
                  alt={occ.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105 filter brightness-[0.7] group-hover:brightness-[0.85]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-near-black via-near-black/40 to-transparent" />
                <div className="relative z-10">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-champagne block mb-1">
                    Occasion
                  </span>
                  <h3 className="font-display text-base sm:text-xl text-warm-ivory group-hover:text-champagne transition-colors">
                    {occ.name}
                  </h3>
                  <p className="mt-1 text-[11px] text-stone-300 font-light line-clamp-2 hidden sm:block">
                    {occ.tagline}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 8. PRIVATE CLIENT TEASER                                      */}
      {/* ------------------------------------------------------------- */}
      <section className="py-24 sm:py-32 bg-near-black border-y border-stone-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold block mb-4">
            PRIVATE CLIENT EXPERIENCE
          </span>

          <h2 className="font-display text-3xl sm:text-5xl font-normal tracking-tight text-warm-ivory leading-tight max-w-3xl mx-auto">
            Your relationship with TSquare, remembered.
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 my-12 text-center">
            {[
              { title: "Your measurements.", sub: "Archived & refined across years" },
              { title: "Your fittings.", sub: "Personal appointment timeline" },
              { title: "Your orders.", sub: "Live bespoke production tracker" },
              { title: "Your wardrobe.", sub: "Permanent digital garments library" },
            ].map((item, idx) => (
              <div key={idx} className="p-5 bg-stone-900/40 fine-border rounded-2xl shadow-sm">
                <div className="font-display text-base sm:text-lg text-warm-ivory font-medium">
                  {item.title}
                </div>
                <div className="text-[10px] text-stone-400 mt-1 uppercase tracking-wider font-light">
                  {item.sub}
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm sm:text-base text-stone-300 font-sans font-light max-w-2xl mx-auto leading-relaxed">
            Your TSquare profile remembers your fit, your preferences, and every piece we have created for you. Access your private client concierge.
          </p>

          <div className="mt-8">
            <Button href="/auth/sign-in" variant="champagne" size="lg" className="rounded-xl">
              Private Client Access
            </Button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 9. BOOK A FITTING CALL TO ACTION                              */}
      {/* ------------------------------------------------------------- */}
      <section className="relative py-28 sm:py-36 overflow-hidden bg-espresso">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/editorial/hero-editorial.jpg"
            alt="Atelier Consultation in Abeokuta"
            fill
            className="object-cover object-top filter brightness-[0.4]"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-near-black/75" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold block mb-3">
            In-Person Atelier Consultation
          </span>

          <h2 className="font-display text-3xl sm:text-5xl font-normal tracking-tight text-warm-ivory">
            Some things should be made in person.
          </h2>

          <p className="mt-4 text-sm sm:text-lg text-stone-300 font-sans font-light max-w-xl mx-auto leading-relaxed">
            Book a consultation, measurement session or fitting with our master tailors at our Abeokuta atelier.
          </p>

          <div className="mt-8">
            <Button href="/book-a-fitting" variant="champagne" size="lg" className="rounded-xl">
              <Calendar className="mr-2 h-4 w-4" />
              Book A Fitting Session
            </Button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 10. CLOSING HOMEPAGE MOMENT                                   */}
      {/* ------------------------------------------------------------- */}
      <section className="py-24 sm:py-32 bg-near-black text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-[10px] uppercase font-mono tracking-[0.28em] text-stone-500 font-semibold block mb-3">
            TSQUARE CLOTHING CAFE
          </span>

          <h2 className="font-display text-3xl sm:text-5xl font-normal tracking-tight text-warm-ivory">
            Your next statement begins here.
          </h2>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button href="/collections" variant="champagne" size="lg" className="rounded-xl">
              Explore Collection
            </Button>
            <Button href="/book-a-fitting" variant="outline" size="lg" className="border-stone-500 text-warm-ivory rounded-xl">
              Book A Fitting
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
