import Navbar from "@/components/Navbar";
import PageHero, { type HeroVariant } from "@/components/PageHero";
import AuthPreview from "./AuthPreview";

export type AuthHeroConfig = {
  variant: HeroVariant;
  kicker: React.ReactNode;
  title: string;
  accent?: string;
  subtitle: string;
};

export default function AuthLayout({
  children,
  hero,
}: {
  children: React.ReactNode;
  hero: AuthHeroConfig;
}) {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          variant={hero.variant}
          kicker={hero.kicker}
          title={hero.title}
          accent={hero.accent}
          subtitle={hero.subtitle}
          compact
          showCtas={false}
        />

        <section className="border-b border-white/10 bg-zinc-950">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:flex-row lg:items-stretch lg:gap-8 lg:p-8">
            <section className="flex flex-1 items-center justify-center py-4 sm:py-8">
              <div className="w-full max-w-sm">{children}</div>
            </section>
            <AuthPreview />
          </div>
        </section>
      </main>
    </>
  );
}
