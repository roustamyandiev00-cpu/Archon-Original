import Image from "next/image";

type LogoMarkProps = {
  size?: number;
  className?: string;
};

export function LogoMark({ size = 40, className = "" }: LogoMarkProps) {
  return (
    <Image
      src="/logo-tile.png"
      alt="ArchonPro logo"
      width={size}
      height={size}
      className={`rounded-lg ${className}`.trim()}
      style={{ width: size, height: size }}
      priority
      unoptimized
    />
  );
}
