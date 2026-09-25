import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms & Conditions | TSquare Clothing Cafe",
  description:
    "Terms and Conditions governing bespoke commissions, atelier appointments, and fitting protocols for TSquare Clothing Cafe in Abeokuta, Nigeria.",
};

export default function TermsPage() {
  return (
    <div className="bg-near-black min-h-screen text-warm-ivory pt-28 sm:pt-36 pb-24 selection:bg-champagne selection:text-near-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center text-[10px] uppercase font-mono tracking-[0.25em] text-stone-400 hover:text-champagne transition-colors mb-8"
        >
          <ArrowLeft className="mr-2 h-3.5 w-3.5" />
          Back to Home
        </Link>

        <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold block mb-2">
          Atelier Terms of Engagement
        </span>
        <h1 className="font-display text-3xl sm:text-5xl font-normal tracking-tight text-warm-ivory mb-8">
          Terms & Conditions
        </h1>

        <div className="p-8 bg-stone-950 fine-border space-y-8 text-xs sm:text-sm text-stone-300 font-sans font-light leading-relaxed">
          <section className="space-y-3">
            <h2 className="font-display text-lg text-warm-ivory uppercase tracking-wider">
              1. The Bespoke Nature of Commissions
            </h2>
            <p>
              TSquare Clothing Cafe specializes in bespoke and custom-tailored menswear. Unlike mass-manufactured garments, every piece is individually cut, styled, and constructed based on specific customer measurements and fabric choices.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg text-warm-ivory uppercase tracking-wider">
              2. Atelier Consultations & Fittings
            </h2>
            <p>
              Fitting sessions reserved through our platform are scheduled to provide dedicated attention. We kindly request that clients notify the atelier at least 24 hours in advance should any rescheduling be necessary.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg text-warm-ivory uppercase tracking-wider">
              3. Fabric & Natural Variations
            </h2>
            <p>
              Due to the authentic artisanal characteristics of hand-loomed textiles (such as Nigerian Aso-Oke) and pure wool blends, subtle variations in texture, weave slubbing, and embroidery tension are celebrated hallmarks of handcrafted luxury and do not constitute defects.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg text-warm-ivory uppercase tracking-wider">
              4. Lead Times & Production Calendars
            </h2>
            <p>
              Standard lead times range between two to five weeks depending on embroidery density and fitting checkpoints. For grooms and ceremonial events, we recommend commissioning garments at least six to eight weeks in advance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg text-warm-ivory uppercase tracking-wider">
              5. Governing Atelier Jurisdiction
            </h2>
            <p>
              All interactions and commissions are guided by the laws of the Federal Republic of Nigeria, with primary operations conducted in Abeokuta, Ogun State.
            </p>
            <p className="text-[10px] text-stone-500 font-mono pt-2">
              [Note: These terms provide the operational baseline for Phase 1 exploration and will be supplemented with definitive commercial payment and deposit terms during Phase 2 order management implementation.]
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
