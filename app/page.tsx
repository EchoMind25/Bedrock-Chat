"use client";

import { useEffect, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useOnboardingStore } from "@/store/onboarding.store";
import { HeroSection } from "@/components/landing/hero-section";

// Below-fold sections: lazy-load to keep initial bundle small (hero is LCP)
const FeaturesSection = lazy(() => import("@/components/landing/features-section").then(m => ({ default: m.FeaturesSection })));
const TrustSection = lazy(() => import("@/components/landing/trust-section").then(m => ({ default: m.TrustSection })));
const ComparisonTable = lazy(() => import("@/components/landing/comparison-table").then(m => ({ default: m.ComparisonTable })));
const SocialProofSection = lazy(() => import("@/components/landing/social-proof-section").then(m => ({ default: m.SocialProofSection })));
const CTASection = lazy(() => import("@/components/landing/cta-section").then(m => ({ default: m.CTASection })));
const Footer = lazy(() => import("@/components/landing/footer").then(m => ({ default: m.Footer })));

export default function LandingPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const showEntranceTransition = useOnboardingStore((s) => s.showEntranceTransition);
  const triggerEntranceTransition = useOnboardingStore((s) => s.triggerEntranceTransition);

  // Check auth and redirect authenticated users — runs in background, does not gate render
  useEffect(() => {
    async function checkAndRedirect() {
      await useAuthStore.getState().checkAuth();

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

  // Black screen while the entrance transition portal is active
  // (authenticated user being redirected — portal covers this)
  if (showEntranceTransition || isAuthenticated) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <main className="min-h-screen bg-background-dark overflow-x-hidden">
      <HeroSection />
      <Suspense fallback={null}>
        <FeaturesSection />
        <TrustSection />
        <ComparisonTable />
        <SocialProofSection />
        <CTASection />
        <Footer />
      </Suspense>
    </main>
  );
}
