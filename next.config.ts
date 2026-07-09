import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Puppeteer mag niet gebundeld worden; het draait als native Node-dependency
  // in de PDF-route (server-side).
  serverExternalPackages: ["puppeteer", "puppeteer-core"],
};

export default nextConfig;
