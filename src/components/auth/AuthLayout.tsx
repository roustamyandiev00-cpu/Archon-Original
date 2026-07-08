import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import AuthPreview from "./AuthPreview";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen bg-zinc-950 text-zinc-100">
      <Link
        href="/"
        className="group absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm text-zinc-500 transition-colors hover:text-zinc-200 sm:left-6 sm:top-6"
      >
        <ArrowLeft
          size={15}
          className="transition-transform group-hover:-translate-x-0.5"
        />
        Terug
      </Link>

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:flex-row lg:items-stretch lg:gap-8 lg:p-8">
        {/* Form side */}
        <section className="relative flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-sm">
            <Link
              href="/"
              className="mb-10 inline-flex items-center gap-2"
              aria-label="Terug naar home"
            >
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
            </Link>
            {children}
          </div>
        </section>

        {/* Preview side */}
        <AuthPreview />
      </div>
    </main>
  );
}
