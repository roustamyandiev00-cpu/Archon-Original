"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ROUTES = [
  "/register",
  "/login",
  "/prijzen",
  "/functies",
  "/functies/peppol",
  "/functies/facturen",
  "/functies/schatting",
  "/functies/ai-metgezel",
  "/functies/integraties",
  "/blog",
  "/gemeenschap",
  "/over",
  "/bouwnetwerk",
  "/contact",
];

/** Laadt veelgebruikte pagina's alvast in voor snellere knoppen. */
export default function PrefetchRoutes() {
  const router = useRouter();

  useEffect(() => {
    ROUTES.forEach((route) => router.prefetch(route));
  }, [router]);

  return null;
}
