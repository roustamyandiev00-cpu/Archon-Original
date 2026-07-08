import type { Metadata } from "next";
import { Suspense } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Inloggen — ArchonPro",
  description: "Log in op je ArchonPro-account.",
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </AuthLayout>
  );
}
