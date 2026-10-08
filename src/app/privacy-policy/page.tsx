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
        <p role="note" className="mb-8 rounded-xl border border-champagne/30 p-4 text-sm leading-6 text-stone-300">Draft for TCC and legal review. Final privacy disclosures, retention periods and contact details must be approved before commercial launch.</p>

        <div className="p-8 bg-stone-950 fine-border space-y-8 text-xs sm:text-sm text-stone-300 font-sans font-light leading-relaxed">
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
              The platform records contact details for account and atelier operations. Updates and conversations are available in the signed-in client area. Automated email, SMS and WhatsApp notifications are not part of the current service. TCC must confirm its final communication and information-sharing policies before launch.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg text-warm-ivory uppercase tracking-wider">
              4. Account Records & Access
            </h2>
            <p>
              Account records include profiles, measurements, saved Looks, requests, orders, payment evidence, appointments and Concierge conversations. Access to operational records is restricted to the owning client and authorized staff. Payment receipts are stored privately. Profile pictures use publicly accessible image URLs, so do not upload a private document as an avatar. TCC must confirm retention periods and the process for privacy requests.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg text-warm-ivory uppercase tracking-wider">
              5. Policy Inquiries
            </h2>
            <p>
              For questions about this draft, use the <Link href="/contact" className="text-champagne underline">Contact page</Link> or the signed-in Concierge area. TCC will confirm its formal privacy contact in the approved policy.
            </p>
            <p className="text-[10px] text-stone-500 font-mono pt-2">
              This draft is provided for presentation and review; it is not a substitute for TCC-approved legal disclosures.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
