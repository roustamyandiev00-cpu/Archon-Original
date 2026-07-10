"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  Building2,
  Calendar,
  Euro,
  GripVertical,
  Pencil,
  Phone,
  Plus,
  StickyNote,
  Trash2,
  User,
  X,
} from "lucide-react";
import {
  createDeal,
  deleteDeal,
  moveDeal,
  updateDeal,
} from "@/app/dashboard/leads/actions";
import { STADIA, STAGE_STYLES, type Stadium } from "./stages";

export type KlantOption = {
  id: number;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
};

export type DealCard = {
  id: number;
  titel: string;
  stadium: string;
  waarde: number | null;
  kans: number | null;
  deadline: string | null;
  customer_id?: number | null;
  customerName?: string | null;
  contactpersoon?: string | null;
  telefoon?: string | null;
  email?: string | null;
  notitie?: string | null;
};

const euro = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const shortDate = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
});

function normalizeStadium(value: string): Stadium {
  return (STADIA as readonly string[]).includes(value)
    ? (value as Stadium)
    : "Lead";
}

type Urgency = "overdue" | "soon" | "later";

function deadlineUrgency(deadline: string | null): Urgency | null {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(deadline);
  d.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diffDays < 0) return "overdue";
  if (diffDays <= 3) return "soon";
  return "later";
}

const URGENCY_STYLES: Record<Urgency, string> = {
  overdue: "bg-rose-500/10 text-rose-300 border-rose-500/30",
  soon: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  later: "bg-white/5 text-zinc-400 border-white/10",
};

const URGENCY_LABEL: Record<Urgency, string> = {
  overdue: "Te laat sinds",
  soon: "Opvolgen op",
  later: "Opvolgen op",
};

function klantLabel(klant: KlantOption) {
  return klant.company_name ? `${klant.name} (${klant.company_name})` : klant.name;
}

function klantNameById(klanten: KlantOption[], id: number | null | undefined) {
  if (id == null) return null;
  const klant = klanten.find((k) => k.id === id);
  return klant ? klantLabel(klant) : null;
}

