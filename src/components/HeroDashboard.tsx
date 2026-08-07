import HeroDashboardPreview from "@/components/HeroDashboardPreview";

export default function HeroDashboard() {
  return (
    <div className="relative flex h-full w-full min-w-0 max-w-full items-center justify-center lg:justify-end">
      <div className="relative z-10 w-full min-w-0 max-w-[50rem] origin-center">
        <HeroDashboardPreview />
      </div>
    </div>
  );
}
