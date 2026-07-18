"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Receipt,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  DashboardMobileCard,
  DashboardMobileEmpty,
} from "@/components/dashboard/DashboardMobileCard";
import TableRowActionMenu from "@/components/dashboard/TableRowActionMenu";
import { tableColumnClass } from "@/components/dashboard/table-columns";
import { markFactuurAsPaid } from "@/app/dashboard/facturen/actions";
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
import { documentTypeMeta, factuurStatusMeta } from "@/lib/facturen";
import { formatDate, formatEuro } from "@/lib/offertes";
import { useRouter } from "next/navigation";
import type { TableRowMenuItem } from "@/components/dashboard/TableRowActionMenu";

export type FactuurListItem = {
  id: number;
  nummer: string | null;
  klant: string | null;
  totaal_bedrag: number | null;
  datum: string | null;
  vervaldatum: string | null;
  status: string | null;
  document_type: string | null;
  paid_at: string | null;
  email: string | null;
  phone: string | null;
};

const PAGE_SIZE_OPTIONS = [5, 10, 20] as const;

export type FactuurColumnKey = "date" | "dueDate";

export type FactuurColumnVisibility = Record<FactuurColumnKey, boolean>;

export const FACTUUR_COLUMN_OPTIONS = [
  { id: "date", label: "Factuurdatum" },
  { id: "dueDate", label: "Vervaldatum" },
] as const;

export const defaultFactuurColumnVisibility: FactuurColumnVisibility = {
  date: true,
  dueDate: true,
};

const stickyActionsClass =
  "text-right sticky right-0 z-10 bg-zinc-950/95 shadow-[-8px_0_16px_rgba(9,9,11,0.35)] group-hover:bg-zinc-900/90";

type StatusFilter = "all" | "concept" | "verzonden" | "betaald" | "vervallen";

const statusBadgeVariant = (
  status: string | null,
): "default" | "success" | "warning" | "info" | "danger" => {
  if (status === "betaald" || status === "deels_betaald") return "success";
  if (status === "verzonden") return "info";
  if (status === "vervallen") return "danger";
  if (status === "concept") return "warning";
  return "default";
};

