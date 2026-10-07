import { ConciergeListPage, type ConciergeSearch } from "@/components/atelier/ConciergePages";
export default function Page({ searchParams }: { searchParams: Promise<ConciergeSearch> }) {
  return <ConciergeListPage staff searchParams={searchParams} />;
}
