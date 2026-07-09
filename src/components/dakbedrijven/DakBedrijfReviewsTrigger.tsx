"use client";

import { useState, useEffect, useTransition } from "react";
import { X, Loader2, MessageSquare, Calendar, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createDakBedrijfReview } from "@/app/dakbedrijven/actions";

interface DakBedrijfReviewsTriggerProps {
  dakBedrijfId: number;
  bedrijfNaam: string;
  avgRating: number;
  reviewCount: number;
}

interface ReviewItem {
  id: string;
  rating: number;
  commentaar: string;
  naam: string;
  created_at: string;
}

export default function DakBedrijfReviewsTrigger({
  dakBedrijfId,
  bedrijfNaam,
  avgRating,
  reviewCount,
}: DakBedrijfReviewsTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Nieuwe review
  const [naam, setNaam] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [commentaar, setCommentaar] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function loadReviews() {
    startTransition(async () => {
      setError(null);
      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from("dak_bedrijf_reviews")
          .select("id, rating, commentaar, naam, created_at")
          .eq("dak_bedrijf_id", dakBedrijfId)
          .order("created_at", { ascending: false });

        if (fetchError) {
          setError(fetchError.message);
        } else {
          setReviews((data || []) as ReviewItem[]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Fout bij ophalen van reviews.");
      }
    });
  }

  useEffect(() => {
    if (!isOpen) return;
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, dakBedrijfId]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("nl-NL", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    const res = await createDakBedrijfReview(dakBedrijfId, {
      naam,
      rating,
      commentaar,
    });

    setSubmitting(false);
    if ("error" in res && res.error) {
      setSubmitError(res.error);
      return;
    }
    setSubmitted(true);
    setNaam("");
    setRating(0);
    setCommentaar("");
    loadReviews();
  }

  return (
    <>
      {/* Trigger Link */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group flex flex-wrap items-center gap-1.5 text-sm text-zinc-400 hover:text-sky-400 transition-colors focus:outline-none text-left"
      >
        <span className="inline-flex items-center gap-0.5 text-xs text-zinc-500 font-medium bg-zinc-900 border border-white/5 px-1.5 py-0.5 rounded-lg group-hover:border-sky-500/20 group-hover:bg-zinc-800 transition-all">
          <span className="text-amber-400">★</span>
          <span className="text-zinc-300 font-bold">{avgRating.toFixed(1)}</span>
          <span className="text-zinc-500">({reviewCount})</span>
        </span>
        <span className="text-xs font-semibold text-sky-400 group-hover:text-sky-300">
          Bekijk / plaats review
        </span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-5 top-5 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="border-b border-white/5 pb-4 mb-4 pr-6">
              <h3 className="text-lg font-bold text-zinc-50">
                Beoordelingen van {bedrijfNaam}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Ervaringen van andere bouwbedrijven — iedereen mag een review plaatsen.
              </p>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1">
              {/* Summary Stats */}
              <div className="flex items-center gap-4 rounded-2xl bg-zinc-950/40 p-4 border border-white/5">
                <div className="text-center px-4 py-2 border-r border-white/5">
                  <span className="block text-3xl font-extrabold text-zinc-50 tracking-tight">
                    {avgRating.toFixed(1)}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block mt-0.5">
                    Gemiddeld
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-0.5 text-amber-400 text-lg">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={star <= Math.round(avgRating) ? "text-amber-400" : "text-zinc-700"}>
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-zinc-400 block mt-1">
                    Gebaseerd op {reviewCount} {reviewCount === 1 ? "beoordeling" : "beoordelingen"}
                  </span>
                </div>
              </div>

              {/* Nieuwe review plaatsen */}
              <form
                onSubmit={handleSubmitReview}
                className="rounded-2xl border border-white/5 bg-zinc-950/30 p-4 space-y-3"
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Zelf een review plaatsen
                </h4>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="text-2xl leading-none transition-colors"
                      aria-label={`${star} sterren`}
                    >
                      <span
                        className={
                          star <= (hoverRating || rating)
                            ? "text-amber-400"
                            : "text-zinc-700"
                        }
                      >
                        ★
                      </span>
                    </button>
                  ))}
                </div>

                <input
                  value={naam}
                  onChange={(e) => setNaam(e.target.value)}
                  placeholder="Jouw naam of bedrijfsnaam (optioneel)"
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/50 px-3.5 py-2 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-500 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/10"
                />

                <textarea
                  value={commentaar}
                  onChange={(e) => setCommentaar(e.target.value)}
                  rows={3}
                  placeholder="Vertel over je ervaring met dit bedrijf..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-zinc-900/50 px-3.5 py-2 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-500 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/10"
                  required
                />

                {submitError && (
                  <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                    {submitError}
                  </div>
                )}
                {submitted && (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                    Bedankt voor je review!
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-zinc-950 transition-all hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Send size={13} />
                    )}
                    Review plaatsen
                  </button>
                </div>
              </form>

              {/* Reviews List */}
              <div className="space-y-3 pt-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Alle reviews
                </h4>

                {isPending ? (
                  <div className="py-12 text-center text-zinc-500 flex flex-col items-center gap-2">
                    <Loader2 size={24} className="animate-spin text-sky-400" />
                    <span className="text-sm">Beoordelingen ophalen...</span>
                  </div>
                ) : error ? (
                  <div className="rounded-xl border border-rose-500/10 bg-rose-500/5 px-4 py-3 text-xs text-rose-400">
                    {error}
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500">
                    <MessageSquare size={24} className="mx-auto text-zinc-700 mb-2" />
                    <p className="text-sm font-semibold">Nog geen reviews</p>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      Wees de eerste om een beoordeling te plaatsen.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 divide-y divide-white/5">
                    {reviews.map((r, i) => (
                      <div key={r.id} className={`pt-3 ${i === 0 ? "pt-0" : ""}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="font-semibold text-sm text-zinc-200 block">
                              {r.naam || "Anoniem"}
                            </span>
                            <div className="flex items-center gap-0.5 text-amber-400 text-xs mt-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} className={star <= r.rating ? "text-amber-400" : "text-zinc-700"}>
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                            <Calendar size={10} className="shrink-0" />
                            {formatDate(r.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-300 mt-2 leading-relaxed whitespace-pre-line bg-zinc-950/20 rounded-xl p-3 border border-white/[0.02]">
                          {r.commentaar}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/5 pt-4 mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-white/10 px-5 py-2 text-xs font-semibold text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
