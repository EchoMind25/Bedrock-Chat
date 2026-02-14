"use client";

import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import { motion, useInView } from "motion/react";
import Link from "next/link";
import { useRef } from "react";

export function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="py-24 px-6 bg-linear-to-b from-background-dark/95 to-background-dark"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={
            isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }
          }
          transition={{ duration: 0.6 }}
        >
          <Glass
            variant="liquid-elevated"
            border="liquid"
            className="p-12 md:p-16 text-center relative overflow-hidden rounded-2xl"
          >
            {/* Animated glow ring */}
            <div className="absolute inset-0 rounded-2xl glow-pulse pointer-events-none" />

            {/* Background gradient */}
            <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-secondary/5 to-accent/10 pointer-events-none" />

            <motion.div
              className="relative z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to take back your privacy?
              </h2>
              <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                Join thousands of families who've already made the switch to a
                communication platform that respects their rights.
              </p>

              <Link href="/signup">
                <Button
                  size="lg"
                  className="text-xl px-12 py-6 shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-shadow"
                >
                  Start Your Private Server
                </Button>
              </Link>

              <p className="text-sm text-gray-400 mt-8">
                No credit card. No data harvesting. No government ID.{" "}
                <span className="font-semibold text-white">Ever.</span>
              </p>

              {/* Compliance row */}
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                {["COPPA", "GDPR", "CCPA"].map((badge) => (
                  <span
                    key={badge}
                    className="px-3 py-1 text-xs font-medium rounded-full border border-white/10 text-gray-400"
                  >
                    {badge} Compliant
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Decorative orbs */}
            <motion.div
              className="absolute -top-12 -right-12 w-40 h-40 bg-primary/15 rounded-full blur-3xl pointer-events-none"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute -bottom-12 -left-12 w-40 h-40 bg-accent/15 rounded-full blur-3xl pointer-events-none"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 1,
              }}
            />
          </Glass>
        </motion.div>
      </div>
    </section>
  );
}
