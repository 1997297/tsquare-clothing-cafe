import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Compass, Award, Shield } from "lucide-react";
import { Button } from "@/components/common/Button";

export const metadata = {
  title: "Our Story & Heritage | TSquare Clothing Cafe",
  description:
    "The philosophy, roots, and vision of TSquare Clothing Cafe (TCC). Rooted in Abeokuta, Ogun State, crafting luxury menswear for the man who commands presence.",
};

export default function StoryPage() {
  return (
    <div className="bg-near-black min-h-screen text-warm-ivory selection:bg-champagne selection:text-near-black pt-28 sm:pt-36 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Brand Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
          <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold block mb-3">
            The TSquare House Narrative
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-normal tracking-tight text-warm-ivory leading-tight">
            Rooted in Abeokuta. Crafted for Presence.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-stone-300 font-sans font-light leading-relaxed">
            TSquare Clothing Cafe (TCC) was founded on a singular conviction: that modern African menswear should neither compromise on ancestral dignity nor on master-level bespoke tailoring.
          </p>
        </div>

        {/* Hero Editorial Image */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-espresso fine-border rounded-2xl sm:rounded-3xl mb-20">
          <Image
            src="/images/editorial/story-hero.jpg"
            alt="TSquare Clothing Cafe Editorial Vision"
            fill
            priority
            className="object-cover object-top filter brightness-[0.75]"
            sizes="(max-width: 1024px) 100vw, 1000px"
          />
          <div className="absolute bottom-4 left-4 bg-near-black/80 px-3 py-1 text-[10px] uppercase font-mono tracking-widest text-stone-300 rounded-full border border-stone-800">
            Abeokuta, Ogun State, Nigeria
          </div>
        </div>

        {/* Story Section 1: The Brand Philosophy */}
        <section className="mb-20 space-y-6">
          <div className="border-b border-stone-800 pb-3">
            <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-champagne font-semibold">
              01 • Sartorial Philosophy
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl text-warm-ivory font-normal">
            Presence is Not Demanded; It Is Felt.
          </h2>
          <div className="space-y-4 text-stone-300 font-sans font-light leading-relaxed text-sm sm:text-base">
            <p>
              In Yoruba culture and across the wider West African diaspora, the manner in which a man dresses for a public gathering or family coronation is an act of high cultural communication. The broad sweep of an Agbada commands space; the razor-sharp symmetry of a Senator speaks of discipline and purpose.
            </p>
            <p>
              At TSquare Clothing Cafe, we refuse to treat these garments as casual commodities. Every piece that leaves our cutting tables is an individual commission, drafted with respect for the wearer&apos;s physical posture and societal role.
            </p>
          </div>
        </section>

        {/* Story Section 2: The Abeokuta Foundation */}
        <section className="mb-20 grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-6 space-y-6">
            <div className="border-b border-stone-800 pb-3">
              <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-champagne font-semibold">
                02 • Geographic Roots
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-warm-ivory font-normal">
              The Abeokuta Heritage
            </h2>
            <div className="space-y-4 text-stone-300 font-sans font-light leading-relaxed text-sm sm:text-base">
              <p>
                Abeokuta, the historic city beneath the protective stones of Olumo, has for generations been a cradle of Yoruba textile mastery, adire artistry, and sartorial pride.
              </p>
              <p>
                Operating our primary atelier in Abeokuta anchors our work in deep ancestral soil while our contemporary cutting methods cater to the modern global executive.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-400">
              <MapPin className="h-4 w-4 text-champagne" />
              <span>Abeokuta, Ogun State, Nigeria</span>
            </div>
          </div>

          <div className="md:col-span-6 relative aspect-[4/5] bg-espresso fine-border rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg">
            <Image
              src="/images/styles/traditional-chieftain.jpg"
              alt="Ancestral sartorial pride"
              fill
              className="object-cover object-top filter brightness-[0.9]"
            />
          </div>
        </section>

        {/* Story Section 3: The TSquare Man */}
        <section className="mb-20 p-8 sm:p-12 bg-[#141412] fine-border rounded-2xl sm:rounded-3xl">
          <div className="border-b border-stone-800 pb-3 mb-6">
            <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-champagne font-semibold">
              03 • The Archetype
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl text-warm-ivory font-normal mb-4">
            Who is The TSquare Man?
          </h2>
          <p className="font-display text-xl text-stone-300 font-light italic border-l-2 border-champagne pl-4 my-6">
            &ldquo;He values substance over noise. When he walks into a reception, a boardroom, or a banquet, his clothing does not scream for attention. It naturally commands it.&rdquo;
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 text-xs text-stone-400">
            <div>
              <h4 className="font-bold text-warm-ivory uppercase tracking-wider mb-1">
                Authentic Individuality
              </h4>
              <p className="font-light leading-relaxed">
                Refusing off-the-rack conformity in pursuit of a garment designed specifically for his anatomy.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-warm-ivory uppercase tracking-wider mb-1">
                Cultural Reverence
              </h4>
              <p className="font-light leading-relaxed">
                Holding deep pride in West African textiles, hand embroidery, and regal ceremonial form.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-warm-ivory uppercase tracking-wider mb-1">
                Enduring Quality
              </h4>
              <p className="font-light leading-relaxed">
                Investing in garments built to endure through decades of momentous occasions and family milestones.
              </p>
            </div>
          </div>
        </section>

        {/* Story Section 4: Notice on Verified Information */}
        <section className="mb-20 p-6 bg-near-black fine-border rounded-2xl text-stone-400 text-xs leading-relaxed">
          <div className="flex items-center gap-2 text-stone-300 font-mono uppercase text-[10px] tracking-widest mb-2 font-semibold">
            <Shield className="h-4 w-4 text-champagne" />
            Atelier Archival Notice
          </div>
          <p className="font-light">
            [Atelier Archive Note: Specific historical founding dates, proprietary patent milestones, and verified atelier team profiles are archived under brand records and will be updated as our public documentation expands. TSquare Clothing Cafe operates strictly from Abeokuta, Ogun State, Nigeria.]
          </p>
        </section>

        {/* Closing CTA */}
        <div className="text-center pt-8 border-t border-stone-800">
          <h3 className="font-display text-2xl text-warm-ivory">
            Experience TSquare Sartorial Discipline
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-stone-400 font-light">
            Connect with our tailoring atelier for your next milestone celebration.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Button href="/book-a-fitting" variant="champagne" size="md">
              Book A Fitting
            </Button>
            <Button href="/collections" variant="outline" size="md" className="border-stone-600 text-warm-ivory">
              View Collections
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
