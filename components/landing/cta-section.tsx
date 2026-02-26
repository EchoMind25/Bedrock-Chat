"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence, useInView } from "motion/react";
import { useRef } from "react";

export function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong");
        return;
      }

      setIsSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <AnimatePresence mode="wait">
                {!isSubmitted ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                      Get Notified When We Launch
                    </h2>
                    <p className="text-xl text-gray-300 mb-4 max-w-2xl mx-auto leading-relaxed">
                      Drop your email and we&apos;ll notify you when beta access opens.
                    </p>
                    <p className="text-sm text-blue-300/60 mb-10 max-w-xl mx-auto">
                      We strongly recommend using a{" "}
                      <a
                        href="https://proton.me/mail"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
                      >
                        Proton Mail
                      </a>{" "}
                      alias for maximum privacy. This email is for notification
                      only &mdash; it will be deleted after launch unless you
                      choose to use it for your account.
                    </p>

                    {/* Error display */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6 max-w-md mx-auto"
                        >
                          <p className="text-red-400 text-sm">{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <form
                      onSubmit={handleSubmit}
                      className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                    >
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your-alias@proton.me"
                        required
                        id="waitlist-email"
                        className="flex-1"
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        loading={isSubmitting}
                        className="shrink-0"
                      >
                        Notify Me
                      </Button>
                    </form>

                    <p className="text-xs text-gray-500 mt-6">
                      No spam. One email when beta launches. Then we delete it.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-4"
                  >
                    {/* Checkmark icon */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                      }}
                      className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center"
                    >
                      <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-green-400"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </motion.div>
                    <h3 className="text-3xl font-bold text-white mb-3">
                      You&apos;re on the list
                    </h3>
                    <p className="text-gray-300 max-w-md mx-auto">
                      We&apos;ll email you when beta access opens. Check your
                      spam folder if you don&apos;t see it.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Compliance row */}
              <div className="flex flex-wrap justify-center gap-3 mt-8">
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
