export default function FacturenLoading() {
  return (
    <div
      className="dashboard-page flex h-full min-h-0 animate-pulse flex-col gap-2 lg:gap-0"
      aria-busy="true"
      aria-label="Facturen laden"
    >
      <header className="dashboard-page-header flex shrink-0 items-center justify-between border-b border-white/10 pb-2">
        <div className="space-y-2">
          <div className="h-2.5 w-28 rounded bg-white/[0.06]" />
          <div className="h-6 w-32 rounded bg-white/[0.06]" />
          <div className="h-3.5 w-72 max-w-[60vw] rounded bg-white/[0.04]" />
        </div>
        <div className="h-10 w-36 rounded-lg bg-sky-500/15" />
      </header>

      <div className="dashboard-page-content">
        <div className="dashboard-data-panel flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/50">
          <div className="dashboard-data-panel-header flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="space-y-2">
              <div className="h-5 w-24 rounded bg-white/[0.06]" />
              <div className="h-3.5 w-80 max-w-[55vw] rounded bg-white/[0.04]" />
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-9 w-24 rounded-lg bg-white/[0.05]"
                />
              ))}
            </div>
          </div>

          <div className="dashboard-data-panel-body flex min-h-0 flex-1 flex-col gap-3 p-4">
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-6 w-20 rounded-full bg-white/[0.05]"
                />
              ))}
            </div>
            <div className="grid grid-cols-[1fr_10rem_6rem] gap-2">
              <div className="h-10 rounded-lg bg-white/[0.05]" />
              <div className="h-10 rounded-lg bg-white/[0.05]" />
              <div className="h-10 rounded-lg bg-white/[0.05]" />
            </div>
            <div className="min-h-64 flex-1 rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="h-11 border-b border-white/[0.08] bg-white/[0.025]" />
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-12 border-b border-white/[0.05] last:border-0"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
