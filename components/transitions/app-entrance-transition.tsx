"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";
import { getPerformanceTier } from "@/lib/utils/webgl";

interface AppEntranceTransitionProps {
  isActive: boolean;
  onComplete: () => void;
}

/**
 * Full-screen portal entrance transition shown after login/signup
 * and on PWA launch for logged-in users.
 *
 * Features:
 * - Animated "B" logo with glow
 * - Portal opening effect with particles
 * - Smooth fade to main app
 * - ESC to skip
 */
export function AppEntranceTransition({
  isActive,
  onComplete,
}: AppEntranceTransitionProps) {
  const [mounted, setMounted] = useState(false);
  const [tier, setTier] = useState<"low" | "medium" | "high">("low");

  useEffect(() => {
    setMounted(true);
    setTier(getPerformanceTier());
  }, []);

  // ESC to skip
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onComplete();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, onComplete]);

  // Auto-complete after animation finishes
  const handleAnimationComplete = useCallback(() => {
    // Delay slightly after animation completes before calling onComplete
    setTimeout(onComplete, 300);
  }, [onComplete]);

  if (!mounted || typeof document === "undefined") return null;

  const showParticles = tier === "high";
  const showEnhancedEffects = tier === "high" || tier === "medium";

  return createPortal(
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Background - gradient from black to brand color */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, oklch(0.2 0.1 265) 0%, oklch(0.08 0.02 250) 50%, #000 100%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />

          {/* Portal expanding circle */}
          {showEnhancedEffects && (
            <motion.div
              className="absolute inset-0"
              initial={{ clipPath: "circle(0% at 50% 50%)" }}
              animate={{ clipPath: "circle(150% at 50% 50%)" }}
              exit={{ clipPath: "circle(0% at 50% 50%)" }}
              transition={{
                duration: 1.8,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse at center, oklch(0.3 0.15 265 / 0.3) 0%, transparent 70%)",
                }}
              />
            </motion.div>
          )}

          {/* Portal glow ring */}
          {showEnhancedEffects && (
            <motion.div
              className="absolute"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: [0, 1, 0.8, 0],
                scale: [0.5, 1, 1.5, 2.5],
              }}
              transition={{
                duration: 2,
                ease: "easeOut",
                times: [0, 0.2, 0.6, 1],
              }}
            >
              <div
                className="w-96 h-96 rounded-full"
                style={{
                  border: "3px solid oklch(0.65 0.25 265 / 0.6)",
                  boxShadow:
                    "0 0 60px oklch(0.65 0.25 265 / 0.4), inset 0 0 60px oklch(0.65 0.25 265 / 0.2)",
                }}
              />
            </motion.div>
          )}

          {/* Animated "B" Logo */}
          <motion.div
            className="relative z-10"
            initial={{ opacity: 0, scale: 0.3, rotateY: -45 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{
              duration: 1.5,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            style={{ perspective: "1000px" }}
            onAnimationComplete={handleAnimationComplete}
          >
            {/* Outer glow */}
            <motion.div
              className="absolute inset-0 -m-12 rounded-3xl blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.65 0.25 265 / 0.6) 0%, transparent 70%)",
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.6, 0.9, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* "B" Letter */}
            <div
              className="relative text-[160px] font-bold"
              style={{
                fontFamily: "system-ui, -apple-system, sans-serif",
                background:
                  "linear-gradient(135deg, oklch(0.75 0.25 265) 0%, oklch(0.65 0.2 285) 50%, oklch(0.7 0.18 145) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                textShadow: "0 0 40px oklch(0.65 0.25 265 / 0.5)",
              }}
            >
              B
            </div>

            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: "200%", opacity: [0, 1, 0] }}
              transition={{
                duration: 1.5,
                delay: 0.5,
                ease: "easeInOut",
              }}
              style={{ transformSkewX: "-20deg" }}
            />
          </motion.div>

          {/* Scatter particles */}
          {showParticles && <ScatterParticles />}

          {/* Skip hint */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5 }}
          >
            Press ESC to skip
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/**
 * Animated particles that scatter outward
 */
function ScatterParticles() {
  const particles = Array.from({ length: 40 }, (_, i) => {
    const angle = (i / 40) * Math.PI * 2;
    const distance = 150 + Math.random() * 300;
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size: 2 + Math.random() * 6,
      delay: Math.random() * 0.4,
      color: i % 3 === 0
        ? "oklch(0.65 0.25 265)"
        : i % 3 === 1
        ? "oklch(0.7 0.2 285)"
        : "oklch(0.75 0.18 145)",
    };
  });

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            opacity: [0, 1, 0],
            scale: [0, 1, 0.3],
          }}
          transition={{
            duration: 1.5,
            delay: 0.5 + p.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}
