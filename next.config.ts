import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Puppeteer mag niet gebundeld worden; het draait als native Node-dependency
  // in de PDF-route (server-side).
  serverExternalPackages: ["puppeteer", "puppeteer-core"],
  // Sta toegang tot de dev-server toe via het LAN-adres (bijv. testen op gsm
  // of via http://192.168.0.219:3000). Zonder dit blokkeert Next.js de
  // dev-assets cross-origin en werkt o.a. inloggen niet.
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.0.*",
    "192.168.1.*",
    "10.0.0.*",
    "172.16.*",
  ],
  // Turbopack is default in Next 16; lege config voorkomt conflict met eventuele webpack-plugins.
  turbopack: {},
};

export default nextConfig;
