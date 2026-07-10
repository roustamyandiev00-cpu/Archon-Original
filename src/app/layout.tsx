import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { rootMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = rootMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl-BE"
      data-scroll-behavior="auto"
      className={cn("h-full", inter.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
