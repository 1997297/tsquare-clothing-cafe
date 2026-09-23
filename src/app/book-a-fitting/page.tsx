import { Suspense } from "react";
import BookFittingClient from "./BookFittingClient";

export const metadata = {
  title: "Book A Fitting Consultation | TSquare Clothing Cafe",
  description:
    "Schedule an appointment at the TCC office: initial sartorial consultation, 28-point measurement, basted fitting, or final inspection.",
};

export default function BookFittingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-near-black py-36 text-center text-stone-400">
          Loading fitting scheduler...
        </div>
      }
    >
      <BookFittingClient />
    </Suspense>
  );
}
