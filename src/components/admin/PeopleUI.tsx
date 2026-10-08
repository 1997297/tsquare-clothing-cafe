import Link from 'next/link';
import type { ReactNode } from 'react';
import { atelierPanel } from '@/components/atelier/styles';

export function PeoplePagination({ page, total, size = 30, href }: { page: number; total: number; size?: number; href: (page: number) => string }) {
  return <nav aria-label="Record pages" className="mt-5 flex flex-wrap items-center gap-5 text-xs text-champagne">
    {page > 0 && <Link href={href(page - 1)}>← Previous</Link>}
    <span className="text-stone-400">Page {page + 1} · {total} records</span>
    {(page + 1) * size < total && <Link href={href(page + 1)}>Next →</Link>}
  </nav>;
}
export function PeopleSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return <section id={id} className={`${atelierPanel} scroll-mt-28`}><h2 className="font-display text-2xl">{title}</h2><div className="mt-5 space-y-5">{children}</div></section>;
}
export function PeopleRecord({ href, title, children }: { href: string; title: string; children?: ReactNode }) {
  return <article className="min-w-0 border-b border-stone-800 pb-4 last:border-0"><Link href={href} className="break-words text-sm text-champagne hover:underline">{title} →</Link><div className="mt-2 space-y-2 break-words text-xs leading-6 text-stone-400">{children}</div></article>;
}
export function peopleDate(value: string | null) {
  return value ? new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeZone: 'Africa/Lagos' }).format(new Date(value)) : 'Not recorded';
}
