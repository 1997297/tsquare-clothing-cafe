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
        <p role="note" className="mb-8 rounded-xl border border-champagne/30 p-4 text-sm leading-6 text-stone-300">Draft for TCC and legal review. Final payment, cancellation, alteration, delivery and dispute terms require approval before commercial launch.</p>

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
              An appointment request is not a confirmed booking. TCC confirms the schedule in the client area. Rescheduling and cancellation requests are subject to staff review; the existing confirmed time remains in place until a change is approved.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg text-warm-ivory uppercase tracking-wider">
              3. Fabric & Natural Variations
            </h2>
            <p>
              Discuss fabric, colour, fit and finishing choices with the atelier before approving a commission. Reference images illustrate styling and may not represent the final TCC garment. Final quality, alteration and remedy policies must be confirmed by TCC.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg text-warm-ivory uppercase tracking-wider">
              4. Lead Times & Production Calendars
            </h2>
            <p>
              Required dates submitted with a request are preferences until reviewed by the atelier. Confirm the production schedule and fitting arrangements with TCC before relying on a completion date.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg text-warm-ivory uppercase tracking-wider">
              5. Order & Payment Review
            </h2>
            <p>
              An approved request is converted to an order by authorized staff. Order prices and payment instructions are provided through the client area. Uploaded transfer evidence remains pending until reviewed; it is not proof that funds have been received. TCC must approve the final deposit, cancellation, refund, delivery and applicable legal terms.
            </p>
            <p className="text-[10px] text-stone-500 font-mono pt-2">
              This draft is provided for presentation and review. Contact the atelier for clarification before entering a commercial agreement.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
