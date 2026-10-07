"use client";

import { atelierButton, atelierPanel } from "./styles";
export function ServiceError({ reset }: { reset: () => void }) {
  return <section className={atelierPanel} role="alert"><h2 className="font-display text-2xl">The atelier workspace could not be loaded</h2><p className="my-5 text-sm leading-6 text-stone-400">Your records have not been removed. Please retry, or sign in again if your session has expired.</p><button onClick={reset} className={atelierButton}>Try again</button></section>;
}
