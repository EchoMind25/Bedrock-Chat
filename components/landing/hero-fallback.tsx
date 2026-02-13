"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface HeroFallbackProps {
  /** Enable mouse-tracking parallax for medium-tier devices */
  parallax?: boolean;
}

/**
 * Enhanced 2D/2.5D fallback hero background.
 * Used when WebGL is unavailable or on lower-tier devices.
 * - Low tier: Animated gradient + floating orbs
 * - Medium tier: Adds mouse-tracking CSS parallax layers
 */
export function HeroFallback({ parallax = false }: HeroFallbackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!parallax) return;
    const handler = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setOffset({ x, y });
    };
    window.addEventListener("mousemove", handler, { passive: true });
    return () => window.removeEventListener("mousemove", handler);
  }, [parallax]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* Animated gradient base */}
      <div className="absolute inset-0 animated-gradient" />

      {/* Large primary orb */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl"
        style={{
          background: "oklch(0.55 0.2 265 / 0.25)",
          willChange: "transform",
          x: parallax ? offset.x * -20 : 0,
          y: parallax ? offset.y * -15 : 0,
        }}
        animate={{
          y: parallax ? undefined : [0, -25, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      {/* Secondary orb */}
      <motion.div
        className="absolute bottom-1/4 right-1/5 w-96 h-96 rounded-full blur-3xl"
        style={{
          background: "oklch(0.6 0.15 285 / 0.2)",
          willChange: "transform",
          x: parallax ? offset.x * 15 : 0,
          y: parallax ? offset.y * 20 : 0,
        }}
        animate={{
          y: parallax ? undefined : [0, 20, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Accent orb */}
      <motion.div
        className="absolute top-1/3 right-1/3 w-64 h-64 rounded-full blur-3xl"
        style={{
          background: "oklch(0.65 0.18 145 / 0.15)",
          willChange: "transform",
          x: parallax ? offset.x * -10 : 0,
          y: parallax ? offset.y * -20 : 0,
        }}
        animate={{
          y: parallax ? undefined : [0, -30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 12,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      {/* Small floating particles (medium tier parallax) */}
      {parallax && (
        <>
          <motion.div
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: "oklch(0.7 0.2 265 / 0.6)",
              top: "20%",
              left: "60%",
              x: offset.x * 30,
              y: offset.y * 25,
            }}
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              background: "oklch(0.75 0.15 285 / 0.5)",
              top: "60%",
              left: "30%",
              x: offset.x * -25,
              y: offset.y * 30,
            }}
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          <motion.div
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: "oklch(0.8 0.2 145 / 0.5)",
              top: "45%",
              right: "20%",
              x: offset.x * 20,
              y: offset.y * -20,
            }}
            animate={{ opacity: [0.2, 0.7, 0.2] }}
            transition={{
              duration: 5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />
        </>
      )}

      {/* Subtle grid overlay for cyberpunk feel */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.7 0.15 265 / 0.3) 1px, transparent 1px), linear-gradient(90deg, oklch(0.7 0.15 265 / 0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}
