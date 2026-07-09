import type { Metadata } from "next";
import { Suspense } from "react";
import { LogIn } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Inloggen — ArchonPro",
  description: "Log in op je ArchonPro-account.",
};

export default function LoginPage() {
  return (
    <AuthLayout
      hero={{
        variant: "slate",
        kicker: (
          <>
            <LogIn size={13} /> Inloggen
          </>
        ),
        title: "Welkom terug in je",
        accent: "werkruimte",
        subtitle:
          "Log in en pak je offertes, facturen en projecten op waar je gebleven was.",
      }}
    >
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </AuthLayout>
  );
}
