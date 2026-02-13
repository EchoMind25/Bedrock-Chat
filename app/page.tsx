"use client";

import { ComparisonTable } from "@/components/landing/comparison-table";
import { CTASection } from "@/components/landing/cta-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { Footer } from "@/components/landing/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { SocialProofSection } from "@/components/landing/social-proof-section";
import { TrustSection } from "@/components/landing/trust-section";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background-dark overflow-x-hidden">
      <HeroSection />
      <FeaturesSection />
      <TrustSection />
      <ComparisonTable />
      <SocialProofSection />
      <CTASection />
      <Footer />
    </main>
  );
}
