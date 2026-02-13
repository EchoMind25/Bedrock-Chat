"use client";

import { useEffect, useState, useCallback } from "react";
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
import { AppEntranceTransition } from "@/components/transitions/app-entrance-transition";

export default function LandingPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const showEntranceTransition = useOnboardingStore((s) => s.showEntranceTransition);
  const triggerEntranceTransition = useOnboardingStore((s) => s.triggerEntranceTransition);
  const completeEntranceTransition = useOnboardingStore((s) => s.completeEntranceTransition);

  // Check auth and trigger entrance transition if logged in
  useEffect(() => {
    async function checkAndRedirect() {
      // Wait for auth to initialize from persisted state
      await useAuthStore.getState().checkAuth();
      setIsChecking(false);

      // If user is authenticated (returning user or PWA launch)
      const { isAuthenticated } = useAuthStore.getState();
      if (isAuthenticated) {
        // Trigger entrance transition
        triggerEntranceTransition();
      }
    }

    checkAndRedirect();
  }, [router, triggerEntranceTransition]);

  // Handle entrance transition completion
  const handleEntranceComplete = useCallback(() => {
    completeEntranceTransition();
    router.push("/channels");
  }, [router, completeEntranceTransition]);

  // Show loading while checking auth (prevent flash of landing page)
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

  // Show entrance transition for authenticated users (PWA launch)
  if (showEntranceTransition) {
    return (
      <>
        <div className="min-h-screen bg-black" />
        <AppEntranceTransition
          isActive={showEntranceTransition}
          onComplete={handleEntranceComplete}
        />
      </>
    );
  }

  // Only show landing page if NOT authenticated
  if (isAuthenticated) {
    return null; // Will show transition
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
