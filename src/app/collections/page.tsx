import { Suspense } from "react";
import CollectionsClient from "./CollectionsClient";

export const metadata = {
  title: "Collections | House Silhouettes",
  description:
    "Explore the complete collection of TSquare Clothing Cafe menswear silhouettes: Agbada, Senator, Kaftan, Traditional, Bespoke, and Formal.",
};

export default function CollectionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-near-black py-32 text-center text-stone-400">Loading collections...</div>}>
      <CollectionsClient />
    </Suspense>
  );
}