export default function FacturenDataTable({
  facturen,
  isDemo = false,
  showFilters = true,
  columnVisibility = defaultFactuurColumnVisibility,
}: {
  facturen: FactuurListItem[];
  isDemo?: boolean;
  showFilters?: boolean;
  columnVisibility?: FactuurColumnVisibility;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return facturen.filter((f) => {
      const hay = [f.nummer, f.klant, f.status, f.document_type]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        normalizedQuery.length === 0 || hay.includes(normalizedQuery);

      const matchesStatus =
        statusFilter === "all" || f.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [facturen, query, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, filtered.length);
  const visible = filtered.slice(pageStart, pageEnd);
  const allVisibleSelected =
    visible.length > 0 && visible.every((f) => selectedIds.has(f.id));

  function resetFilters() {
    setQuery("");
    setStatusFilter("all");
    setPage(1);
  }

  function toggleSelectAll() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        visible.forEach((f) => next.delete(f.id));
      } else {
        visible.forEach((f) => next.add(f.id));
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
        <div className="grid shrink-0 gap-2 lg:grid-cols-[minmax(12rem,1fr)_10rem_auto]">
          <label className="relative block">
            <span className="sr-only">Zoek facturen</span>
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
              <option value="betaald">Betaald</option>
              <option value="vervallen">Vervallen</option>
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

      <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs text-zinc-500">
        <SlidersHorizontal size={14} />
        <span>
          {filtered.length.toLocaleString("nl-BE")} van{" "}
          {facturen.length.toLocaleString("nl-BE")} facturen
        </span>
        {selectedIds.size > 0 ? (
          <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-300">
            {selectedIds.size} geselecteerd
          </span>
        ) : null}
      </div>

        <div className="dashboard-table-scroll min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10">
          <div className="flex h-full flex-col gap-2 overflow-y-auto p-2 lg:hidden">
            {visible.length > 0 ? (
              visible.map((f) => {
                const meta = factuurStatusMeta(f.status);
                const typeMeta = documentTypeMeta(f.document_type);

                return (
                  <DashboardMobileCard key={f.id}>
                    <div className="flex items-start justify-between gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(f.id)}
                        onChange={() => toggleSelect(f.id)}
                        aria-label={`Selecteer ${f.nummer ?? `factuur ${f.id}`}`}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-zinc-950 accent-sky-500"
                      />
                      <div className="min-w-0 flex-1">
                        {isDemo ? (
                          <p className="truncate font-mono text-sm font-medium text-zinc-100">
                            {f.nummer ?? `#${f.id}`}
                          </p>
                        ) : (
                          <Link
                            href={`/dashboard/facturen/${f.id}`}
                            className="truncate font-mono text-sm font-medium text-sky-400"
                          >
                            {f.nummer ?? `#${f.id}`}
                          </Link>
                        )}
                        <p className="mt-0.5 truncate text-xs text-zinc-400">{f.klant}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge variant="default">{typeMeta.label}</Badge>
                        <Badge variant={statusBadgeVariant(f.status)}>
                          {meta.label}
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-2 font-mono text-sm font-semibold text-zinc-100">
                      {formatEuro(f.totaal_bedrag)}
                    </p>
                    <p className="mt-1 font-mono text-xs text-zinc-500">
                      {formatDate(f.datum)}
                      {f.vervaldatum ? ` · verval ${formatDate(f.vervaldatum)}` : ""}
                    </p>
                    <div className="mt-3 flex items-center justify-end border-t border-white/10 pt-2">
                      <FactuurRowMenu
                        id={f.id}
                        nummer={f.nummer ?? `#${f.id}`}
                        isPaid={Boolean(f.paid_at) || f.status === "betaald"}
                        canMarkPaid={
                          !Boolean(f.paid_at) &&
                          f.status !== "betaald" &&
                          f.document_type !== "proforma" &&
                          ["verzonden", "herinnerd", "vervallen", "deels_betaald"].includes(
                            f.status ?? "",
                          )
                        }
                        isDemo={isDemo}
                        open={openMenuId === f.id}
                        onOpenChange={(open) => setOpenMenuId(open ? f.id : null)}
                      />
                    </div>
                  </DashboardMobileCard>
                );
              })
            ) : (
              <div className="space-y-3">
                <DashboardMobileEmpty
                  icon={<Receipt size={22} />}
                  title="Geen zoekresultaten"
                  description="Pas je zoekopdracht of statusfilter aan."
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetFilters}
                  className="mx-auto flex"
                >
                  <RotateCcw size={15} />
                  Filters wissen
                </Button>
              </div>
            )}
          </div>

          <div className="hidden h-full overflow-auto lg:block">
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow className="group border-b border-white/[0.08] bg-zinc-900/70 hover:bg-zinc-900/70">
                <TableHead className="w-11">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    aria-label="Selecteer zichtbare facturen"
                    className="h-4 w-4 rounded border-white/20 bg-zinc-950 accent-sky-500"
                  />
                </TableHead>
                <TableHead className="min-w-0 text-zinc-400">Nummer</TableHead>
                <TableHead className="min-w-0 text-zinc-400">Klant</TableHead>
                <TableHead
                  className={tableColumnClass(
                    columnVisibility.date,
                    "xl",
                    "text-zinc-400",
                  )}
                >
                  Factuurdatum
                </TableHead>
                <TableHead
                  className={tableColumnClass(
                    columnVisibility.dueDate,
                    "2xl",
                    "text-zinc-400",
                  )}
                >
                  Vervaldatum
                </TableHead>
                <TableHead className="text-right text-zinc-400">Bedrag</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead
                  className={`${stickyActionsClass} bg-zinc-900/95 group-hover:bg-zinc-900/95`}
                >
                  <span className="sr-only">Acties</span>
                </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {visible.length > 0 ? (
                visible.map((f) => {
                  const meta = factuurStatusMeta(f.status);

                  return (
                    <TableRow
                      key={f.id}
                      className="group border-b border-white/[0.06] hover:bg-white/[0.03]"
                    >
                      <TableCell className="w-11">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(f.id)}
                          onChange={() => toggleSelect(f.id)}
                          aria-label={`Selecteer ${f.nummer ?? `factuur ${f.id}`}`}
                          className="h-4 w-4 rounded border-white/20 bg-zinc-950 accent-sky-500"
                        />
                      </TableCell>
                      <TableCell className="min-w-0">
                        {isDemo ? (
                          <span className="truncate font-mono text-zinc-200">
                            {f.nummer ?? `#${f.id}`}
                          </span>
                        ) : (
                          <Link
                            href={`/dashboard/facturen/${f.id}`}
                            className="truncate font-mono font-medium text-sky-400 hover:text-sky-300"
                          >
                            {f.nummer ?? `#${f.id}`}
                          </Link>
                        )}
                      </TableCell>
                      <TableCell className="min-w-0 truncate text-zinc-200">
                        {f.klant}
                      </TableCell>
                      <TableCell
                        className={tableColumnClass(
                          columnVisibility.date,
                          "xl",
                          "min-w-0 font-mono text-xs text-zinc-500",
                        )}
                      >
                        {formatDate(f.datum)}
                      </TableCell>
                      <TableCell
                        className={tableColumnClass(
                          columnVisibility.dueDate,
                          "2xl",
                          "min-w-0 font-mono text-xs text-zinc-500",
                        )}
                      >
                        {formatDate(f.vervaldatum)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-zinc-100">
                        {formatEuro(f.totaal_bedrag)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(f.status)}>
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className={stickyActionsClass}>
                        <FactuurRowMenu
                          id={f.id}
                          nummer={f.nummer ?? `#${f.id}`}
                          isPaid={Boolean(f.paid_at) || f.status === "betaald"}
                          canMarkPaid={
                            !Boolean(f.paid_at) &&
                            f.status !== "betaald" &&
                            f.document_type !== "proforma" &&
                            [
                              "verzonden",
                              "herinnerd",
                              "vervallen",
                              "deels_betaald",
                            ].includes(f.status ?? "")
                          }
                          isDemo={isDemo}
                          open={openMenuId === f.id}
                          onOpenChange={(open) =>
                            setOpenMenuId(open ? f.id : null)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={8} className="py-14 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <span className="grid h-12 w-12 place-items-center rounded-xl border border-white/[0.08] bg-zinc-900 text-sky-400">
                        <Receipt size={22} />
                      </span>
                      <p className="mt-3 text-sm font-medium text-zinc-100">
                        Geen zoekresultaten
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        Pas je zoekopdracht of statusfilter aan.
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={resetFilters}
                        className="mt-3"
                      >
                        <RotateCcw size={15} />
                        Filters wissen
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-white/[0.08] pt-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <label htmlFor="facturen-page-size">Rijen per pagina</label>
            <select
              id="facturen-page-size"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="h-8 rounded-lg border border-white/10 bg-zinc-950 px-2 text-xs text-zinc-300 outline-none focus:border-sky-500/50"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span aria-hidden>·</span>
            <span>
            Toont{" "}
            <span className="font-mono text-zinc-300">
              {filtered.length === 0 ? 0 : pageStart + 1}
            </span>{" "}
            tot{" "}
            <span className="font-mono text-zinc-300">{pageEnd}</span> van{" "}
            <span className="font-mono text-zinc-300">
              {filtered.length.toLocaleString("nl-BE")}
            </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
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

function FactuurRowMenu({
  id,
  nummer,
  isPaid,
  canMarkPaid = false,
  isDemo,
  open,
  onOpenChange,
}: {
  id: number;
  nummer: string;
  isPaid: boolean;
  canMarkPaid?: boolean;
  isDemo: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  const items: TableRowMenuItem[] = isDemo
    ? [
        {
          label: "Demo-factuur",
          onClick: () => undefined,
        },
      ]
    : [
        {
          label: "Open factuur",
          icon: <Eye size={14} />,
          onClick: () => {
            router.push(`/dashboard/facturen/${id}`);
          },
        },
        {
          label: "Download PDF",
          icon: <Download size={14} />,
          onClick: () => {
            router.push(`/dashboard/facturen/${id}/pdf`);
          },
        },
        ...(canMarkPaid && !isPaid
          ? [
              {
                label: "Markeer als betaald",
                icon: <CheckCircle2 size={14} />,
                onClick: () => {
                  void (async () => {
                    const confirmed = window.confirm(
                      `Betaling registreren voor ${nummer}?`,
                    );
                    if (!confirmed) return;
                    const result = await markFactuurAsPaid(id);
                    if ("error" in result && result.error) return;
                    router.refresh();
                  })();
                },
              } satisfies TableRowMenuItem,
            ]
          : []),
      ];

  return (
    <TableRowActionMenu
      label={`Acties voor ${nummer}`}
      open={open}
      onOpenChange={onOpenChange}
      items={items}
    />
  );
}
