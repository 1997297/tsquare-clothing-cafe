import Link from "next/link";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Button } from "@/components/common/Button";

export default function NotFound() {
  return (
    <div className="bg-near-black min-h-screen text-warm-ivory flex flex-col justify-center items-center px-4 py-32 text-center selection:bg-champagne selection:text-near-black">
      <div className="max-w-md w-full space-y-6">
        <BrandLogo variant="light" size="lg" />

        <div className="pt-6">
          <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold block mb-2">
            Error 404 • Page Not Found
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-warm-ivory font-normal">
            The Silhouette Has Moved
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-stone-400 font-light leading-relaxed">
            The archive link you are attempting to view is unavailable or has been relocated within our atelier portfolio.
          </p>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button href="/" variant="champagne" size="md">
            Return to Homepage
          </Button>
          <Button href="/collections" variant="outline" size="md" className="border-stone-600 text-warm-ivory">
            Explore Collections
          </Button>
        </div>

        <div className="pt-8 border-t border-stone-800 text-[10px] uppercase font-mono tracking-widest text-stone-500">
          TSquare Clothing Cafe • TCC Office
        </div>
      </div>
    </div>
  );
}