export default function LeadsBoard({
  initialDeals,
  klanten,
}: {
  initialDeals: DealCard[];
  klanten: KlantOption[];
}) {
  const [deals, setDeals] = useState<DealCard[]>(initialDeals);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<Stadium | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const byStage = useMemo(() => {
    const map = new Map<Stadium, DealCard[]>();
    for (const s of STADIA) map.set(s, []);
    for (const d of deals) map.get(normalizeStadium(d.stadium))!.push(d);
    return map;
  }, [deals]);

  function handleDrop(stadium: Stadium) {
    setDragOver(null);
    const id = draggingId;
    setDraggingId(null);
    if (id == null) return;

    const current = deals.find((d) => d.id === id);
    if (!current || normalizeStadium(current.stadium) === stadium) return;

    const previous = current.stadium;
    setDeals((prev) =>
      prev.map((d) => (d.id === id ? { ...d, stadium } : d)),
    );
    setError(null);

    startTransition(async () => {
      const res = await moveDeal(id, stadium);
      if ("error" in res && res.error) {
        setError(res.error);
        setDeals((prev) =>
          prev.map((d) => (d.id === id ? { ...d, stadium: previous } : d)),
        );
      }
    });
  }

  function handleDelete(id: number) {
    const snapshot = deals;
    setDeals((prev) => prev.filter((d) => d.id !== id));
    startTransition(async () => {
      const res = await deleteDeal(id);
      if ("error" in res && res.error) {
        setError(res.error);
        setDeals(snapshot);
      }
    });
  }

  function handleCreate(
    stadium: Stadium,
    titel: string,
    waarde: number | null,
    customerId: number | null,
  ) {
    const klant = customerId
      ? klanten.find((k) => k.id === customerId)
      : undefined;
    const tempId = -Date.now();
    const optimistic: DealCard = {
      id: tempId,
      titel,
      stadium,
      waarde,
      kans: null,
      deadline: null,
      customer_id: customerId,
      customerName: klant ? klantLabel(klant) : null,
      contactpersoon: klant?.name ?? null,
      telefoon: klant?.phone ?? null,
      email: klant?.email ?? null,
    };
    setDeals((prev) => [...prev, optimistic]);
    setError(null);

    startTransition(async () => {
      const res = await createDeal({
        titel,
        stadium,
        waarde,
        kans: null,
        customer_id: customerId,
      });
      if ("error" in res && res.error) {
        setError(res.error);
        setDeals((prev) => prev.filter((d) => d.id !== tempId));
        return;
      }
      if ("id" in res) {
        setDeals((prev) =>
          prev.map((d) => (d.id === tempId ? { ...d, id: res.id ?? d.id } : d)),
        );
      }
    });
  }

  function handleUpdate(id: number, patch: Partial<DealCard>) {
    const snapshot = deals;
    const enriched: Partial<DealCard> = { ...patch };
    if ("customer_id" in patch) {
      enriched.customerName = klantNameById(klanten, patch.customer_id);
    }
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, ...enriched } : d)));
    setEditingId(null);
    setError(null);

    startTransition(async () => {
      const res = await updateDeal(id, {
        titel: enriched.titel,
        waarde: enriched.waarde,
        kans: enriched.kans,
        deadline: enriched.deadline,
        customer_id: enriched.customer_id,
        contactpersoon: enriched.contactpersoon,
        telefoon: enriched.telefoon,
        email: enriched.email,
        notitie: enriched.notitie,
      });
      if ("error" in res && res.error) {
        setError(res.error);
        setDeals(snapshot);
      }
    });
  }

  const totalValue = deals.reduce((sum, d) => sum + (d.waarde ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
            Leads / CRM
          </h1>
          <p className="text-sm text-zinc-400">
            Sleep kaarten tussen de stadia om je verkooppijplijn bij te werken.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-300">
          Pijplijn:{" "}
          <span className="font-semibold text-zinc-100">
            {euro.format(totalValue)}
          </span>{" "}
          · {deals.length} deals
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STADIA.map((stadium) => {
          const cards = byStage.get(stadium) ?? [];
          const style = STAGE_STYLES[stadium];
          const columnValue = cards.reduce(
            (sum, d) => sum + (d.waarde ?? 0),
            0,
          );
          return (
            <div
              key={stadium}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOver !== stadium) setDragOver(stadium);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOver((cur) => (cur === stadium ? null : cur));
                }
              }}
              onDrop={() => handleDrop(stadium)}
              className={`flex w-80 shrink-0 flex-col rounded-2xl border bg-zinc-900/40 transition-colors ${
                dragOver === stadium
                  ? `border-transparent ring-2 ${style.ring} bg-zinc-900/70`
                  : "border-white/10"
              }`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                  <span className="text-sm font-medium text-zinc-200">
                    {stadium}
                  </span>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-zinc-400">
                    {cards.length}
                  </span>
                </div>
                {columnValue > 0 && (
                  <span className="text-xs text-zinc-500">
                    {euro.format(columnValue)}
                  </span>
                )}
              </div>

              <div className="flex min-h-24 flex-1 flex-col gap-2 p-3">
                {cards.map((deal) =>
                  editingId === deal.id ? (
                    <EditCard
                      key={deal.id}
                      deal={deal}
                      klanten={klanten}
                      onSave={(patch) => handleUpdate(deal.id, patch)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <DealArticle
                      key={deal.id}
                      deal={deal}
                      style={style}
                      dragging={draggingId === deal.id}
                      onDragStart={() => setDraggingId(deal.id)}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOver(null);
                      }}
                      onEdit={() => setEditingId(deal.id)}
                      onDelete={() => handleDelete(deal.id)}
                    />
                  ),
                )}

                <AddCard
                  klanten={klanten}
                  onAdd={(titel, waarde, customerId) =>
                    handleCreate(stadium, titel, waarde, customerId)
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DealArticle({
  deal,
  style,
  dragging,
  onDragStart,
  onDragEnd,
  onEdit,
  onDelete,
}: {
  deal: DealCard;
  style: { text: string };
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const urgency = deadlineUrgency(deal.deadline);

  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group cursor-grab rounded-xl border border-white/10 bg-zinc-800/60 p-3 shadow-sm transition-all hover:border-white/20 active:cursor-grabbing ${
        dragging ? "opacity-40" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <GripVertical size={14} className="mt-0.5 shrink-0 text-zinc-600" />
        <p className="flex-1 text-sm font-medium leading-snug text-zinc-100">
          {deal.titel}
        </p>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={onEdit}
            aria-label="Deal bewerken"
            className="rounded-md p-1 text-zinc-600 hover:bg-white/5 hover:text-sky-300"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Verwijder deal"
            className="rounded-md p-1 text-zinc-600 hover:bg-white/5 hover:text-rose-300"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {(deal.customerName || deal.contactpersoon || deal.telefoon) && (
        <div className="mt-2 flex flex-col gap-1 pl-6">
          {deal.customerName && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-sky-300">
              <Building2 size={12} className="shrink-0 text-sky-400/80" />
              {deal.customerName}
            </span>
          )}
          {deal.contactpersoon && !deal.customerName && (
            <span className="flex items-center gap-1.5 text-xs text-zinc-300">
              <User size={12} className="shrink-0 text-zinc-500" />
              {deal.contactpersoon}
            </span>
          )}
          {deal.contactpersoon && deal.customerName && (
            <span className="flex items-center gap-1.5 text-xs text-zinc-400">
              <User size={12} className="shrink-0 text-zinc-500" />
              {deal.contactpersoon}
            </span>
          )}
          {deal.telefoon && (
            <a
              href={`tel:${deal.telefoon.replace(/\s+/g, "")}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-sky-300"
            >
              <Phone size={12} className="shrink-0 text-zinc-500" />
              {deal.telefoon}
            </a>
          )}
        </div>
      )}

      {(deal.waarde != null || deal.kans != null) && (
        <div className="mt-2 flex items-center gap-2 pl-6">
          {deal.waarde != null && (
            <span
              className={`inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium ${style.text}`}
            >
              <Euro size={11} />
              {euro.format(deal.waarde).replace("€", "").trim()}
            </span>
          )}
          {deal.kans != null && (
            <span className="text-xs text-zinc-500">{deal.kans}% kans</span>
          )}
        </div>
      )}

      {urgency && (
        <div className="mt-2 pl-6">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${URGENCY_STYLES[urgency]}`}
          >
            <Calendar size={11} />
            {URGENCY_LABEL[urgency]} {shortDate.format(new Date(deal.deadline!))}
          </span>
        </div>
      )}

      {deal.notitie && (
        <div className="mt-2 flex items-start gap-1.5 pl-6 text-xs text-zinc-500">
          <StickyNote size={12} className="mt-0.5 shrink-0" />
          <span className="line-clamp-2 italic">{deal.notitie}</span>
        </div>
      )}
    </article>
  );
}

function EditCard({
  deal,
  klanten,
  onSave,
  onCancel,
}: {
  deal: DealCard;
  klanten: KlantOption[];
  onSave: (patch: Partial<DealCard>) => void;
  onCancel: () => void;
}) {
  const [titel, setTitel] = useState(deal.titel);
  const [customerId, setCustomerId] = useState(
    deal.customer_id != null ? String(deal.customer_id) : "",
  );
  const [contactpersoon, setContactpersoon] = useState(deal.contactpersoon ?? "");
  const [telefoon, setTelefoon] = useState(deal.telefoon ?? "");
  const [email, setEmail] = useState(deal.email ?? "");
  const [waarde, setWaarde] = useState(deal.waarde != null ? String(deal.waarde) : "");
  const [kans, setKans] = useState(deal.kans != null ? String(deal.kans) : "");
  const [deadline, setDeadline] = useState(deal.deadline ?? "");
  const [notitie, setNotitie] = useState(deal.notitie ?? "");

  function applyKlant(id: string) {
    setCustomerId(id);
    if (!id) return;
    const klant = klanten.find((k) => k.id === Number(id));
    if (!klant) return;
    setContactpersoon(klant.name);
    setTelefoon(klant.phone ?? "");
    setEmail(klant.email ?? "");
  }

  function submit() {
    if (!titel.trim()) return;
    onSave({
      titel: titel.trim(),
      customer_id: customerId ? Number(customerId) : null,
      contactpersoon: contactpersoon.trim() || null,
      telefoon: telefoon.trim() || null,
      email: email.trim() || null,
      waarde: waarde.trim() ? Number(waarde.replace(",", ".")) : null,
      kans: kans.trim() ? Number(kans) : null,
      deadline: deadline.trim() || null,
      notitie: notitie.trim() || null,
    });
  }

  const inputClass =
    "w-full rounded-lg bg-zinc-900/60 px-2 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-sky-500/50";

  return (
    <div className="space-y-2 rounded-xl border border-sky-500/30 bg-zinc-800/80 p-3">
      <input
        value={titel}
        onChange={(e) => setTitel(e.target.value)}
        placeholder="Titel"
        className={`${inputClass} font-medium`}
      />
      {klanten.length > 0 && (
        <label className="block">
          <span className="mb-1 block text-[11px] text-zinc-500">Klant</span>
          <select
            value={customerId}
            onChange={(e) => applyKlant(e.target.value)}
            className={inputClass}
          >
            <option value="">— Geen klant gekoppeld —</option>
            {klanten.map((klant) => (
              <option key={klant.id} value={klant.id}>
                {klantLabel(klant)}
              </option>
            ))}
          </select>
        </label>
      )}
      <input
        value={contactpersoon}
        onChange={(e) => setContactpersoon(e.target.value)}
        placeholder="Contactpersoon"
        className={inputClass}
      />
      <div className="flex gap-2">
        <input
          value={telefoon}
          onChange={(e) => setTelefoon(e.target.value)}
          placeholder="Telefoon"
          className={inputClass}
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          className={inputClass}
        />
      </div>
      <div className="flex gap-2">
        <input
          value={waarde}
          onChange={(e) => setWaarde(e.target.value)}
          placeholder="Waarde (€)"
          inputMode="decimal"
          className={inputClass}
        />
        <input
          value={kans}
          onChange={(e) => setKans(e.target.value)}
          placeholder="Kans (%)"
          inputMode="numeric"
          className={inputClass}
        />
      </div>
      <label className="block">
        <span className="mb-1 block text-[11px] text-zinc-500">
          Volgende opvolging
        </span>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className={inputClass}
        />
      </label>
      <textarea
        value={notitie}
        onChange={(e) => setNotitie(e.target.value)}
        placeholder="Notitie voor de opvolging..."
        rows={2}
        className={`${inputClass} resize-none`}
      />
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-1 text-xs text-zinc-400 transition hover:text-zinc-200"
        >
          Annuleren
        </button>
        <button
          type="button"
          onClick={submit}
          className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-medium text-white transition hover:bg-sky-400"
        >
          Opslaan
        </button>
      </div>
    </div>
  );
}

function AddCard({
  klanten,
  onAdd,
}: {
  klanten: KlantOption[];
  onAdd: (titel: string, waarde: number | null, customerId: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [titel, setTitel] = useState("");
  const [waarde, setWaarde] = useState("");
  const [customerId, setCustomerId] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function submit() {
    const t = titel.trim();
    if (!t) {
      setOpen(false);
      return;
    }
    const parsed = waarde.trim() ? Number(waarde.replace(/[^\d.,]/g, "").replace(",", ".")) : null;
    onAdd(
      t,
      parsed != null && !Number.isNaN(parsed) ? parsed : null,
      customerId ? Number(customerId) : null,
    );
    setTitel("");
    setWaarde("");
    setCustomerId("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="flex items-center gap-1.5 rounded-xl border border-dashed border-white/10 px-3 py-2 text-sm text-zinc-500 transition hover:border-white/20 hover:text-zinc-300"
      >
        <Plus size={14} /> Deal toevoegen
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-white/15 bg-zinc-800/60 p-2">
      <input
        ref={inputRef}
        value={titel}
        onChange={(e) => setTitel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Titel van de deal"
        className="w-full rounded-lg bg-transparent px-1.5 py-1 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
      />
      {klanten.length > 0 && (
        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="mt-1 w-full rounded-lg bg-zinc-900/60 px-2 py-1 text-xs text-zinc-100 focus:outline-none"
        >
          <option value="">— Optioneel: koppel klant —</option>
          {klanten.map((klant) => (
            <option key={klant.id} value={klant.id}>
              {klantLabel(klant)}
            </option>
          ))}
        </select>
      )}
      <div className="mt-1 flex items-center gap-2">
        <input
          value={waarde}
          onChange={(e) => setWaarde(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Waarde (€)"
          inputMode="decimal"
          className="w-24 rounded-lg bg-zinc-900/60 px-2 py-1 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={submit}
          className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-medium text-white transition hover:bg-sky-400"
        >
          Toevoegen
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Annuleren"
          className="rounded-lg p-1 text-zinc-500 transition hover:text-zinc-300"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
