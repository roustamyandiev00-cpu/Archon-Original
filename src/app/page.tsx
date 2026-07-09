import { Suspense } from "react";
import IntroOverlay from "@/components/IntroOverlay";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Realtime from "@/components/Realtime";
import Genius from "@/components/Genius";
import Pricing from "@/components/Pricing";
import Blog from "@/components/Blog";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <IntroOverlay />
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Realtime />
        <Genius />
        <Suspense>
          <Blog />
        </Suspense>
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
