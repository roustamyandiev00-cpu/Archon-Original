export default function AdminLoading() {
  return (
    <div
      className="space-y-6"
      aria-busy="true"
      aria-label="Platformbeheer laden"
    >
      <div className="h-36 animate-pulse rounded-3xl border border-white/10 bg-zinc-900/50" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl border border-white/10 bg-zinc-900/40"
          />
        ))}
      </div>
      <div className="h-[28rem] animate-pulse rounded-2xl border border-white/10 bg-zinc-900/40" />
      <span className="sr-only">Platformgegevens worden geladen…</span>
    </div>
  );
}
