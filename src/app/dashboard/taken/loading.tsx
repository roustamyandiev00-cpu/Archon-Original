export default function TakenLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Taken laden">
      <div className="space-y-2">
        <div className="h-7 w-32 rounded bg-white/[0.06]" />
        <div className="h-4 w-64 max-w-full rounded bg-white/[0.04]" />
      </div>
      <div className="min-h-[400px] rounded-2xl border border-white/10 bg-zinc-950/50 p-4">
        <div className="mb-4 flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 w-24 rounded-lg bg-white/[0.05]" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-white/[0.05]" />
          ))}
        </div>
      </div>
    </div>
  );
}
