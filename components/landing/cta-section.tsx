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
      className="py-24 px-6 bg-gradient-to-b from-background-dark to-background-dark/95"
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
            variant="strong"
            border="medium"
            className="p-12 text-center relative overflow-hidden"
          >
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 pointer-events-none" />

            <motion.div
              className="relative z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to take back your privacy?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of users who've already made the switch to a
                communication platform that respects their rights.
              </p>

              <Link href="/signup">
                <Button
                  size="lg"
                  className="text-xl px-12 py-6 shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-shadow"
                >
                  Create Free Account
                </Button>
              </Link>

              <p className="text-sm text-gray-400 mt-6">
                No credit card required. No data harvesting.{" "}
                <span className="font-semibold text-white">Ever.</span>
              </p>
            </motion.div>

            {/* Decorative elements */}
            <motion.div
              className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl"
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
              className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/20 rounded-full blur-3xl"
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
