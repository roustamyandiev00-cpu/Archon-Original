export default function DashboardLoading() {
  return (
    <div
      role="status"
      className="animate-pulse space-y-6"
      aria-busy="true"
      aria-label="Dashboard laden"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-white/[0.06] bg-white/[0.03]"
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
        <div className="h-72 rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
      </div>
      <div className="h-48 rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
      <span className="sr-only">Dashboardgegevens worden geladen…</span>
    </div>
  );
}
