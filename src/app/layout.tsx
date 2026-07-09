import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://archonpro.be"),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo-tile.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/logo-tile.png", type: "image/png", sizes: "512x512" }],
    shortcut: "/favicon.ico",
  },
  title: "ArchonPro — CRM voor zelfstandige vakmensen",
  description:
    "Offertes, projecten, klanten en facturen op één plek. Geen losse WhatsApp-berichten of Excel-lijsten meer. Simpel. Snel. En nooit saai.",
  openGraph: {
    title: "ArchonPro — CRM voor zelfstandige vakmensen",
    description:
      "Offertes, projecten, klanten en facturen op één plek. Simpel. Snel. En nooit saai.",
    type: "website",
    locale: "nl_BE",
    siteName: "ArchonPro",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "ArchonPro" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ArchonPro — CRM voor zelfstandige vakmensen",
    description:
      "Offertes, projecten, klanten en facturen op één plek. Simpel. Snel. En nooit saai.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      data-scroll-behavior="auto"
      className={`${inter.variable} h-full`}
    >
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
