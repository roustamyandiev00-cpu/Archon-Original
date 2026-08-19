"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Radio,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  User,
} from "lucide-react";
import type { KlantRecord } from "@/components/dashboard/contacten/KlantForm";
import TableRowActionMenu from "@/components/dashboard/TableRowActionMenu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  DashboardMobileCard,
  DashboardMobileEmpty,
} from "@/components/dashboard/DashboardMobileCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const pageSize = 5;

export type ContactColumnKey = "phone" | "location" | "fiscal";

export type ContactColumnVisibility = Record<ContactColumnKey, boolean>;

export const CONTACT_COLUMN_OPTIONS = [
  { id: "phone", label: "Telefoon" },
  { id: "location", label: "Locatie" },
  { id: "fiscal", label: "Fiscaal" },
] as const;

export const defaultContactColumnVisibility: ContactColumnVisibility = {
  phone: true,
  location: false,
  fiscal: false,
};

const stickyActionsClass = "w-16 text-right dashboard-table-sticky-actions";

function contactColumnClass(
  visible: boolean,
  breakpoint: "lg" | "xl" | "2xl",
) {
  if (!visible) return "hidden";

  return {
    lg: "hidden min-w-0 lg:table-cell",
    xl: "hidden min-w-0 xl:table-cell",
    "2xl": "hidden min-w-0 2xl:table-cell",
  }[breakpoint];
}

type EInvoiceFilter = "all" | "with-id" | "missing-id";
type TypeFilter = "all" | "business" | "individual";

const avatarTones = [
  "border-sky-400/30 bg-sky-500/10 text-sky-300",
  "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  "border-violet-400/30 bg-violet-500/10 text-violet-300",
  "border-amber-400/30 bg-amber-500/10 text-amber-300",
  "border-rose-400/30 bg-rose-500/10 text-rose-300",
  "border-cyan-400/30 bg-cyan-500/10 text-cyan-300",
] as const;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function hasEInvoiceId(klant: KlantRecord) {
  return Boolean(klant.peppol_participant_id?.trim());
}

