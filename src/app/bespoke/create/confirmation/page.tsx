"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, ArrowRight, Home, Layers } from "lucide-react";
import { getLastSubmission } from "@/lib/bespoke-store";
import { BespokeRequestPayload } from "@/types/bespoke";

export default function ConfirmationPage() {
  const [submission, setSubmission] = useState<BespokeRequestPayload | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSubmission(getLastSubmission());
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-near-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-champagne/30 border-t-champagne rounded-full animate-spin" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-near-black flex items-center justify-center px-6">
        <div className="text-center max-w-md space-y-6">
          <h1 className="font-display text-2xl text-warm-ivory">
            No Recent Request
          </h1>
          <p className="text-sm text-stone-400">
            It looks like there is no recent bespoke request to display. Begin a new journey from our collections.
          </p>
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 px-6 py-3 text-xs uppercase tracking-widest font-bold bg-champagne text-near-black hover:bg-champagne-light rounded-2xl transition-all"
          >
            Browse Collections
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-near-black flex flex-col">
      {/* Decorative top accent */}
      <div className="h-1 bg-gradient-to-r from-transparent via-champagne/60 to-transparent" />

      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24">
        <div className="max-w-lg w-full text-center space-y-8">
          {/* Success icon */}
          <div className="mx-auto w-16 h-16 rounded-full border-2 border-champagne/40 bg-champagne/10 flex items-center justify-center animate-in zoom-in duration-500">
            <Check className="w-7 h-7 text-champagne stroke-[2.5]" />
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="font-display text-3xl sm:text-4xl text-warm-ivory">
              Your request is with us.
            </h1>
            <p className="text-sm text-stone-400 leading-relaxed max-w-md mx-auto">
              The TSquare team will review your selections, measurements and requested timeline before confirming the next step.
            </p>
          </div>

          {/* Request details card */}
          <div className="bg-[#141412] border border-stone-800/50 rounded-2xl p-6 sm:p-8 text-left space-y-5">
            {/* Reference */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-stone-500 font-mono mb-1">
                Request Reference
              </p>
              <p className="text-sm text-champagne font-mono font-bold tracking-wider">
                {submission.requestId}
              </p>
            </div>

            {/* Style */}
            <div className="flex items-center gap-4 pt-3 border-t border-stone-800/40">
              {submission.styleName && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-0.5">
                    {submission.isIdeaPath ? "Garment Type" : "Style"}
                  </p>
                  <p className="text-sm text-warm-ivory">
                    {submission.isIdeaPath
                      ? submission.garmentCategory
                        ? submission.garmentCategory.charAt(0).toUpperCase() +
                          submission.garmentCategory.slice(1)
                        : "Custom Vision"
                      : `${submission.styleCode} / ${submission.styleName}`}
                  </p>
                </div>
              )}
            </div>

            {/* Contact method */}
            <div className="pt-3 border-t border-stone-800/40">
              <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-0.5">
                We will contact you via
              </p>
              <p className="text-sm text-warm-ivory capitalize">
                {submission.contact.preferredContact || "Email"} at{" "}
                <span className="text-stone-400">
                  {submission.contact.preferredContact === "email"
                    ? submission.contact.email
                    : submission.contact.phone}
                </span>
              </p>
            </div>

            {/* Appointment */}
            {submission.appointmentRequest && (
              <div className="pt-3 border-t border-stone-800/40">
                <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-0.5">
                  Appointment Requested
                </p>
                <p className="text-sm text-warm-ivory capitalize">
                  {submission.appointmentRequest.type?.replace(/-/g, " ")}
                  {submission.appointmentRequest.preferredDate &&
                    ` on ${submission.appointmentRequest.preferredDate}`}
                </p>
              </div>
            )}
          </div>

          {/* Dev notice */}
          <div className="p-3.5 bg-stone-900/40 border border-stone-800/40 rounded-xl">
            <p className="text-[10px] text-stone-600 leading-relaxed">
              Development Mode: This request has been saved locally in your browser. In production, it will be transmitted securely to the TSquare team.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 px-6 py-3.5 text-xs uppercase tracking-widest font-bold bg-champagne text-near-black hover:bg-champagne-light rounded-2xl transition-all"
            >
              <Layers className="w-4 h-4" />
              Explore More Styles
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3.5 text-xs uppercase tracking-widest text-stone-400 hover:text-warm-ivory border border-stone-800 hover:border-stone-600 rounded-2xl transition-all"
            >
              <Home className="w-4 h-4" />
              Return Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
