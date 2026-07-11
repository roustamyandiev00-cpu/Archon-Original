"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  MoreHorizontal,
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

const pageSize = 10;

type PeppolFilter = "all" | "ready" | "incomplete";
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

function isPeppolReady(klant: KlantRecord) {
  return Boolean(
    klant.peppol_participant_id || klant.btw || klant.ondernemingsnummer,
  );
}

export default function ContactenDataTable({
  klanten,
  onEdit,
  onDelete,
  showFilters = true,
}: {
  klanten: KlantRecord[];
  onEdit: (klant: KlantRecord) => void;
  onDelete: (id: number, naam: string) => void;
  showFilters?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [peppolFilter, setPeppolFilter] = useState<PeppolFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

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

      const peppolReady = isPeppolReady(klant);
      const matchesPeppol =
        peppolFilter === "all" ||
        (peppolFilter === "ready" && peppolReady) ||
        (peppolFilter === "incomplete" && !peppolReady);

      const isBusiness = Boolean(klant.company_name?.trim());
      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "business" && isBusiness) ||
        (typeFilter === "individual" && !isBusiness);

      return matchesQuery && matchesPeppol && matchesType;
    });
  }, [klanten, peppolFilter, query, typeFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, filtered.length);
  const visible = filtered.slice(pageStart, pageEnd);

  const allVisibleSelected =
    visible.length > 0 && visible.every((k) => selectedIds.has(k.id));

  function resetFilters() {
    setQuery("");
    setPeppolFilter("all");
    setTypeFilter("all");
    setPage(1);
  }

  function toggleSelectAll() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        visible.forEach((k) => next.delete(k.id));
      } else {
        visible.forEach((k) => next.add(k.id));
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
    <div className="space-y-4">
      {showFilters && (
        <div className="grid gap-3 lg:grid-cols-[minmax(18rem,1fr)_12rem_12rem_auto]">
          <label className="relative block">
            <span className="sr-only">Zoek contacten</span>
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
              placeholder="Zoek op naam, e-mail, BTW, Peppol…"
              className="pl-9"
            />
          </label>

          <label>
            <span className="sr-only">Filter op Peppol</span>
            <Select
              value={peppolFilter}
              onChange={(event) => {
                setPeppolFilter(event.target.value as PeppolFilter);
                setPage(1);
              }}
            >
              <option value="all">Alle Peppol-status</option>
              <option value="ready">Peppol klaar</option>
              <option value="incomplete">Peppol onvolledig</option>
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
            className="justify-center"
          >
            <RotateCcw size={15} />
            Reset
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <SlidersHorizontal size={14} />
        <span>
          {filtered.length.toLocaleString("nl-BE")} van{" "}
          {klanten.length.toLocaleString("nl-BE")} contacten
        </span>
        {selectedIds.size > 0 && (
          <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-300">
            {selectedIds.size} selected
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    aria-label="Selecteer alle zichtbare contacten"
                    className="h-4 w-4 rounded border-white/20 bg-zinc-950 accent-sky-500"
                  />
                </TableHead>
                <TableHead className="min-w-[240px]">Contact</TableHead>
                <TableHead>Bedrijf</TableHead>
                <TableHead>Telefoon</TableHead>
                <TableHead>Locatie</TableHead>
                <TableHead>Fiscaal</TableHead>
                <TableHead>Peppol</TableHead>
                <TableHead className="text-right md:sticky md:right-0 md:z-10 md:bg-zinc-950 md:shadow-[-16px_0_24px_rgba(9,9,11,0.72)]">
                  <span className="sr-only">Acties</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length > 0 ? (
                visible.map((klant, index) => {
                  const peppolReady = isPeppolReady(klant);
                  const adres = [klant.postcode, klant.city]
                    .filter(Boolean)
                    .join(" ");
                  const tone =
                    avatarTones[index % avatarTones.length] ?? avatarTones[0];

                  return (
                    <TableRow key={klant.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(klant.id)}
                          onChange={() => toggleSelect(klant.id)}
                          aria-label={`Selecteer ${klant.name}`}
                          className="h-4 w-4 rounded border-white/20 bg-zinc-950 accent-sky-500"
                        />
                      </TableCell>
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
                      <TableCell>
                        {klant.company_name ? (
                          <div className="flex items-center gap-1.5 text-zinc-300">
                            <Building2 size={13} className="shrink-0 text-zinc-500" />
                            <span className="truncate">{klant.company_name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-600">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {klant.phone ? (
                          <span className="inline-flex items-center gap-1 font-mono text-xs text-zinc-400">
                            <Phone size={11} />
                            {klant.phone}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-600">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {adres ? (
                          <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                            <MapPin size={11} className="shrink-0" />
                            <span className="truncate">{adres}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-600">—</span>
                        )}
                      </TableCell>
                      <TableCell>
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
                        <Badge variant={peppolReady ? "success" : "warning"}>
                          <Radio size={10} />
                          {peppolReady ? "Klaar" : "Onvolledig"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right md:sticky md:right-0 md:bg-zinc-950 md:shadow-[-16px_0_24px_rgba(9,9,11,0.72)]">
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
                  <TableCell colSpan={8} className="py-16 text-center">
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

        <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
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
  function closeMenu() {
    onOpenChange(false);
  }

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
        aria-label={`Acties voor ${klant.name}`}
      >
        <MoreHorizontal size={16} />
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-xl border border-white/10 bg-zinc-950 py-1 text-left shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <MenuItem
            icon={<Pencil size={14} />}
            onClick={() => {
              closeMenu();
              onEdit();
            }}
          >
            Bewerken
          </MenuItem>
          <div className="my-1 h-px bg-white/10" />
          <MenuItem
            icon={<Trash2 size={14} />}
            onClick={() => {
              closeMenu();
              onDelete();
            }}
            destructive
          >
            Deactiveren
          </MenuItem>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  children,
  icon,
  onClick,
  destructive = false,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-white/5 ${
        destructive
          ? "text-rose-300 hover:text-rose-200"
          : "text-zinc-300 hover:text-zinc-100"
      }`}
    >
      <span className={destructive ? "text-rose-400" : "text-zinc-500"}>
        {icon}
      </span>
      {children}
    </button>
  );
}
