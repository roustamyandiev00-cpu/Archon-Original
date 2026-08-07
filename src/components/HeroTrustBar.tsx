import { BadgeCheck, MapPinned, UserRoundCheck } from "lucide-react";

const trustPoints = [
  {
    title: "Gebouwd in België",
    detail: "Data blijft in de EU",
    icon: MapPinned,
  },
  {
    title: "GDPR-bewust",
    detail: "Jouw data blijft van jou",
    icon: BadgeCheck,
  },
  {
    title: "Menselijke controle",
    detail: "AI met jouw goedkeuring",
    icon: UserRoundCheck,
  },
];

export default function HeroTrustBar() {
  return (
    <div className="relative z-10 border-y border-white/[0.09] bg-[#081728]/90 backdrop-blur-md">
      <div className="mx-auto grid max-w-[90rem] divide-y divide-white/[0.08] px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-10">
          {trustPoints.map((point) => (
            <div
              key={point.title}
              className="flex items-center gap-4 px-2 py-5 sm:justify-center sm:px-6 sm:py-6"
            >
              <point.icon size={28} strokeWidth={1.5} className="shrink-0 text-orange-300" />
              <div>
                <p className="text-sm font-semibold text-slate-100">{point.title}</p>
                <p className="mt-1 text-xs text-slate-400 sm:text-sm">{point.detail}</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
