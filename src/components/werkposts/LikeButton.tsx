"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleLike } from "@/app/dashboard/werkposts/actions";

export default function LikeButton({
  werkpostId,
  initialLiked,
  initialCount,
  isLoggedIn,
}: {
  werkpostId: string;
  initialLiked: boolean;
  initialCount: number;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!isLoggedIn) {
      router.push("/login?redirect=/bouwnetwerk");
      return;
    }
    // Optimistische update.
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));

    startTransition(async () => {
      const res = await toggleLike(werkpostId);
      if ("error" in res && res.error) {
        // Draai de optimistische update terug bij een fout.
        setLiked(!next);
        setCount((c) => c + (next ? -1 : 1));
      } else if ("liked" in res && typeof res.liked === "boolean") {
        setLiked(res.liked);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={liked}
      aria-label={liked ? "Like verwijderen" : "Werkpost liken"}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${
        liked
          ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
          : "border-white/10 text-zinc-300 hover:border-rose-500/30 hover:text-rose-300"
      }`}
    >
      <Heart size={15} className={liked ? "fill-current" : ""} />
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
