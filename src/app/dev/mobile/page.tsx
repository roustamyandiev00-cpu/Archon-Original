import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Smartphone, Wifi } from "lucide-react";

export const metadata: Metadata = {
  title: "Mobiel koppelen — ArchonPro",
  robots: { index: false, follow: false },
};

function resolveLanUrl(port: string, hostHeader: string | null): string {
  const fromEnv = process.env.MOBILE_DEV_HOST?.trim();
  if (fromEnv) return `http://${fromEnv}:${port}`;

  if (hostHeader && !hostHeader.startsWith("localhost")) {
    const host = hostHeader.split(":")[0];
    return `http://${host}:${port}`;
  }

  return `http://192.168.0.219:${port}`;
}

export default async function MobileConnectPage() {
  const headerStore = await headers();
  const host = headerStore.get("host");
  const port = host?.includes(":") ? host.split(":")[1]! : "3000";
  const baseUrl = resolveLanUrl(port, host);
  const dashboardUrl = `${baseUrl}/dashboard/command-center`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=12&data=${encodeURIComponent(dashboardUrl)}`;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-8 bg-zinc-950 px-6 py-12 text-zinc-100">
      <div className="text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-sky-500/12 text-sky-400">
          <Smartphone size={28} />
        </div>
        <h1 className="text-xl font-semibold">Dashboard op je telefoon</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Scan de QR-code met je iPhone-camera of open de link in Safari.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white p-3 shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrUrl}
          alt={`QR-code voor ${dashboardUrl}`}
          width={240}
          height={240}
          className="block rounded-2xl"
        />
      </div>

      <div className="w-full space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Directe link
        </p>
        <a
          href={dashboardUrl}
          className="block break-all text-sm font-medium text-sky-400 hover:text-sky-300"
        >
          {dashboardUrl}
        </a>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4 text-sm text-amber-100/90">
        <Wifi size={18} className="mt-0.5 shrink-0 text-amber-400" />
        <p>
          Je iPhone moet op hetzelfde WiFi-netwerk zitten als je Mac. USB alleen
          is niet genoeg — gebruik WiFi of scan de QR terwijl je verbonden bent.
        </p>
      </div>

      <Link
        href="/dashboard/command-center"
        className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
      >
        ← Terug naar dashboard
      </Link>
    </main>
  );
}
