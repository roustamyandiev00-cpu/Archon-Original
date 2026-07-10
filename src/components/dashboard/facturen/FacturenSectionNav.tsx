"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Receipt } from "lucide-react";

export default function FacturenSectionNav() {
  const pathname = usePathname().replace(/\/$/, "");
  const onCreate = pathname === "/dashboard/facturen/nieuw";
  const onList =
    pathname === "/dashboard/facturen" ||
    (pathname.startsWith("/dashboard/facturen/") &&
      !pathname.startsWith("/dashboard/facturen/nieuw"));

  const tabClass = (active: boolean) =>
    `inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? "bg-sky-500/15 text-sky-300 ring-1 ring-inset ring-sky-500/30"
        : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
    }`;

  return (
    <nav
      aria-label="Facturen navigatie"
      className="grid max-w-md grid-cols-2 gap-1 rounded-xl border border-white/10 bg-zinc-950/40 p-1"
    >
      <Link href="/dashboard/facturen/nieuw" className={tabClass(onCreate)}>
        <FileText size={14} />
        Factuur
      </Link>
      <Link href="/dashboard/facturen" className={tabClass(onList)}>
        <Receipt size={14} />
        Facturen
      </Link>
    </nav>
  );
}
