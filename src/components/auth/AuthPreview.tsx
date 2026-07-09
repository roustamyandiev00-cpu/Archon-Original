import { FileText, Receipt, TrendingUp, Users } from "lucide-react";
import { BrandLockup } from "@/components/BrandLogo";
import AuthVideo from "./AuthVideo";

export default function AuthPreview({ embedded = false }: { embedded?: boolean }) {
  return (
    <section
      className={`relative min-h-0 overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/40 ${
        embedded
          ? "flex h-full flex-col"
          : "hidden min-h-0 lg:flex lg:flex-col"
      }`}
    >
      <div className="aurora-glow opacity-50" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col p-6 xl:p-8">
        <BrandLockup markSize={40} wordmarkSize="sm" className="shrink-0" />

        <div className="flex min-h-0 w-full flex-1 items-center justify-center py-4">
          <AuthVideo
            src="/ArchonPro_CRM_logo_intro_202607080214.mp4"
            aspect="portrait"
            fallback={<PreviewCard />}
          />
        </div>

        <div className="shrink-0 max-w-lg">
          <p className="text-base font-medium leading-snug text-zinc-200">
            Offertes, facturen en klanten op één plek.
          </p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">
            De slimme CRM-werkruimte voor zelfstandige vakmensen. Simpel, snel en
            nooit saai.
          </p>
        </div>
      </div>
    </section>
  );
}

function PreviewCard() {
  return (
    <div className="w-full max-w-[20rem] rounded-2xl border border-white/10 bg-zinc-900/70 p-2 shadow-2xl shadow-sky-500/10 backdrop-blur-xl xl:max-w-[24rem]">
      <div className="rounded-xl border border-white/5 bg-zinc-950/80 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-zinc-400">Gefactureerd deze maand</p>
            <p className="mt-1 text-xl font-semibold text-zinc-50">€ 42.980</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
            <TrendingUp size={11} /> +18%
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Stat
            icon={<FileText size={13} />}
            label="Openstaande offertes"
            value="8"
            hint="3 wachten op reactie"
          />
          <Stat
            icon={<Receipt size={13} />}
            label="Te innen"
            value="€ 6.240"
            hint="2 herinneringen klaar"
          />
          <Stat
            icon={<Users size={13} />}
            label="Actieve klanten"
            value="34"
            hint="+5 deze maand"
          />
          <Stat
            icon={<TrendingUp size={13} />}
            label="Winratio offertes"
            value="72%"
            hint="laatste 30 dagen"
          />
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2.5">
      <div className="flex items-center gap-1 text-zinc-400">
        <span className="text-sky-400">{icon}</span>
        <span className="text-[10px] leading-tight">{label}</span>
      </div>
      <p className="mt-1 text-base font-semibold text-zinc-50">{value}</p>
      <p className="mt-0.5 text-[9px] text-zinc-500">{hint}</p>
    </div>
  );
}
