import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Realtime from "@/components/Realtime";
import Genius from "@/components/Genius";
import Blog from "@/components/Blog";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Realtime />
        <Genius />
        <Suspense>
          <Blog />
        </Suspense>
        <CTA />
      </main>
      <Footer />
    </>
  );
}
