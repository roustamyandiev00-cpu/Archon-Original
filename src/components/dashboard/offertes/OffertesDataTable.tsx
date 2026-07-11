"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Mail,
  MoreHorizontal,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import DocumentContactActions from "@/components/dashboard/DocumentContactActions";
import type { OfferteListRow } from "@/components/dashboard/offertes/OffertesView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatEuro, statusMeta } from "@/lib/offertes";

const pageSize = 5;

type StatusFilter =
  | "all"
  | "concept"
  | "verzonden"
  | "bekeken"
  | "geaccepteerd"
  | "afgewezen";

const avatarTones = [
  "border-sky-400/30 bg-sky-500/10 text-sky-300",
  "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  "border-violet-400/30 bg-violet-500/10 text-violet-300",
  "border-amber-400/30 bg-amber-500/10 text-amber-300",
  "border-rose-400/30 bg-rose-500/10 text-rose-300",
] as const;

function statusBadgeVariant(
  status: string | null,
): "default" | "success" | "warning" | "info" | "danger" {
  if (status === "geaccepteerd") return "success";
  if (status === "verzonden" || status === "bekeken") return "info";
  if (status === "afgewezen") return "danger";
  if (status === "concept") return "warning";
  return "default";
}

export default function OffertesDataTable({
  offertes,
  isDemo = false,
  showFilters = true,
}: {
  offertes: OfferteListRow[];
  isDemo?: boolean;
  showFilters?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return offertes.filter((o) => {
      const hay = [o.nummer, o.klant, o.status_new, o.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        normalizedQuery.length === 0 || hay.includes(normalizedQuery);

      const matchesStatus =
        statusFilter === "all" || o.status_new === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [offertes, query, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, filtered.length);
  const visible = filtered.slice(pageStart, pageEnd);

  const allVisibleSelected =
    visible.length > 0 && visible.every((o) => selectedIds.has(o.id));

  function resetFilters() {
    setQuery("");
    setStatusFilter("all");
    setPage(1);
  }

  function toggleSelectAll() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        visible.forEach((o) => next.delete(o.id));
      } else {
        visible.forEach((o) => next.add(o.id));
      }
      return next;
    });
  }

  function toggleSelect(id: number) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="dashboard-table-scroll flex min-h-0 flex-1 flex-col gap-2 lg:gap-1.5">
      {showFilters && (
        <div className="grid shrink-0 gap-2 lg:grid-cols-[minmax(12rem,1fr)_9rem_auto]">
          <label className="relative block">
            <span className="sr-only">Zoek offertes</span>
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Zoek op nummer, klant, status…"
              className="pl-9"
            />
          </label>

          <label>
            <span className="sr-only">Filter op status</span>
            <Select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as StatusFilter);
                setPage(1);
              }}
            >
              <option value="all">Alle statussen</option>
              <option value="concept">Concept</option>
              <option value="verzonden">Verzonden</option>
              <option value="bekeken">Bekeken</option>
              <option value="geaccepteerd">Geaccepteerd</option>
              <option value="afgewezen">Afgewezen</option>
            </Select>
          </label>

          <Button
            type="button"
            variant="ghost"
            onClick={resetFilters}
            className="justify-center"
          >
            <RotateCcw size={15} />
            Reset
          </Button>
        </div>
      )}

      <div className="flex shrink-0 items-center gap-2 text-xs text-zinc-500">
        <SlidersHorizontal size={14} />
        <span>
          {filtered.length.toLocaleString("nl-BE")} van{" "}
          {offertes.length.toLocaleString("nl-BE")} offertes
        </span>
        {selectedIds.size > 0 && (
          <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-300">
            {selectedIds.size} geselecteerd
          </span>
        )}
      </div>

      <div className="dashboard-table-scroll min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAll}
                  aria-label="Selecteer alle zichtbare offertes"
                  className="h-4 w-4 rounded border-white/20 bg-zinc-950 accent-sky-500"
                />
              </TableHead>
              <TableHead className="min-w-0">Offerte</TableHead>
              <TableHead className="min-w-0">Klant</TableHead>
              <TableHead className="hidden min-w-0 lg:table-cell">Datum</TableHead>
              <TableHead className="hidden min-w-0 xl:table-cell">Geldig tot</TableHead>
              <TableHead className="text-right">Bedrag</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden text-right 2xl:table-cell">Versturen</TableHead>
              <TableHead className="text-right lg:sticky lg:right-0 lg:z-10 lg:bg-zinc-950 lg:shadow-[-16px_0_24px_rgba(9,9,11,0.72)]">
                <span className="sr-only">Acties</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length > 0 ? (
              visible.map((o, index) => {
                const meta = statusMeta(o.status_new);
                const tone =
                  avatarTones[index % avatarTones.length] ?? avatarTones[0];

                return (
                  <TableRow key={o.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(o.id)}
                        onChange={() => toggleSelect(o.id)}
                        aria-label={`Selecteer ${o.nummer ?? o.klant}`}
                        className="h-4 w-4 rounded border-white/20 bg-zinc-950 accent-sky-500"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span
                          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${tone}`}
                          aria-hidden
                        >
                          <FileText size={16} />
                        </span>
                        <div className="min-w-0">
                          {isDemo ? (
                            <p className="truncate font-mono text-sm font-medium text-zinc-100">
                              {o.nummer ?? `#${o.id}`}
                            </p>
                          ) : (
                            <Link
                              href={`/dashboard/offertes/${o.id}`}
                              className="truncate font-mono text-sm font-medium text-sky-400 hover:text-sky-300"
                            >
                              {o.nummer ?? `#${o.id}`}
                            </Link>
                          )}
                          {o.email ? (
                            <p className="flex items-center gap-1 truncate text-xs text-zinc-500">
                              <Mail size={11} className="shrink-0" />
                              {o.email}
                            </p>
                          ) : (
                            <p className="text-xs text-zinc-600">Geen e-mail</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-0">
                      {o.klant ? (
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <Building2 size={13} className="shrink-0 text-zinc-500" />
                          <span className="truncate">{o.klant}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden min-w-0 lg:table-cell">
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-zinc-400">
                        <Calendar size={11} />
                        {formatDate(o.datum)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden min-w-0 font-mono text-xs text-zinc-400 xl:table-cell">
                      {formatDate(o.geldig_tot)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-zinc-100">
                      {formatEuro(o.bedrag)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(o.status_new)}>
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-right 2xl:table-cell">
                      <DocumentContactActions
                        soort="offerte"
                        nummer={o.nummer ?? `#${o.id}`}
                        klant={o.klant ?? "klant"}
                        bedrag={o.bedrag}
                        email={o.email}
                        phone={o.phone}
                        detailPath={
                          isDemo ? undefined : `/dashboard/offertes/${o.id}`
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right lg:sticky lg:right-0 lg:bg-zinc-950 lg:shadow-[-16px_0_24px_rgba(9,9,11,0.72)]">
                      <OfferteActionMenu
                        offerte={o}
                        isDemo={isDemo}
                        open={openMenuId === o.id}
                        onOpenChange={(open) =>
                          setOpenMenuId(open ? o.id : null)
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="py-16 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center">
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/5 text-zinc-500">
                      <FileText size={22} />
                    </span>
                    <p className="mt-3 text-sm font-medium text-zinc-200">
                      {offertes.length === 0
                        ? "Nog geen offertes"
                        : "Geen resultaten"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {offertes.length === 0
                        ? "Maak je eerste offerte via Nieuw manueel of Met AI-agent."
                        : "Pas je zoekopdracht of filters aan."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t border-white/10 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-zinc-500">
          Rijen per pagina{" "}
          <span className="font-mono text-zinc-300">{pageSize}</span>
          {" · "}
          Toont{" "}
          <span className="font-mono text-zinc-300">
            {filtered.length === 0 ? 0 : pageStart + 1}
          </span>{" "}
          tot{" "}
          <span className="font-mono text-zinc-300">{pageEnd}</span> van{" "}
          <span className="font-mono text-zinc-300">
            {filtered.length.toLocaleString("nl-BE")}
          </span>
        </p>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            aria-label="Vorige pagina"
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="min-w-24 text-center font-mono text-xs text-zinc-400">
            Pagina {currentPage} / {pageCount}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setPage(Math.min(pageCount, currentPage + 1))}
            disabled={currentPage === pageCount}
            aria-label="Volgende pagina"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function OfferteActionMenu({
  offerte,
  isDemo,
  open,
  onOpenChange,
}: {
  offerte: OfferteListRow;
  isDemo: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const nummer = offerte.nummer ?? `#${offerte.id}`;

  return (
    <div className="relative inline-flex justify-end">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={(event) => {
          event.stopPropagation();
          onOpenChange(!open);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Acties voor ${nummer}`}
      >
        <MoreHorizontal size={16} />
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-xl border border-white/10 bg-zinc-950 py-1 text-left shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          {isDemo ? (
            <span className="block px-3 py-2 text-sm text-zinc-500">
              Demo-offerte
            </span>
          ) : (
            <Link
              href={`/dashboard/offertes/${offerte.id}`}
              role="menuitem"
              className="block px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-zinc-100"
              onClick={() => onOpenChange(false)}
            >
              Open offerte
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
