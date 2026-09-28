export default function LeadsLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Leads laden">
      <div className="space-y-2">
        <div className="h-7 w-32 rounded bg-white/[0.06]" />
        <div className="h-4 w-64 max-w-full rounded bg-white/[0.04]" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="min-h-[300px] rounded-2xl border border-white/10 bg-zinc-950/50 p-3">
            <div className="mb-3 h-6 w-24 rounded bg-white/[0.06]" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-20 rounded-lg bg-white/[0.05]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
