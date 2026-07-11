"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, List } from "lucide-react";

export default function FacturenSectionNav() {
  const pathname = usePathname().replace(/\/$/, "");
  const onCreate =
    pathname === "/dashboard/facturen" ||
    pathname === "/dashboard/facturen/nieuw";
  const onList =
    pathname === "/dashboard/facturen/lijst" ||
    (pathname.startsWith("/dashboard/facturen/") &&
      pathname !== "/dashboard/facturen" &&
      pathname !== "/dashboard/facturen/nieuw");

  const tabClass = (active: boolean) =>
    `inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
        : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
    }`;

  return (
    <nav
      aria-label="Facturen navigatie"
      className="invoice-section-nav grid max-w-md grid-cols-2 gap-1 rounded-lg border border-zinc-200/80 bg-zinc-100/80 p-1 dark:border-white/10 dark:bg-zinc-900/60"
    >
      <Link href="/dashboard/facturen" className={tabClass(onCreate)}>
        <FileText size={14} />
        Nieuwe factuur
      </Link>
      <Link href="/dashboard/facturen/lijst" className={tabClass(onList)}>
        <List size={14} />
        Overzicht
      </Link>
    </nav>
  );
}
