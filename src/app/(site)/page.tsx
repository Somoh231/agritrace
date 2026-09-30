import type { Metadata } from "next";

import ClosingCTA from "@/components/site/home/ClosingCTA";
import EngagementMatrix from "@/components/site/home/EngagementMatrix";
import FieldToDecision from "@/components/site/home/FieldToDecision";
import Governance from "@/components/site/home/Governance";
import Hero from "@/components/site/home/Hero";
import LiberiaFeature from "@/components/site/home/LiberiaFeature";
import PracticeExplorer from "@/components/site/home/PracticeExplorer";
import ProblemSection from "@/components/site/home/ProblemSection";
import ProductPreview from "@/components/site/home/ProductPreview";
import ProductShowcase from "@/components/site/home/ProductShowcase";
import StageProgression from "@/components/site/home/StageProgression";

export const metadata: Metadata = {
  title: { absolute: "AgriVault Data — Agricultural systems, technology and advisory" },
  alternates: { canonical: "/" },
};

/**
 * Homepage, in the approved order (v3 baseline §01). The product is visible in
 * the hero and again by section 3; the only full-width dark moments are the
 * sequence (7, navy) and the close (11, forest).
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <ProductPreview />
      <PracticeExplorer />
      <ProductShowcase />
      <StageProgression />
      <FieldToDecision />
      <LiberiaFeature />
      <Governance />
      <EngagementMatrix />
      <ClosingCTA />
    </>
  );
}
