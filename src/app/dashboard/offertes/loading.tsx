export default function OffertesLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Offertes laden">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded bg-white/[0.06]" />
          <div className="h-4 w-64 max-w-full rounded bg-white/[0.04]" />
        </div>
        <div className="h-10 w-40 rounded-lg bg-sky-500/15" />
      </div>
      <div className="min-h-[400px] rounded-2xl border border-white/10 bg-zinc-950/50 p-4">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-white/[0.05]" />
          ))}
        </div>
      </div>
    </div>
  );
}
