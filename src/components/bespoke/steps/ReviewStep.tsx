"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Pencil } from "lucide-react";
import { BespokeConfiguration, BespokeRequestPayload } from "@/types/bespoke";
import { OCCASIONS, APPOINTMENT_TYPES } from "@/data/bespoke-data";

interface ReviewStepProps {
  config: BespokeConfiguration;
  onEdit: (step: number) => void;
  onSubmit: () => Promise<BespokeRequestPayload>;
  onBack: () => void;
}

function Section({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: number;
  onEdit: (s: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="py-5 border-b border-stone-800/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] uppercase tracking-[0.25em] text-stone-500 font-mono font-semibold">
          {title}
        </h3>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="inline-flex items-center gap-1.5 text-[10px] text-champagne hover:text-champagne-light uppercase tracking-widest transition-colors"
        >
          <Pencil className="w-3 h-3" />
          Edit
        </button>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-xs gap-4">
      <span className="text-stone-500 shrink-0">{label}</span>
      <span className="text-stone-300 text-right">{value}</span>
    </div>
  );
}

export function ReviewStep({ config, onEdit, onSubmit, onBack }: ReviewStepProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const occasionLabel =
    OCCASIONS.find((o) => o.id === config.occasion)?.label ?? config.occasion;
  const appointmentLabel =
    APPOINTMENT_TYPES.find((a) => a.id === config.appointment.type)?.label ??
    config.appointment.type;

  const hasMeasurements =
    config.measurementMethod === "manual" &&
    Object.values(config.measurements).some((v) => v !== undefined);

  async function handleSubmit() {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      await onSubmit();
      router.push("/bespoke/create/confirmation");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Your request could not be submitted.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="animate-in fade-in duration-300">
      <p className="text-[10px] uppercase font-mono tracking-[0.28em] text-champagne mb-3">
        11 / Review
      </p>
      <h1 className="font-display text-3xl sm:text-4xl text-warm-ivory font-normal mb-2">
        Your TSquare Request.
      </h1>
      <p className="text-sm text-stone-400 font-sans leading-relaxed mb-8">
        Review your selections below. Tap Edit on any section to make changes.
      </p>

      <div className="bg-stone-950 border border-stone-800/50 rounded-2xl px-5 sm:px-6 divide-y-0 mb-8">
        {/* Style */}
        <Section title="Style" step={0} onEdit={onEdit}>
          <Row label="Style Code" value={config.isIdeaPath ? "Custom Vision" : config.styleCode} />
          <Row label="Style Name" value={config.isIdeaPath ? undefined : config.styleName} />
          <Row
            label="Garment Type"
            value={
              config.garmentCategory
                ? config.garmentCategory.charAt(0).toUpperCase() +
                  config.garmentCategory.slice(1)
                : undefined
            }
          />
        </Section>

        {/* Fabric */}
        <Section title="Fabric" step={1} onEdit={onEdit}>
          <Row label="Fabric" value={config.fabric?.name} />
          {config.fabric?.weight && (
            <Row label="Weight" value={config.fabric.weight} />
          )}
          {config.fabric?.finish && (
            <Row label="Finish" value={config.fabric.finish} />
          )}
        </Section>

        {/* Colour */}
        <Section title="Colour" step={2} onEdit={onEdit}>
          {config.colour ? (
            <div className="flex items-center gap-2.5">
              <div
                className="w-5 h-5 rounded-full border border-warm-ivory/15 shrink-0"
                style={{ background: config.colour.hex }}
              />
              <span className="text-xs text-stone-300">{config.colour.name}</span>
            </div>
          ) : (
            <span className="text-xs text-stone-600 italic">Not selected</span>
          )}
        </Section>

        {/* Details & Preferences */}
        <Section title="Design Preferences" step={3} onEdit={onEdit}>
          {config.preferences.embroideryStyle && (
            <Row label="Embroidery" value={config.preferences.embroideryStyle} />
          )}
          {config.preferences.agbadaLength && (
            <Row label="Agbada Length" value={config.preferences.agbadaLength} />
          )}
          {config.preferences.capIncluded !== undefined && (
            <Row label="Cap" value={config.preferences.capIncluded ? "Included" : "Not included"} />
          )}
          {config.preferences.collarStyle && (
            <Row label="Collar" value={config.preferences.collarStyle} />
          )}
          {config.preferences.buttonPreference && (
            <Row label="Buttons" value={config.preferences.buttonPreference} />
          )}
          {config.preferences.pocketStyle && (
            <Row label="Pockets" value={config.preferences.pocketStyle} />
          )}
          {config.preferences.trouserBreak && (
            <Row label="Trouser Break" value={config.preferences.trouserBreak} />
          )}
          {config.preferences.sleevePreference && (
            <Row label="Sleeve" value={config.preferences.sleevePreference} />
          )}
          {config.preferences.specialInstructions && (
            <div className="mt-2">
              <p className="text-[10px] text-stone-500 mb-1">Special Instructions</p>
              <p className="text-xs text-stone-400 bg-stone-900/50 rounded-lg px-3 py-2 leading-relaxed">
                {config.preferences.specialInstructions}
              </p>
            </div>
          )}
          {(config.preferences.referenceImages ?? []).length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] text-stone-500 mb-2">
                Reference Images ({config.preferences.referenceImages!.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {config.preferences.referenceImages!.map((img) => (
                  <div
                    key={img.id}
                    className="w-12 h-12 rounded-lg overflow-hidden bg-stone-900 border border-stone-800"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.localUrl} alt={img.filename} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* Fit */}
        <Section title="Fit Preference" step={4} onEdit={onEdit}>
          <Row
            label="Fit"
            value={
              config.fitPreference
                ? config.fitPreference.charAt(0).toUpperCase() + config.fitPreference.slice(1)
                : undefined
            }
          />
        </Section>

        {/* Measurements */}
        <Section title="Measurements" step={5} onEdit={onEdit}>
          <Row
            label="Method"
            value={
              config.measurementMethod === "manual"
                ? "Entered manually"
                : config.measurementMethod === "schedule"
                ? "Measurement at TSquare"
                : config.measurementMethod === "saved"
                ? "Saved profile"
                : undefined
            }
          />
          {config.measurementMethod === "manual" && config.measurementUnit && (
            <Row label="Unit" value={config.measurementUnit.toUpperCase()} />
          )}
          {config.measurementConfidence && (
            <p className="text-[10px] text-amber-500/80 mt-1">
              ⚠ You indicated you are uncertain about some measurements. TSquare will confirm before production.
            </p>
          )}
          {hasMeasurements && (
            <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
              {Object.entries(config.measurements)
                .filter(([, v]) => v !== undefined)
                .map(([key, val]) => (
                  <div key={key} className="flex justify-between text-[11px]">
                    <span className="text-stone-600 capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <span className="text-stone-400">
                      {val} {config.measurementUnit}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </Section>

        {/* Occasion */}
        <Section title="Occasion" step={6} onEdit={onEdit}>
          <Row label="Occasion" value={occasionLabel} />
          {config.eventName && <Row label="Event" value={config.eventName} />}
          {config.eventDate && <Row label="Event Date" value={config.eventDate} />}
        </Section>

        {/* Required Date */}
        <Section title="Required Date" step={7} onEdit={onEdit}>
          <Row label="Needed By" value={config.requiredDate} />
        </Section>

        {/* Appointment */}
        <Section title="Appointment" step={8} onEdit={onEdit}>
          <Row label="Type" value={appointmentLabel} />
          {config.appointment.preferredDate && (
            <Row label="Preferred Date" value={config.appointment.preferredDate} />
          )}
          {config.appointment.preferredTime && (
            <Row
              label="Preferred Time"
              value={config.appointment.preferredTime.charAt(0).toUpperCase() + config.appointment.preferredTime.slice(1)}
            />
          )}
          {config.appointment.notes && (
            <Row label="Notes" value={config.appointment.notes} />
          )}
        </Section>

        {/* Contact */}
        <Section title="Contact Information" step={9} onEdit={onEdit}>
          <Row
            label="Name"
            value={`${config.contact.firstName} ${config.contact.lastName}`.trim() || undefined}
          />
          <Row label="Phone" value={config.contact.phone || undefined} />
          <Row label="Email" value={config.contact.email || undefined} />
          <Row
            label="Preferred Contact"
            value={
              config.contact.preferredContact
                ? config.contact.preferredContact.charAt(0).toUpperCase() +
                  config.contact.preferredContact.slice(1)
                : undefined
            }
          />
        </Section>
      </div>

      {/* Pricing notice */}
      <div className="p-5 bg-stone-900/50 border border-stone-800/60 rounded-2xl mb-10">
        <p className="text-xs text-stone-300 leading-relaxed">
          Your request will be reviewed by the TSquare team. Once confirmed, your order details and pricing will be made available to you.
        </p>
        <p className="text-[10px] text-stone-600 mt-2 leading-relaxed">
          No payment is required at this stage. This is a request, not a confirmed order.
        </p>
      </div>

      {/* CTAs */}
      {submitError && (
        <p role="alert" className="mb-4 text-xs text-red-300">{submitError}</p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-3.5 text-xs uppercase tracking-widest text-stone-400 hover:text-warm-ivory border border-stone-800 hover:border-stone-600 rounded-2xl transition-all duration-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-4 text-xs uppercase tracking-[0.2em] font-bold rounded-2xl bg-champagne text-near-black hover:bg-champagne-light transition-all duration-200 shadow-lg shadow-champagne/20"
        >
          {isSubmitting ? "Submitting Request…" : "Submit Bespoke Request"}
        </button>
      </div>
    </div>
  );
}
