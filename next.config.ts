import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Puppeteer mag niet gebundeld worden; het draait als native Node-dependency
  // in de PDF-route (server-side).
  serverExternalPackages: ["puppeteer", "puppeteer-core"],
  // Sta toegang tot de dev-server toe via het LAN-adres (bijv. testen op gsm
  // of via http://192.168.0.219:3000). Zonder dit blokkeert Next.js de
  // dev-assets cross-origin en werkt o.a. inloggen niet.
  allowedDevOrigins: ["192.168.0.219", "192.168.0.*"],
};

export default nextConfig;
