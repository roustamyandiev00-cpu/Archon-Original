import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { redirect } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import PasswordResetForm from "@/components/auth/PasswordResetForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Wachtwoord wijzigen — ArchonPro",
  description: "Kies een nieuw wachtwoord voor je ArchonPro-account.",
};

export default async function PasswordResetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=recovery");
  }

  return (
    <AuthLayout
      hero={{
        variant: "slate",
        kicker: (
          <>
            <KeyRound size={13} /> Accountbeveiliging
          </>
        ),
        title: "Kies een nieuw",
        accent: "wachtwoord",
        subtitle:
          "Gebruik een nieuw, uniek wachtwoord dat je nergens anders gebruikt.",
      }}
    >
      <PasswordResetForm />
    </AuthLayout>
  );
}
