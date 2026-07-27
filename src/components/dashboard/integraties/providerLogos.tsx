"use client";

/** Merklogo’s voor integratiekaarten (lokale SVG’s, geen externe CDN). */

type LogoProps = { className?: string };

function Frame({
  className,
  bg,
  children,
}: {
  className?: string;
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${bg} ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

function Initial({
  letter,
  bg,
  className,
}: {
  letter: string;
  bg: string;
  className?: string;
}) {
  return (
    <Frame className={className} bg={bg}>
      <span className="text-sm font-bold text-white">{letter}</span>
    </Frame>
  );
}

const LOGO: Record<string, (p: LogoProps) => React.ReactNode> = {
  slack: ({ className }) => (
    <Frame className={className} bg="bg-[#4A154B]">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#fff" aria-hidden>
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.268 0a2.527 2.527 0 0 1 2.52-2.52 2.527 2.527 0 0 1 2.523 2.52v6.313A2.528 2.528 0 0 1 8.83 24a2.528 2.528 0 0 1-2.52-2.522v-6.313zM8.83 5.042a2.528 2.528 0 0 1-2.52-2.52A2.528 2.528 0 0 1 8.83 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.83zm0 1.268a2.528 2.528 0 0 1 2.521 2.52 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.83a2.528 2.528 0 0 1 2.522-2.52H8.83zm10.128 2.52a2.528 2.528 0 0 1 2.52-2.52A2.528 2.528 0 0 1 24 8.83a2.528 2.528 0 0 1-2.522 2.521h-2.52V8.83zm-1.269 0a2.528 2.528 0 0 1-2.52 2.521 2.527 2.527 0 0 1-2.521-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.52 2.522v6.313zM15.165 18.958a2.528 2.528 0 0 1 2.521 2.52A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.52h2.52zm0-1.269a2.527 2.527 0 0 1-2.52-2.52 2.526 2.526 0 0 1 2.52-2.521h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.52h-6.313z" />
      </svg>
    </Frame>
  ),
  "google-calendar": ({ className }) => (
    <Frame className={className} bg="bg-white">
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path fill="#1A73E8" d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
        <path fill="#EA4335" d="M7 12h2v2H7zm0 4h2v2H7z" />
        <path fill="#34A853" d="M11 12h2v2h-2zm0 4h2v2h-2z" />
        <path fill="#FBBC04" d="M15 12h2v2h-2zm0 4h2v2h-2z" />
      </svg>
    </Frame>
  ),
  "microsoft-teams": ({ className }) => (
    <Frame className={className} bg="bg-[#5059C9]">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#fff" aria-hidden>
        <path d="M20.625 8.5h-3.75V6.75A2.25 2.25 0 0 0 14.625 4.5h-5.25A2.25 2.25 0 0 0 7.125 6.75v1.875H3.375A1.125 1.125 0 0 0 2.25 9.75v8.625A2.625 2.625 0 0 0 4.875 21h14.25a2.625 2.625 0 0 0 2.625-2.625V9.75a1.125 1.125 0 0 0-1.125-1.25zM9 7.5h6v1H9v-1zm0 3h3.75v1.5H9V10.5zm0 3h3.75V15H9v-1.5zm9.75 4.5H5.25v-6h13.5v6z" />
      </svg>
    </Frame>
  ),
  dropbox: ({ className }) => (
    <Frame className={className} bg="bg-[#0061FF]">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#fff" aria-hidden>
        <path d="M6 2 0 6l6 4 6-4-6-4zm12 0-6 4 6 4 6-4-6-4zM0 14l6 4 6-4-6-4-6 4zm18-4-6 4 6 4 6-4-6-4zm-6 5.5L6 15.5 0 19.5 6 23.5l6-4 6 4 6-4-6-4-6 4z" />
      </svg>
    </Frame>
  ),
  zapier: ({ className }) => (
    <Frame className={className} bg="bg-[#FF4A00]">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#fff" aria-hidden>
        <path d="M15.5 2H20l-3.5 7H21l-12 13 2.5-9H7L15.5 2z" />
      </svg>
    </Frame>
  ),
  quickbooks: ({ className }) => (
    <Frame className={className} bg="bg-[#2CA01C]">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#fff" aria-hidden>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5H8.5v-7H11v7zm5 0h-2.5v-7H16v7z" />
      </svg>
    </Frame>
  ),
  peppol: ({ className }) => (
    <Frame className={className} bg="bg-[#0B3D91]">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#fff" aria-hidden>
        <path d="M12 2 3 7v10l9 5 9-5V7l-9-5zm0 2.2 6.5 3.6v7.4L12 18.8 5.5 15.2V7.8L12 4.2zM8 9v6h2.2c1.9 0 3.3-1.2 3.3-3S12.1 9 10.2 9H8zm2 1.6h.2c.8 0 1.3.5 1.3 1.4s-.5 1.4-1.3 1.4H10V10.6z" />
      </svg>
    </Frame>
  ),
  billit: ({ className }) => (
    <Initial letter="B" bg="bg-[#1E88E5]" className={className} />
  ),
  yuki: ({ className }) => (
    <Initial letter="Y" bg="bg-[#00A3A1]" className={className} />
  ),
  "exact-online": ({ className }) => (
    <Initial letter="E" bg="bg-[#ED1C24]" className={className} />
  ),
  teamleader: ({ className }) => (
    <Initial letter="T" bg="bg-[#00B2A9]" className={className} />
  ),
  octopus: ({ className }) => (
    <Initial letter="O" bg="bg-[#5C6BC0]" className={className} />
  ),
  winbooks: ({ className }) => (
    <Initial letter="W" bg="bg-[#1565C0]" className={className} />
  ),
  silverfin: ({ className }) => (
    <Initial letter="S" bg="bg-[#00A0DC]" className={className} />
  ),
  codabox: ({ className }) => (
    <Initial letter="C" bg="bg-[#FF6B00]" className={className} />
  ),
  horus: ({ className }) => (
    <Initial letter="H" bg="bg-[#37474F]" className={className} />
  ),
  "sage-bob-50": ({ className }) => (
    <Frame className={className} bg="bg-[#00DC00]">
      <span className="text-[10px] font-black tracking-tight text-[#003300]">
        SAGE
      </span>
    </Frame>
  ),
  clearfacts: ({ className }) => (
    <Frame className={className} bg="bg-[#00A0E3]">
      <span className="text-xs font-bold text-white">CF</span>
    </Frame>
  ),
  bouwsoft: ({ className }) => (
    <Frame className={className} bg="bg-[#F5A623]">
      <span className="text-xs font-bold text-zinc-900">BS</span>
    </Frame>
  ),
  vertuoza: ({ className }) => (
    <Frame className={className} bg="bg-[#6C3CE1]">
      <span className="text-xs font-bold text-white">Vz</span>
    </Frame>
  ),
  "isabel-6": ({ className }) => (
    <Initial letter="I" bg="bg-[#003366]" className={className} />
  ),
};

export function ProviderLogo({
  id,
  name,
  className,
}: {
  id: string;
  name?: string;
  className?: string;
}) {
  const render = LOGO[id];
  if (render) return <>{render({ className })}</>;
  return (
    <Initial
      letter={(name ?? id).charAt(0).toUpperCase()}
      bg="bg-zinc-700"
      className={className}
    />
  );
}
