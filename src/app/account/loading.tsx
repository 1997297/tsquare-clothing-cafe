export default function AccountLoading() {
  return (
    <div className="animate-pulse space-y-8" aria-label="Loading private client page">
      <div className="space-y-3 border-b border-stone-800/60 pb-6">
        <div className="h-2.5 w-36 rounded-full bg-stone-800" />
        <div className="h-8 w-64 max-w-full rounded-xl bg-stone-900" />
        <div className="h-3 w-96 max-w-full rounded-full bg-stone-900" />
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-44 rounded-3xl bg-stone-950 fine-border" />
        ))}
      </div>
    </div>
  );
}
