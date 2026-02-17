"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useOnboardingStore } from "@/store/onboarding.store";
import { ComparisonTable } from "@/components/landing/comparison-table";
import { CTASection } from "@/components/landing/cta-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { Footer } from "@/components/landing/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { SocialProofSection } from "@/components/landing/social-proof-section";
import { TrustSection } from "@/components/landing/trust-section";

export default function LandingPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const showEntranceTransition = useOnboardingStore((s) => s.showEntranceTransition);
  const triggerEntranceTransition = useOnboardingStore((s) => s.triggerEntranceTransition);

  // Check auth and redirect authenticated users
  useEffect(() => {
    async function checkAndRedirect() {
      await useAuthStore.getState().checkAuth();
      setIsChecking(false);

      const { isAuthenticated } = useAuthStore.getState();
      if (isAuthenticated) {
        // Activate the root-layout portal, then navigate immediately.
        // The portal survives the route change because it lives in the
        // root layout — no flash of the landing page during transition.
        triggerEntranceTransition();
        router.push("/channels");
      }
    }

    checkAndRedirect();
  }, [router, triggerEntranceTransition]);

  // Prevent flash of landing page content during auth check
  if (isChecking || isInitializing) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  // Black screen while the entrance transition portal is active
  // (authenticated user being redirected — portal covers this)
  if (showEntranceTransition || isAuthenticated) {
    return <div className="min-h-screen bg-black" />;
  }

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
