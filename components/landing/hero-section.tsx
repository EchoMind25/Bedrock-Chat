"use client";

import { Button } from "@/components/ui/button";
import { getPerformanceTier } from "@/lib/utils/webgl";
import type { PerformanceTier } from "@/lib/utils/webgl";
import { motion } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { HeroFallback } from "./hero-fallback";

// Lazy-load the 3D scene - only on high-tier devices, never SSR
const Hero3DScene = dynamic(() => import("./hero-3d-scene"), {
  ssr: false,
  loading: () => null,
});

export function HeroSection() {
  const [tier, setTier] = useState<PerformanceTier>("low");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTier(getPerformanceTier());
  }, []);

  const scrollToFeatures = () => {
    const el = document.getElementById("features");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background-dark px-4 sm:px-6">
      {/* Background layer - progressive enhancement */}
      {mounted && tier === "high" ? (
        <Suspense fallback={<HeroFallback />}>
          <Hero3DScene />
          {/* Gradient overlay for text readability on 3D */}
          <div className="absolute inset-0 z-[1] bg-gradient-to-b from-transparent via-transparent to-background-dark/80 pointer-events-none" />
        </Suspense>
      ) : (
        <HeroFallback parallax={mounted && tier === "medium"} />
      )}

      {/* Content overlay - always SSR rendered for fast LCP */}
      <div className="relative z-10 max-w-6xl mx-auto w-full text-center">
        <motion.div
          className="inline-block mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border border-primary/30 bg-primary/10 text-primary">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            No government ID required
          </span>
        </motion.div>

        <motion.h1
          className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          Privacy-first communication
          <br />
          <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            that Discord wishes it was
          </span>
        </motion.h1>

        <motion.p
          className="text-lg md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
        >
          No government IDs. No facial scans. No tracking.
          <br />
          Just pure, encrypted conversations for your family.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          <Link href="/signup">
            <Button
              size="lg"
              className="text-lg px-10 py-5 min-w-[240px] shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-shadow"
            >
              Start Your Private Server
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="lg"
            onClick={scrollToFeatures}
            className="text-lg px-8 py-5 min-w-[200px] text-white border-2 border-white/20 hover:border-white/50 hover:bg-white/5"
          >
            Learn More
          </Button>
        </motion.div>

        {/* Trust badges under CTA */}
        <motion.div
          className="flex flex-wrap justify-center gap-6 mt-10 text-xs text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            E2E Encrypted
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            COPPA Compliant
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Under 50MB RAM
          </span>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <motion.div
          className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center p-2"
          animate={{ y: [0, 8, 0] }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
