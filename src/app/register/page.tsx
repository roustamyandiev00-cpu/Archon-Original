import type { Metadata } from "next";
import { Suspense } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Registreren — ArchonPro",
  description: "Maak gratis een ArchonPro-account aan.",
};

export default function RegisterPage() {
  return (
    <AuthLayout>
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
    </AuthLayout>
  );
}
