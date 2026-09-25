import type { Metadata } from "next";

import ClosingCTA from "@/components/site/home/ClosingCTA";
import Hero from "@/components/site/home/Hero";
import LiberiaFeature from "@/components/site/home/LiberiaFeature";
import Outcomes from "@/components/site/home/Outcomes";
import PracticeExplorer from "@/components/site/home/PracticeExplorer";
import ProblemSection from "@/components/site/home/ProblemSection";
import ProductShowcase from "@/components/site/home/ProductShowcase";
import StageProgression from "@/components/site/home/StageProgression";

export const metadata: Metadata = {
  title: { absolute: "AgriVault Data — Agricultural systems, technology and advisory" },
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <PracticeExplorer />
      <StageProgression />
      <ProductShowcase />
      <LiberiaFeature />
      <Outcomes />
      <ClosingCTA />
    </>
  );
}
