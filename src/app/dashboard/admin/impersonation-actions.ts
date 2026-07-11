"use server";

import { redirect } from "next/navigation";
import { startImpersonation, stopImpersonation } from "@/lib/impersonation";

export async function actAsCompanyAction(companyId: number): Promise<void> {
  const result = await startImpersonation(companyId);
  if ("error" in result) {
    throw new Error(result.error);
  }
  redirect("/dashboard/command-center");
}

export async function stopImpersonationAction(): Promise<void> {
  await stopImpersonation();
  redirect("/dashboard/admin");
}
