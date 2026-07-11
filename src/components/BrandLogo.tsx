import Image from "next/image";
import Link from "next/link";

type LogoMarkProps = {
  size?: number;
  className?: string;
  glow?: boolean;
};

export function LogoMark({
  size = 40,
  className = "",
  glow = true,
}: LogoMarkProps) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl ${
        glow
          ? "shadow-[0_0_24px_-6px_rgba(56,189,248,0.42)]"
          : "shadow-[0_8px_24px_-12px_rgba(0,0,0,0.55)]"
      } ${className}`.trim()}
      style={{ width: size, height: size }}
    >
      <Image
        src="/archonpro-icon.png"
        alt="ArchonPro logo"
        width={size}
        height={size}
        className="h-full w-full object-contain"
        priority
        unoptimized
      />
    </span>
  );
}

type BrandWordmarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

export function BrandWordmark({
  className = "",
  size = "md",
}: BrandWordmarkProps) {
  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <span
      className={`font-semibold tracking-tight text-zinc-50 ${sizes[size]} ${className}`.trim()}
    >
      Archon
      <span className="bg-gradient-to-r from-sky-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
        Pro
      </span>
    </span>
  );
}

type BrandLockupProps = {
  markSize?: number;
  className?: string;
  href?: string;
  wordmarkSize?: "sm" | "md" | "lg";
  tagline?: string;
  glow?: boolean;
};

export function BrandLockup({
  markSize = 36,
  className = "",
  href,
  wordmarkSize = "md",
  tagline,
  glow = true,
}: BrandLockupProps) {
  const content = (
    <div className={`flex items-center gap-2.5 ${className}`.trim()}>
      <LogoMark size={markSize} glow={glow} />
      <div className="leading-tight">
        <BrandWordmark size={wordmarkSize} />
        {tagline ? (
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
            {tagline}
          </p>
        ) : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group inline-flex transition-opacity hover:opacity-95">
        {content}
      </Link>
    );
  }

  return content;
}

type BrandFullProps = {
  width?: number;
  className?: string;
  priority?: boolean;
};

export function BrandFull({
  width = 176,
  className = "",
  priority = false,
}: BrandFullProps) {
  return (
    <Image
      src="/archonpro-icon.png"
      alt="ArchonPro CRM"
      width={512}
      height={512}
      className={`object-contain drop-shadow-[0_12px_32px_rgba(0,0,0,0.35)] ${className}`.trim()}
      style={{ width, height: width, maxHeight: width }}
      priority={priority}
      unoptimized
    />
  );
}
