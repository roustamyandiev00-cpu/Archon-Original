"use client";

import { useState, useEffect, useTransition } from "react";
import { X, Loader2, MessageSquare, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface CompanyReviewsTriggerProps {
  companyId: number;
  companyName: string;
  avgRating: number;
  reviewCount: number;
}

interface ReviewItem {
  id: string;
  rating: number;
  commentaar: string;
  created_at: string;
  reviewer: {
    naam: string;
  } | null;
}

export default function CompanyReviewsTrigger({
  companyId,
  companyName,
  avgRating,
  reviewCount,
}: CompanyReviewsTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    startTransition(async () => {
      setError(null);
      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from("bedrijf_reviews")
          .select(`
            id,
            rating,
            commentaar,
            created_at,
            reviewer:reviewer_company_id (
              naam
            )
          `)
          .eq("target_company_id", companyId)
          .order("created_at", { ascending: false });

        if (fetchError) {
          setError(fetchError.message);
        } else {
          setReviews((data || []) as any[]);
        }
      } catch (err: any) {
        setError(err.message || "Fout bij ophalen van reviews.");
      }
    });
  }, [isOpen, companyId]);

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

  return (
    <>
      {/* Trigger Link */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group flex flex-wrap items-center gap-1.5 text-sm text-zinc-400 hover:text-sky-400 transition-colors focus:outline-none text-left"
      >
        <span className="font-semibold text-zinc-300 group-hover:text-sky-400 transition-colors">
          {companyName}
        </span>
        <span className="inline-flex items-center gap-0.5 text-xs text-zinc-500 font-medium ml-1.5 bg-zinc-900 border border-white/5 px-1.5 py-0.5 rounded-lg group-hover:border-sky-500/20 group-hover:bg-zinc-800 transition-all">
          <span className="text-amber-400">★</span>
          <span className="text-zinc-300 font-bold">{avgRating.toFixed(1)}</span>
          <span className="text-zinc-500">({reviewCount})</span>
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
                Beoordelingen van {companyName}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Betrouwbaarheid en ervaringen gedeeld door andere bedrijven in het netwerk.
              </p>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
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

              {/* Reviews List */}
              <div className="space-y-3 pt-2">
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
                      Dit bedrijf heeft nog geen beoordelingen ontvangen.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 divide-y divide-white/5">
                    {reviews.map((r, i) => (
                      <div key={r.id} className={`pt-3 ${i === 0 ? "pt-0" : ""}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="font-semibold text-sm text-zinc-200 block">
                              {r.reviewer?.naam ?? "Onbekende partner"}
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
