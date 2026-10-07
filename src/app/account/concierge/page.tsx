import { ConciergeListPage, type ConciergeSearch } from "@/components/atelier/ConciergePages";
export const dynamic = "force-dynamic";
export default function Page({ searchParams }: { searchParams: Promise<ConciergeSearch> }) {
  return <ConciergeListPage staff={false} searchParams={searchParams} />;
}
