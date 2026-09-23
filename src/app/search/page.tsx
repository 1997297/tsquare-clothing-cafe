import { Suspense } from "react";
import SearchClient from "./SearchClient";

export const metadata = {
  title: "Search Collections & Silhouettes | TSquare Clothing Cafe",
  description:
    "Discover bespoke African luxury garments by style code, silhouette, occasion, and fabric architecture.",
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-near-black py-36 text-center text-stone-400">
          Loading atelier search...
        </div>
      }
    >
      <SearchClient />
    </Suspense>
  );
}
