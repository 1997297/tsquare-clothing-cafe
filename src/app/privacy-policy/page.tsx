import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | TSquare Clothing Cafe",
  description:
    "Privacy Policy and client data protection guidelines of TSquare Clothing Cafe (TCC) in Abeokuta, Ogun State, Nigeria.",
};

export default function PrivacyPolicyPage() {
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
          Atelier Client Protection
        </span>
        <h1 className="font-display text-3xl sm:text-5xl font-normal tracking-tight text-warm-ivory mb-8">
          Privacy Policy
        </h1>

        <div className="p-8 bg-[#151513] fine-border space-y-8 text-xs sm:text-sm text-stone-300 font-sans font-light leading-relaxed">
          <section className="space-y-3">
            <h2 className="font-display text-lg text-warm-ivory uppercase tracking-wider">
              1. Introduction & House Commitment
            </h2>
            <p>
              TSquare Clothing Cafe (&ldquo;TCC&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the Atelier&rdquo;), located in Abeokuta, Ogun State, Nigeria, is dedicated to upholding the utmost discretion and confidentiality concerning our clients&apos; personal identity, contact details, and bespoke anatomical measurement profiles.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg text-warm-ivory uppercase tracking-wider">
              2. Anatomical & Fitting Data Collection
            </h2>
            <p>
              To craft bespoke garments, we collect physiological measurements (including chest, waist, shoulder slope, sleeve length, and posture notes) during in-person or guided fitting consultations. This data is utilized solely for drafting, cutting, and refining your garments.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg text-warm-ivory uppercase tracking-wider">
              3. Client Communications
            </h2>
            <p>
              Contact information provided through appointment bookings, inquiries, or account creation is employed strictly for scheduling confirmations, production milestones updates, and bespoke concierge correspondence via WhatsApp, telephone, or email. We never sell, rent, or trade client information to third-party marketing services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg text-warm-ivory uppercase tracking-wider">
              4. Digital Wardrobe & Future Portal Storage
            </h2>
            <p>
              As the TCC digital platform evolves into subsequent operational phases, client measurement profiles, historical commissions, and garment archives will be safeguarded via industry-standard encryption protocols within our private client vault.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg text-warm-ivory uppercase tracking-wider">
              5. Policy Inquiries
            </h2>
            <p>
              For questions regarding client data privacy, please contact the concierge desk at the TCC office or via electronic mail at concierge@tsquareclothingcafe.com.
            </p>
            <p className="text-[10px] text-stone-500 font-mono pt-2">
              [Note: This privacy policy establishes the baseline sartorial privacy principles for Phase 1. Final comprehensive legal disclosures will be ratified with local legal counsel prior to commercial transaction activation.]
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
