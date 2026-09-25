"use client";

import { useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  Send,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { submitContactEnquiryAction } from "./actions";

export default function ContactClient() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Bespoke Commission Inquiry",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitError("");
    const result = await submitContactEnquiryAction(formData);
    if (result.ok) {
      setIsSubmitted(true);
    } else {
      setSubmitError(result.error);
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-near-black min-h-screen text-warm-ivory pt-28 sm:pt-36 pb-24 selection:bg-champagne selection:text-near-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold block mb-3">
            Atelier Liaison & Concierge
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-normal tracking-tight text-warm-ivory">
            Connect With TSquare
          </h1>
          <p className="mt-4 text-sm sm:text-base text-stone-300 font-sans font-light leading-relaxed">
            Whether inquiring about a bespoke commission, scheduling an in-person measurement session, or seeking styling advice, our atelier team is at your service.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left Column: Atelier Information & Socials */}
          <div className="lg:col-span-5 space-y-8">
            <div className="p-8 bg-stone-950 fine-border rounded-2xl sm:rounded-3xl space-y-6">
              <h3 className="font-display text-2xl text-warm-ivory">
                The TCC Office
              </h3>

              <div className="space-y-4 text-xs text-stone-300">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-champagne shrink-0 mt-1" />
                  <div>
                    <span className="font-semibold text-warm-ivory block uppercase tracking-wider text-[10px] mb-0.5">
                      House Location
                    </span>
                    <p className="text-stone-400">Abeokuta, Ogun State, Nigeria</p>
                    <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                      [Exact atelier street address provided upon consultation confirmation]
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-champagne shrink-0 mt-1" />
                  <div>
                    <span className="font-semibold text-warm-ivory block uppercase tracking-wider text-[10px] mb-0.5">
                      Atelier Hours
                    </span>
                    <p className="text-stone-400">
                      Monday to Saturday: 9:00 AM to 6:00 PM WAT
                    </p>
                    <p className="text-stone-400">Sunday: By Private Appointment Only</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-champagne shrink-0 mt-1" />
                  <div>
                    <span className="font-semibold text-warm-ivory block uppercase tracking-wider text-[10px] mb-0.5">
                      Direct Inquiries
                    </span>
                    <p className="text-stone-400 font-mono">
                      [Official House Telephone, Reserved for Direct Concierge]
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-champagne shrink-0 mt-1" />
                  <div>
                    <span className="font-semibold text-warm-ivory block uppercase tracking-wider text-[10px] mb-0.5">
                      Electronic Mail
                    </span>
                    <p className="text-stone-400 font-mono">
                      concierge@tsquareclothingcafe.com
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Channels Notice */}
              <div className="pt-4 border-t border-stone-800">
                <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-stone-500 font-semibold block mb-3">
                  Official Channels
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1 bg-near-black fine-border rounded-full text-stone-300">
                    Instagram: @tsquareclothingcafe
                  </span>
                  <span className="px-3 py-1 bg-near-black fine-border rounded-full text-stone-300">
                    WhatsApp Concierge
                  </span>
                  <span className="px-3 py-1 bg-near-black fine-border rounded-full text-stone-300">
                    Facebook
                  </span>
                  <span className="px-3 py-1 bg-near-black fine-border rounded-full text-stone-300">
                    TikTok
                  </span>
                </div>
              </div>
            </div>

            {/* Private fitting notice */}
            <div className="p-6 bg-near-black fine-border rounded-2xl">
              <div className="flex items-center gap-2 text-champagne text-xs uppercase font-mono tracking-widest font-semibold mb-2">
                <Shield className="h-4 w-4" />
                Fitting Appointments
              </div>
              <p className="text-xs text-stone-400 font-light leading-relaxed">
                To dedicate our uninterrupted attention to your commission, fitting and measurement sessions must be reserved in advance.
              </p>
              <div className="mt-4">
                <Button href="/book-a-fitting" variant="champagne" size="sm">
                  Book A Fitting Session
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Concierge Message Form */}
          <div className="lg:col-span-7">
            <div className="p-8 sm:p-10 bg-stone-950 fine-border rounded-2xl sm:rounded-3xl">
              <div className="mb-6">
                <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-champagne font-semibold block mb-1">
                  Atelier Dispatch
                </span>
                <h3 className="font-display text-2xl text-warm-ivory">
                  Send A Message To Our Stylists
                </h3>
              </div>

              {isSubmitted ? (
                <div className="py-12 text-center space-y-4">
                  <CheckCircle2 className="h-12 w-12 text-champagne mx-auto" />
                  <h4 className="font-display text-2xl text-warm-ivory">
                    Inquiry Received
                  </h4>
                  <p className="text-sm text-stone-300 font-light max-w-md mx-auto leading-relaxed">
                    Thank you, <strong className="text-warm-ivory">{formData.name}</strong>. Your message has been logged with the TCC office. A team member will respond via email/WhatsApp shortly.
                  </p>
                  <div className="pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsSubmitted(false);
                        setFormData({
                          name: "",
                          email: "",
                          phone: "",
                          subject: "Bespoke Commission Inquiry",
                          message: "",
                        });
                      }}
                      className="text-warm-ivory border-stone-700"
                    >
                      Send Another Message
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="contact-name" className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1.5 font-medium">
                        Full Name *
                      </label>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="e.g. Olawale Adeleke"
                        className="w-full bg-near-black border border-stone-800 rounded-xl text-warm-ivory text-xs px-4 py-3 focus:outline-none focus:border-champagne"
                      />
                    </div>

                    <div>
                      <label htmlFor="contact-email" className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1.5 font-medium">
                        Email Address *
                      </label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="e.g. adeleke@example.com"
                        className="w-full bg-near-black border border-stone-800 rounded-xl text-warm-ivory text-xs px-4 py-3 focus:outline-none focus:border-champagne"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="contact-phone" className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1.5 font-medium">
                        Phone / WhatsApp *
                      </label>
                      <input
                        id="contact-phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        required
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="+234..."
                        className="w-full bg-near-black border border-stone-800 rounded-xl text-warm-ivory text-xs px-4 py-3 focus:outline-none focus:border-champagne font-mono"
                      />
                    </div>

                    <div>
                      <label htmlFor="contact-subject" className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1.5 font-medium">
                        Subject of Inquiry
                      </label>
                      <select
                        id="contact-subject"
                        name="subject"
                        value={formData.subject}
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value })
                        }
                        className="w-full bg-near-black border border-stone-800 rounded-xl text-warm-ivory text-xs px-4 py-3 focus:outline-none focus:border-champagne"
                      >
                        <option value="Bespoke Commission Inquiry">
                          Bespoke Commission Inquiry
                        </option>
                        <option value="Groom / Wedding Attire Inquiry">
                          Groom / Wedding Attire Inquiry
                        </option>
                        <option value="TCC Office Visit">
                          TCC Office Visit
                        </option>
                        <option value="Fabric & Sizing Consultation">
                          Fabric & Sizing Consultation
                        </option>
                        <option value="General Concierge">General Concierge</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1.5 font-medium">
                      Message / Special Requests *
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      placeholder="Please share your target event date, desired style (e.g. Agbada, Senator), or any specific fabric preferences..."
                      className="w-full bg-near-black border border-stone-800 rounded-xl text-warm-ivory text-xs px-4 py-3 focus:outline-none focus:border-champagne font-sans leading-relaxed"
                    />
                  </div>

                  <div className="pt-2">
                    {submitError && <p role="alert" className="mb-3 text-xs text-red-300">{submitError}</p>}
                    <Button
                      type="submit"
                      variant="champagne"
                      size="lg"
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        "Transmitting to Atelier..."
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Transmit Inquiry to Atelier
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-[10px] text-stone-500 text-center font-mono">
                    All communications are handled with strict sartorial discretion.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
