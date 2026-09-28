import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard — ArchonPro",
};

export default function Home() {
  redirect("/dashboard/command-center");
}
