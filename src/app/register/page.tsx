import type { Metadata } from "next";
import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Registreren — ArchonPro",
  description: "Maak gratis een ArchonPro-account aan.",
};

export default function RegisterPage() {
  return (
    <AuthLayout
      hero={{
        variant: "rose",
        kicker: (
          <>
            <Sparkles size={13} /> Gratis starten
          </>
        ),
        title: "Start vandaag met",
        accent: "ArchonPro",
        subtitle:
          "14 dagen gratis proberen. Geen creditcard nodig — direct aan de slag met offertes en facturen.",
      }}
    >
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
    </AuthLayout>
  );
}
