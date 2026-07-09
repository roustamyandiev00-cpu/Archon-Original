"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Heart,
  Lightbulb,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
} from "lucide-react";

type MessageKind = "bericht" | "idee" | "tip";

type WallPost = {
  id: string;
  kind: MessageKind;
  name: string;
  company?: string;
  text: string;
  createdAt: string;
};

const KINDS: {
  id: MessageKind;
  label: string;
  hint: string;
  icon: typeof MessageCircle;
  badge: string;
  ring: string;
  bg: string;
  text: string;
}[] = [
  {
    id: "bericht",
    label: "Bericht",
    hint: "Goed bezig, compliment of gewoon iets delen",
    icon: Heart,
    badge: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    ring: "ring-sky-500/40",
    bg: "bg-sky-500/15",
    text: "text-sky-300",
  },
  {
    id: "idee",
    label: "Idee",
    hint: "Wat zou ArchonPro beter of slimmer maken?",
    icon: Lightbulb,
    badge: "border-violet-500/30 bg-violet-500/10 text-violet-300",
    ring: "ring-violet-500/40",
    bg: "bg-violet-500/15",
    text: "text-violet-300",
  },
  {
    id: "tip",
    label: "Tip",
    hint: "Deel een werkwijze, shortcut of lifehack",
    icon: Sparkles,
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    ring: "ring-emerald-500/40",
    bg: "bg-emerald-500/15",
    text: "text-emerald-300",
  },
];

function kindMeta(kind: MessageKind) {
  return KINDS.find((k) => k.id === kind) ?? KINDS[0];
}

function formatWhen(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return "Zojuist";
  const months = [
    "jan",
    "feb",
    "mrt",
    "apr",
    "mei",
    "jun",
    "jul",
    "aug",
    "sep",
    "okt",
    "nov",
    "dec",
  ];
  return `${day} ${months[month - 1]}`;
}

export default function CommunityWall({ showIntro = true }: { showIntro?: boolean }) {
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [kind, setKind] = useState<MessageKind>("bericht");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const activeKind = useMemo(() => kindMeta(kind), [kind]);

  const placeholders: Record<MessageKind, string> = {
    bericht: "Schrijf wat je goed vindt, wat je mist, of gewoon wat je wilt delen…",
    idee: "Beschrijf je idee — hoe zou het je werk makkelijker maken?",
    tip: "Deel een tip die andere vakmensen direct kunnen gebruiken…",
  };

  const loadPosts = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/community-wall");
      if (!res.ok) throw new Error("Laden mislukt");
      const data = (await res.json()) as { posts: WallPost[] };
      setPosts(data.posts ?? []);
    } catch {
      setLoadError("Berichten laden mislukt. Probeer later opnieuw.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!text.trim() || submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/community-wall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          name: name.trim() || undefined,
          company: company.trim() || undefined,
          text: text.trim(),
        }),
      });

      const data = (await res.json()) as { post?: WallPost; error?: string };
      if (!res.ok || !data.post) {
        throw new Error(data.error ?? "Plaatsen mislukt");
      }

      setPosts((current) => [data.post!, ...current.filter((p) => p.id !== data.post!.id)]);
      setText("");
      setSent(true);
      window.setTimeout(() => setSent(false), 3200);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Plaatsen mislukt. Probeer opnieuw.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="gemeenschap"
      className="section-tint relative scroll-mt-28 overflow-hidden py-20 sm:scroll-mt-32 sm:py-24"
    >
      <div aria-hidden className="section-edge" />
      <div className="mx-auto max-w-6xl px-6">
        {showIntro && (
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-sky-400">Jouw stem telt</p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
              Vertel ons wat je denkt — we luisteren echt
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-zinc-400">
              Of je nu een compliment deelt, een idee hebt of gewoon wilt zeggen wat
              beter kan: elke mening helpt ArchonPro sterker te maken voor
              bouwbedrijven in België. Schrijf gerust — we lezen alles.
            </p>
          </div>
        )}

        <div className={`grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-start ${showIntro ? "mt-12" : "mt-0"}`}>
          <form
            onSubmit={handleSubmit}
            className="panel-soft relative overflow-hidden p-6 sm:p-8"
          >
            <p className="text-sm font-medium text-zinc-200">
              Hoi! Wat wil je met ons delen?
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Kies een type, schrijf je bericht en plaats het op de muur — dat duurt
              minder dan een minuut.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {KINDS.map((option) => {
                const selected = kind === option.id;
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setKind(option.id)}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      selected
                        ? `border-white/20 bg-zinc-950/60 ring-2 ${option.ring}`
                        : "border-white/8 bg-zinc-950/30 hover:border-white/15 hover:bg-zinc-950/45"
                    }`}
                  >
                    <span
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${option.bg} ${option.text}`}
                    >
                      <Icon size={17} />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-zinc-100">
                      {option.label}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                      {option.hint}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${activeKind.badge}`}
              >
                <activeKind.icon size={12} />
                {activeKind.label}
              </span>
              <span className="text-xs text-zinc-500">{activeKind.hint}</span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Je naam (optioneel)"
                className="w-full rounded-xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-sky-500/50"
              />
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Bedrijf (optioneel)"
                className="w-full rounded-xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-sky-500/50"
              />
            </div>

            <textarea
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder={placeholders[kind]}
              className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3.5 text-sm leading-relaxed text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-sky-500/50"
            />

            {submitError && (
              <p className="mt-3 text-sm text-rose-400">{submitError}</p>
            )}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={!text.trim() || submitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Plaatsen…
                  </>
                ) : sent ? (
                  <>
                    <Check size={16} />
                    Bedankt — gedeeld!
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Plaats op de muur
                  </>
                )}
              </button>
              <p className="text-xs text-zinc-500">
                Publiek zichtbaar voor iedereen. Geen spam, wel respect.
              </p>
            </div>
          </form>

          <div className="panel-soft flex max-h-[34rem] flex-col overflow-hidden p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-4">
              <div>
                <p className="text-sm font-semibold text-zinc-100">Community-muur</p>
                <p className="text-xs text-zinc-500">
                  Berichten, ideeën en tips van andere gebruikers
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-zinc-950/50 px-2.5 py-1 text-xs text-zinc-400">
                {posts.length}
              </span>
            </div>

            {loading ? (
              <div className="flex flex-1 items-center justify-center py-16 text-sm text-zinc-500">
                <Loader2 size={18} className="mr-2 animate-spin text-sky-400" />
                Berichten laden…
              </div>
            ) : loadError ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
                <p className="text-sm text-zinc-400">{loadError}</p>
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    void loadPosts();
                  }}
                  className="text-sm font-medium text-sky-400 hover:text-sky-300"
                >
                  Opnieuw proberen
                </button>
              </div>
            ) : (
              <ul className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1 [scrollbar-color:rgba(255,255,255,0.12)_transparent] [scrollbar-width:thin]">
                {posts.map((post) => {
                  const meta = kindMeta(post.kind);
                  const Icon = meta.icon;
                  return (
                    <li
                      key={post.id}
                      className="card-subtle rounded-2xl p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.badge}`}
                        >
                          <Icon size={10} />
                          {meta.label}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {formatWhen(post.createdAt)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-zinc-200">
                        {post.text}
                      </p>
                      <p className="mt-3 text-xs text-zinc-500">
                        — {post.name}
                        {post.company ? ` · ${post.company}` : ""}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
