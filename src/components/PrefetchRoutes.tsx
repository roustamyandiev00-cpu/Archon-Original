"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ROUTES = [
  "/register",
  "/login",
  "/prijzen",
  "/bouwnetwerk",
  "/functies/ai-metgezel",
  "/functies/schatting",
  "/functies/facturen",
  "/functies/integraties",
];

/** Laadt veelgebruikte pagina's alvast in voor snellere knoppen. */
export default function PrefetchRoutes() {
  const router = useRouter();

  useEffect(() => {
    ROUTES.forEach((route) => router.prefetch(route));
  }, [router]);

  return null;
}
