export default function FactuurDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 pb-10">
      <div className="space-y-3 rounded-2xl border border-white/[0.06] bg-zinc-900/25 px-5 py-4">
        <div className="h-4 w-36 animate-pulse rounded bg-white/5" />
        <div className="h-8 w-56 animate-pulse rounded-lg bg-white/5" />
        <div className="h-4 w-40 animate-pulse rounded bg-white/5" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-5">
            <div className="flex justify-between gap-4 border-b border-white/[0.08] pb-5">
              <div className="space-y-2">
                <div className="h-3 w-16 animate-pulse rounded bg-white/5" />
                <div className="h-6 w-40 animate-pulse rounded bg-white/5" />
                <div className="h-4 w-28 animate-pulse rounded bg-white/5" />
              </div>
              <div className="h-24 w-48 animate-pulse rounded-2xl bg-white/[0.04]" />
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-16 animate-pulse rounded bg-white/5" />
                  <div className="h-4 w-24 animate-pulse rounded bg-white/5" />
                </div>
              ))}
            </div>
            <div className="h-48 animate-pulse rounded-2xl bg-white/[0.04]" />
            <div className="ml-auto h-24 w-56 animate-pulse rounded-xl bg-white/[0.04]" />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="h-72 animate-pulse rounded-2xl border border-white/[0.08] bg-zinc-900/50" />
            <div className="h-72 animate-pulse rounded-2xl border border-white/[0.08] bg-zinc-900/50" />
          </div>
        </div>

        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl border border-white/[0.08] bg-zinc-900/50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
