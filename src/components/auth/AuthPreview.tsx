import Image from "next/image";
import { FileText, Receipt, TrendingUp, Users } from "lucide-react";
import AuthVideo from "./AuthVideo";

export default function AuthPreview() {
  return (
    <section className="relative hidden flex-1 overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/40 lg:block">
      <div className="aurora-glow opacity-60" />

      <div className="relative z-10 flex h-full flex-col p-10">
        <div className="flex items-center gap-2">
          <Image
            src="/logo-tile.png"
            alt="ArchonPro logo"
            width={40}
            height={40}
            className="h-10 w-10 rounded-lg"
          />
          <span className="text-base font-semibold tracking-tight text-zinc-50">
            ArchonPro
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <AuthVideo
            src="/ArchonPro_CRM_logo_intro_202607080214.mp4"
            fallback={<PreviewCard />}
          />
        </div>

        <div className="max-w-sm">
          <p className="text-lg font-medium leading-relaxed text-zinc-200">
            Offertes, facturen en klanten op één plek.
          </p>
          <p className="mt-1 text-sm text-zinc-400">
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
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900/70 p-2 shadow-2xl shadow-sky-500/10 backdrop-blur-xl">
      <div className="rounded-2xl border border-white/5 bg-zinc-950/80 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-400">Gefactureerd deze maand</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-50">€ 42.980</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
            <TrendingUp size={12} /> +18%
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Stat
            icon={<FileText size={14} />}
            label="Openstaande offertes"
            value="8"
            hint="3 wachten op reactie"
          />
          <Stat
            icon={<Receipt size={14} />}
            label="Te innen"
            value="€ 6.240"
            hint="2 herinneringen klaar"
          />
          <Stat
            icon={<Users size={14} />}
            label="Actieve klanten"
            value="34"
            hint="+5 deze maand"
          />
          <Stat
            icon={<TrendingUp size={14} />}
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
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
      <div className="flex items-center gap-1.5 text-zinc-400">
        <span className="text-sky-400">{icon}</span>
        <span className="text-[11px] leading-tight">{label}</span>
      </div>
      <p className="mt-1.5 text-lg font-semibold text-zinc-50">{value}</p>
      <p className="mt-0.5 text-[10px] text-zinc-500">{hint}</p>
    </div>
  );
}
