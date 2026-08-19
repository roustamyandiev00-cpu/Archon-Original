function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />;
}

export default function OfferteBewerkenLoading() {
  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] flex-col overflow-hidden">
      <header className="shrink-0 border-b border-white/10 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-11 w-24 rounded-full" />
            <Skeleton className="h-11 w-28 rounded-full" />
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-5 overflow-hidden pb-8 pt-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(420px,0.9fr)]">
        <div className="min-h-0 space-y-6 overflow-hidden">
          {[1, 2, 3].map((section) => (
            <section
              key={section}
              className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5"
            >
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-11 w-full" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </div>
            </section>
          ))}
        </div>
        <aside className="hidden min-h-0 rounded-2xl border border-white/10 bg-white/[0.025] p-5 xl:block">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="mx-auto h-[calc(100vh-13rem)] max-h-[720px] w-full" />
        </aside>
      </div>
    </div>
  );
}
