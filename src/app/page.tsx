import IntroOverlay from "@/components/IntroOverlay";
import PrefetchRoutes from "@/components/PrefetchRoutes";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Realtime from "@/components/Realtime";
import Genius from "@/components/Genius";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <PrefetchRoutes />
      <IntroOverlay />
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Realtime />
        <Genius />
      </main>
      <Footer />
    </>
  );
}
