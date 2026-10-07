import Link from "next/link";
import { NewConciergeForm } from "@/components/atelier/ConciergePages";
import { getAtelierContextOptions, requireAtelierPage } from "@/lib/server/atelier-service";
export default async function Page() {
  await requireAtelierPage(false);
  return <div className="mx-auto max-w-3xl space-y-7"><Link href="/account/concierge" className="text-xs text-champagne">← Concierge</Link><NewConciergeForm options={await getAtelierContextOptions()} /></div>;
}
