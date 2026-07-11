import HeroDashboardPreview from "@/components/HeroDashboardPreview";

export default function HeroDashboard() {
  return (
    <div className="relative flex h-full w-full items-center justify-center lg:justify-end">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[90%] w-[95%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.32),transparent_68%)] lg:left-[58%]"
      />

      <div className="relative z-10 w-full origin-top lg:translate-x-4 lg:scale-[1.04] xl:translate-x-8 xl:scale-[1.08]">
        <HeroDashboardPreview />
      </div>
    </div>
  );
}