export default function ContactenDataTable({
  klanten,
  onEdit,
  onDelete,
  showFilters = true,
  columnVisibility = defaultContactColumnVisibility,
}: {
  klanten: KlantRecord[];
  onEdit: (klant: KlantRecord) => void;
  onDelete: (id: number, naam: string) => void;
  showFilters?: boolean;
  columnVisibility?: ContactColumnVisibility;
}) {
  const [query, setQuery] = useState("");
  const [eInvoiceFilter, setEInvoiceFilter] = useState<EInvoiceFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return klanten.filter((klant) => {
      const hay = [
        klant.name,
        klant.company_name,
        klant.email,
        klant.phone,
        klant.city,
        klant.btw,
        klant.ondernemingsnummer,
        klant.peppol_participant_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        normalizedQuery.length === 0 || hay.includes(normalizedQuery);

      const hasInvoiceId = hasEInvoiceId(klant);
      const matchesEInvoice =
        eInvoiceFilter === "all" ||
        (eInvoiceFilter === "with-id" && hasInvoiceId) ||
        (eInvoiceFilter === "missing-id" && !hasInvoiceId);

      const isBusiness = Boolean(klant.company_name?.trim());
      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "business" && isBusiness) ||
        (typeFilter === "individual" && !isBusiness);

      return matchesQuery && matchesEInvoice && matchesType;
    });
  }, [eInvoiceFilter, klanten, query, typeFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, filtered.length);
  const visible = filtered.slice(pageStart, pageEnd);

  const hasActiveFilters =
    query.trim().length > 0 ||
    eInvoiceFilter !== "all" ||
    typeFilter !== "all";

  function resetFilters() {
    setQuery("");
    setEInvoiceFilter("all");
    setTypeFilter("all");
    setPage(1);
  }

  return (
    <div className="dashboard-table-scroll flex min-h-0 flex-1 flex-col gap-2 lg:gap-1.5">
      {showFilters && (
        <div className="grid shrink-0 gap-2 lg:grid-cols-[minmax(12rem,1fr)_9rem_9rem_auto]">
          <label className="relative block">
            <span className="sr-only">Zoek contacten</span>
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <Input
              name="contact-search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Zoek op naam, e-mail, BTW of ID…"
              className="pl-9"
            />
          </label>

          <label>
            <span className="sr-only">Filter op e-facturatie</span>
            <Select
              value={eInvoiceFilter}
              onChange={(event) => {
                setEInvoiceFilter(event.target.value as EInvoiceFilter);
                setPage(1);
              }}
            >
              <option value="all">Alle e-facturatiestatussen</option>
              <option value="with-id">ID aanwezig</option>
              <option value="missing-id">ID aanvullen</option>
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
              <option value="business">Bedrijven</option>
              <option value="individual">Particulieren</option>
            </Select>
          </label>

          <Button
            type="button"
            variant="ghost"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
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
          {klanten.length.toLocaleString("nl-BE")} contacten
        </span>
      </div>

      <div className="dashboard-table-scroll min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10">
        <div className="flex h-full flex-col gap-2 overflow-y-auto p-2 lg:hidden">
          {visible.length > 0 ? (
            visible.map((klant, index) => {
              const hasInvoiceId = hasEInvoiceId(klant);
              const adres = [klant.postcode, klant.city].filter(Boolean).join(" ");
              const tone =
                avatarTones[index % avatarTones.length] ?? avatarTones[0];

              return (
                <DashboardMobileCard key={klant.id}>
                  <div className="flex items-start gap-3">
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border font-mono text-xs font-semibold ${tone}`}
                      aria-hidden
                    >
                      {initials(klant.name) || "?"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-zinc-100">{klant.name}</p>
                          {klant.company_name ? (
                            <p className="mt-0.5 truncate text-xs text-zinc-400">
                              {klant.company_name}
                            </p>
                          ) : null}
                        </div>
                        <Badge variant={hasInvoiceId ? "success" : "warning"}>
                          <Radio size={10} />
                          {hasInvoiceId ? "ID aanwezig" : "ID aanvullen"}
                        </Badge>
                      </div>
                      {klant.email ? (
                        <p className="mt-1 flex items-center gap-1 truncate text-xs text-zinc-500">
                          <Mail size={11} className="shrink-0" />
                          {klant.email}
                        </p>
                      ) : null}
                      {klant.phone ? (
                        <p className="mt-1 flex items-center gap-1 truncate font-mono text-xs text-zinc-500">
                          <Phone size={11} className="shrink-0" />
                          {klant.phone}
                        </p>
                      ) : null}
                      {adres ? (
                        <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                          <MapPin size={11} className="shrink-0" />
                          <span className="truncate">{adres}</span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end border-t border-white/10 pt-2">
                    <ContactActionMenu
                      klant={klant}
                      open={openMenuId === klant.id}
                      onOpenChange={(open) =>
                        setOpenMenuId(open ? klant.id : null)
                      }
                      onEdit={() => onEdit(klant)}
                      onDelete={() => onDelete(klant.id, klant.name)}
                    />
                  </div>
                </DashboardMobileCard>
              );
            })
          ) : (
            <DashboardMobileEmpty
              icon={<User size={22} />}
              title={klanten.length === 0 ? "Nog geen contacten" : "Geen resultaten"}
              description={
                klanten.length === 0
                  ? "Voeg je eerste klant toe om offertes en facturen te versturen."
                  : "Pas je zoekopdracht of filters aan."
              }
            />
          )}
        </div>

        <div className="hidden h-full min-h-0 lg:block">
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[30%] min-w-[240px]">Contact</TableHead>
                <TableHead className="w-[24%] min-w-0">Bedrijf</TableHead>
                <TableHead className={contactColumnClass(columnVisibility.phone, "lg")}>
                  Telefoon
                </TableHead>
                <TableHead className={contactColumnClass(columnVisibility.location, "xl")}>
                  Locatie
                </TableHead>
                <TableHead className={contactColumnClass(columnVisibility.fiscal, "2xl")}>
                  Fiscaal
                </TableHead>
                <TableHead>E-facturatie</TableHead>
                <TableHead className={stickyActionsClass}>
                  <span className="sr-only">Acties</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length > 0 ? (
                visible.map((klant, index) => {
                  const hasInvoiceId = hasEInvoiceId(klant);
                  const adres = [klant.postcode, klant.city]
                    .filter(Boolean)
                    .join(" ");
                  const tone =
                    avatarTones[index % avatarTones.length] ?? avatarTones[0];

                  return (
                    <TableRow key={klant.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span
                            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border font-mono text-xs font-semibold ${tone}`}
                            aria-hidden
                          >
                            {initials(klant.name) || "?"}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-zinc-100">
                              {klant.name}
                            </p>
                            {klant.email ? (
                              <p className="flex items-center gap-1 truncate text-xs text-zinc-500">
                                <Mail size={11} className="shrink-0" />
                                {klant.email}
                              </p>
                            ) : (
                              <p className="text-xs text-zinc-600">Geen e-mail</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-0">
                        {klant.company_name ? (
                          <div className="flex items-center gap-1.5 text-zinc-300">
                            <Building2 size={13} className="shrink-0 text-zinc-500" />
                            <span className="truncate">{klant.company_name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-600">—</span>
                        )}
                      </TableCell>
                      <TableCell className={contactColumnClass(columnVisibility.phone, "lg")}>
                        {klant.phone ? (
                          <span className="inline-flex items-center gap-1 truncate font-mono text-xs text-zinc-400">
                            <Phone size={11} />
                            {klant.phone}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-600">—</span>
                        )}
                      </TableCell>
                      <TableCell className={contactColumnClass(columnVisibility.location, "xl")}>
                        {adres ? (
                          <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                            <MapPin size={11} className="shrink-0" />
                            <span className="truncate">{adres}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-600">—</span>
                        )}
                      </TableCell>
                      <TableCell className={contactColumnClass(columnVisibility.fiscal, "2xl")}>
                        <div className="space-y-0.5 font-mono text-[11px] text-zinc-500">
                          {klant.btw && <p>BTW: {klant.btw}</p>}
                          {klant.ondernemingsnummer && (
                            <p>KBO: {klant.ondernemingsnummer}</p>
                          )}
                          {!klant.btw && !klant.ondernemingsnummer && (
                            <span className="text-xs text-zinc-600">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={hasInvoiceId ? "success" : "warning"}>
                          <Radio size={10} />
                          {hasInvoiceId ? "ID aanwezig" : "ID aanvullen"}
                        </Badge>
                      </TableCell>
                      <TableCell className={stickyActionsClass}>
                        <ContactActionMenu
                          klant={klant}
                          open={openMenuId === klant.id}
                          onOpenChange={(open) =>
                            setOpenMenuId(open ? klant.id : null)
                          }
                          onEdit={() => onEdit(klant)}
                          onDelete={() => onDelete(klant.id, klant.name)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/5 text-zinc-500">
                        <User size={22} />
                      </span>
                      <p className="mt-3 text-sm font-medium text-zinc-200">
                        {klanten.length === 0
                          ? "Nog geen contacten"
                          : "Geen resultaten"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {klanten.length === 0
                          ? "Voeg je eerste klant toe om offertes en facturen te versturen."
                          : "Pas je zoekopdracht of filters aan."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {pageCount > 1 && (
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
      )}
    </div>
  );
}

function ContactActionMenu({
  klant,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: {
  klant: KlantRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <TableRowActionMenu
      label={`Acties voor ${klant.name}`}
      open={open}
      onOpenChange={onOpenChange}
      items={[
        {
          label: "Bewerken",
          icon: <Pencil size={14} />,
          onClick: onEdit,
        },
        {
          label: "Deactiveren",
          icon: <Trash2 size={14} />,
          onClick: onDelete,
          destructive: true,
        },
      ]}
    />
  );
}
