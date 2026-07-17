"use client";

import { useEffect } from "react";

const STORAGE_KEY = "archonpro-chunk-reload";

function isChunkLoadError(reason: unknown): boolean {
  if (!(reason instanceof Error)) return false;
  return (
    reason.name === "ChunkLoadError" ||
    reason.message.includes("Loading chunk") ||
    reason.message.includes("Failed to load chunk")
  );
}

/** Herlaadt één keer bij verouderde JS-chunks (dev HMR of na deploy). */
export default function ChunkLoadRecovery() {
  useEffect(() => {
    sessionStorage.removeItem(STORAGE_KEY);

    function onRejection(event: PromiseRejectionEvent) {
      if (!isChunkLoadError(event.reason)) return;
      if (sessionStorage.getItem(STORAGE_KEY)) return;
      sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
      window.location.reload();
    }

    window.addEventListener("unhandledrejection", onRejection);
    return () => window.removeEventListener("unhandledrejection", onRejection);
  }, []);

  return null;
}
