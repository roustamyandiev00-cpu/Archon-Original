"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Receipt,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import DocumentContactActions from "@/components/dashboard/DocumentContactActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const pageSize = 10;

type StatusFilter = "all" | "concept" | "verzonden" | "betaald" | "vervallen";
type TypeFilter = "all" | "factuur" | "proforma";

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
}: {
  facturen: FactuurListItem[];
  isDemo?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

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

      const matchesType =
        typeFilter === "all" || f.document_type === typeFilter;

      return matchesQuery && matchesStatus && matchesType;
    });
  }, [facturen, query, statusFilter, typeFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, filtered.length);
  const visible = filtered.slice(pageStart, pageEnd);

  function resetFilters() {
    setQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
    setPage(1);
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>Alle facturen</CardTitle>
          <CardDescription>
            Zoek, filter en open facturen en proforma&apos;s.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <SlidersHorizontal size={14} />
          <span>
            {filtered.length.toLocaleString("nl-BE")} van{" "}
            {facturen.length.toLocaleString("nl-BE")} documenten
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(18rem,1fr)_12rem_12rem_auto]">
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

          <label>
            <span className="sr-only">Filter op type</span>
            <Select
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value as TypeFilter);
                setPage(1);
              }}
            >
              <option value="all">Alle types</option>
              <option value="factuur">Facturen</option>
              <option value="proforma">Proforma&apos;s</option>
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

        <div className="overflow-hidden rounded-2xl border border-white/10">
          <Table className="min-w-[920px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nummer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Klant</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Vervaldatum</TableHead>
                <TableHead className="text-right">Bedrag</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Versturen</TableHead>
                <TableHead className="text-right md:sticky md:right-0 md:z-10 md:bg-zinc-950 md:shadow-[-16px_0_24px_rgba(9,9,11,0.72)]">
                  <span className="sr-only">Acties</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length > 0 ? (
                visible.map((f) => {
                  const meta = factuurStatusMeta(f.status);
                  const typeMeta = documentTypeMeta(f.document_type);

                  return (
                    <TableRow key={f.id}>
                      <TableCell>
                        {isDemo ? (
                          <span className="font-mono text-zinc-300">
                            {f.nummer ?? `#${f.id}`}
                          </span>
                        ) : (
                          <Link
                            href={`/dashboard/facturen/${f.id}`}
                            className="font-mono text-sky-400 hover:text-sky-300"
                          >
                            {f.nummer ?? `#${f.id}`}
                          </Link>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{typeMeta.label}</Badge>
                      </TableCell>
                      <TableCell className="text-zinc-200">{f.klant}</TableCell>
                      <TableCell className="font-mono text-xs text-zinc-500">
                        {formatDate(f.datum)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-500">
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
                      <TableCell className="text-right">
                        <DocumentContactActions
                          soort={
                            f.document_type === "proforma"
                              ? "proforma"
                              : "factuur"
                          }
                          nummer={f.nummer ?? `#${f.id}`}
                          klant={f.klant ?? "klant"}
                          bedrag={f.totaal_bedrag}
                          email={f.email}
                          phone={f.phone}
                          detailPath={
                            isDemo ? undefined : `/dashboard/facturen/${f.id}`
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right md:sticky md:right-0 md:bg-zinc-950 md:shadow-[-16px_0_24px_rgba(9,9,11,0.72)]">
                        {!isDemo && (
                          <FactuurRowMenu
                            id={f.id}
                            nummer={f.nummer ?? `#${f.id}`}
                            open={openMenuId === f.id}
                            onOpenChange={(open) =>
                              setOpenMenuId(open ? f.id : null)
                            }
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="py-16 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/5 text-zinc-500">
                        <Receipt size={22} />
                      </span>
                      <p className="mt-3 text-sm font-medium text-zinc-200">
                        Geen facturen gevonden
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Pas je zoekopdracht of filters aan.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-500">
            Rijen per pagina{" "}
            <span className="font-mono text-zinc-300">{pageSize}</span>
            {" · "}
            Toont{" "}
            <span className="font-mono text-zinc-300">
              {filtered.length === 0 ? 0 : pageStart + 1}
            </span>
            {" – "}
            <span className="font-mono text-zinc-300">{pageEnd}</span> van{" "}
            <span className="font-mono text-zinc-300">
              {filtered.length.toLocaleString("nl-BE")}
            </span>
          </p>

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
      </CardContent>
    </Card>
  );
}

function FactuurRowMenu({
  id,
  nummer,
  open,
  onOpenChange,
}: {
  id: number;
  nummer: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
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
        aria-label={`Acties voor ${nummer}`}
      >
        <MoreHorizontal size={16} />
      </Button>

      {open && (
        <div className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-xl border border-white/10 bg-zinc-950 py-1 shadow-2xl">
          <Link
            href={`/dashboard/facturen/${id}`}
            className="block px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-zinc-100"
            onClick={() => onOpenChange(false)}
          >
            Open factuur
          </Link>
          <Link
            href={`/dashboard/facturen/${id}/pdf`}
            className="block px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-zinc-100"
            onClick={() => onOpenChange(false)}
          >
            Download PDF
          </Link>
        </div>
      )}
    </div>
  );
}
