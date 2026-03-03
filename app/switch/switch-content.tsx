"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FAQItem {
  question: string;
  answer: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const whySwitchCards = [
  {
    icon: "\u{1F512}",
    title: "Your Data, Your Rules",
    description:
      "No government ID. No facial recognition. No data mining. Your conversations belong to you \u2014 not advertisers, not AI training datasets, not government databases.",
  },
  {
    icon: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}",
    title: "Built for Families",
    description:
      "Transparent monitoring means teens see what parents can see. No hidden surveillance, no secret AI scanning. Trust is built on honesty, not control.",
  },
  {
    icon: "\u{1F3AE}",
    title: "Gamer Code Ethics",
    description:
      "We don\u2019t record voice chat. We don\u2019t sell your gaming habits. We don\u2019t profile your play sessions. We respect the culture \u2014 and we respect you.",
  },
];

const comparisonData = [
  {
    feature: "Government ID for age checks",
    discord: { text: "May be required", negative: true },
    bedrock: { text: "Never", positive: true },
  },
  {
    feature: "Facial scanning",
    discord: { text: "Used for age estimation", negative: true },
    bedrock: { text: "Never", positive: true },
  },
  {
    feature: "Voice chat recording",
    discord: { text: "May be processed per privacy policy", negative: true },
    bedrock: { text: "Never recorded", positive: true },
  },
  {
    feature: "Data used for advertising",
    discord: { text: "Personalized ads served", negative: true },
    bedrock: { text: "Never", positive: true },
  },
  {
    feature: "Family monitoring",
    discord: { text: "Not available", negative: true },
    bedrock: { text: "Transparent & built-in", positive: true },
  },
  {
    feature: "Open audit logs",
    discord: { text: "Admin-only server logs", negative: true },
    bedrock: { text: "Full transparency", positive: true },
  },
  {
    feature: "Typical RAM usage",
    discord: { text: "300MB+ (Electron)", negative: true },
    bedrock: { text: "Under 100MB", positive: true },
  },
  {
    feature: "Data export",
    discord: { text: "Up to 30 days", negative: true },
    bedrock: { text: "Instant self-service", positive: true },
  },
];

const migrationSteps = [
  {
    number: 1,
    title: "Import Your Server Structure",
    description:
      "Export your Discord server data and import it into Bedrock Chat. Channels, roles, and categories are recreated in about 5 minutes.",
  },
  {
    number: 2,
    title: "Invite Your Community",
    description:
      "Share a link. They sign up. Same crew, better platform. No complicated migration tools needed.",
  },
  {
    number: 3,
    title: "You\u2019re Home",
    description:
      "Start chatting. Voice included. Your data stays yours. No data left behind on servers you don\u2019t control.",
  },
];

// ─── Icons ───────────────────────────────────────────────────────────────────

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7l5 5m0 0l-5 5m5-5H6"
      />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  );
}

// ─── Sections ────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Decorative background orbs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-primary/20 blur-[128px]" />
        <div className="absolute bottom-1/4 -left-32 w-96 h-96 rounded-full bg-accent/15 blur-[128px]" />
      </div>

      {/* Nav */}
      <nav
        className="relative z-20 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full"
        aria-label="Switch page navigation"
      >
        <Link
          href="/"
          className="text-white font-bold text-lg hover:text-primary transition-colors"
        >
          Bedrock Chat
        </Link>
        <Link
          href="/signup"
          className="inline-flex items-center px-5 py-2.5 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors min-h-[44px] touch-manipulation"
        >
          Sign Up
        </Link>
      </nav>

      {/* Hero content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm mb-8"
          >
            <span
              className="w-2 h-2 rounded-full bg-primary animate-[pulse-glow_2s_ease-in-out_infinite]"
              aria-hidden="true"
            />
            Privacy-first Discord alternative
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
          >
            <span className="text-white">Switching from Discord?</span>
            <br />
            <span className="bg-linear-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Here&apos;s how easy it is.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Import your channels, invite your community, and start chatting on a
            platform that never asks for your ID, never scans your face, and
            never sells your data.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-primary text-white font-semibold text-lg transition-all hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] min-h-[44px] touch-manipulation"
            >
              Start Migration
            </Link>
            <a
              href="#why-switch"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-white/20 text-white font-semibold text-lg transition-all hover:bg-white/5 min-h-[44px] touch-manipulation"
            >
              Learn More
              <ChevronDown className="ml-2 w-4 h-4" />
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400"
          >
            <span className="flex items-center gap-2">
              <LockIcon className="w-4 h-4 text-accent" />
              End-to-end encrypted
            </span>
            <span className="flex items-center gap-2">
              <ShieldIcon className="w-4 h-4 text-accent" />
              COPPA compliant
            </span>
            <span className="flex items-center gap-2">
              <BoltIcon className="w-4 h-4 text-accent" />
              Under 100MB RAM
            </span>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{
          opacity: { delay: 1, duration: 0.5 },
          y: { repeat: Infinity, duration: 2, ease: "easeInOut" },
        }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        aria-hidden="true"
      >
        <ChevronDown className="w-6 h-6 text-gray-500" />
      </motion.div>
    </section>
  );
}

function WhySwitchSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="why-switch" className="py-20 md:py-28 px-6" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Why communities are switching
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            It&apos;s not just about features. It&apos;s about values.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {whySwitchCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="glass-card rounded-2xl p-8 border border-white/10"
            >
              <div className="text-4xl mb-4" aria-hidden="true">
                {card.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {card.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {card.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-20 md:py-28 px-6" ref={ref}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Side by side
          </h2>
          <p className="text-gray-400 text-lg">
            See how the platforms compare on what matters most.
          </p>
        </motion.div>

        {/* Desktop table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="hidden md:block glass-card rounded-2xl overflow-hidden border border-white/10"
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">
                  Feature
                </th>
                <th className="text-center py-4 px-6 text-gray-400 font-medium text-sm">
                  Discord
                </th>
                <th className="text-center py-4 px-6 text-gray-400 font-medium text-sm">
                  Bedrock Chat
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, i) => (
                <tr
                  key={row.feature}
                  className={
                    i < comparisonData.length - 1
                      ? "border-b border-white/5"
                      : ""
                  }
                >
                  <td className="py-4 px-6 text-white font-medium">
                    {row.feature}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span
                      className={
                        row.discord.negative
                          ? "text-red-400"
                          : "text-gray-400"
                      }
                    >
                      {row.discord.text}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span
                      className={
                        row.bedrock.positive
                          ? "text-emerald-400"
                          : "text-gray-400"
                      }
                    >
                      {row.bedrock.text}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {comparisonData.map((row, i) => (
            <motion.div
              key={row.feature}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="glass-card rounded-xl p-4 border border-white/10"
            >
              <p className="text-white font-medium text-sm mb-3">
                {row.feature}
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500 text-xs block mb-1">
                    Discord
                  </span>
                  <p
                    className={
                      row.discord.negative ? "text-red-400" : "text-gray-400"
                    }
                  >
                    {row.discord.text}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs block mb-1">
                    Bedrock
                  </span>
                  <p
                    className={
                      row.bedrock.positive
                        ? "text-emerald-400"
                        : "text-gray-400"
                    }
                  >
                    {row.bedrock.text}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Source footnote */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-xs text-gray-500 mt-6 text-center leading-relaxed"
        >
          Claims verified as of March 2026. Sources:{" "}
          <a
            href="https://discord.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-400 transition-colors"
          >
            Discord Privacy Policy
          </a>
          {", "}
          <a
            href="https://discord.com/safety"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-400 transition-colors"
          >
            Discord Safety Center
          </a>
          .
        </motion.p>
      </div>
    </section>
  );
}

function MigrationStepsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-20 md:py-28 px-6" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Three steps. That&apos;s it.
          </h2>
          <p className="text-gray-400 text-lg">
            No complicated setup. No week-long migration process.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 mb-12">
          {migrationSteps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.2 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/15 border border-primary/30 text-primary text-xl font-bold mb-6">
                {step.number}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {step.title}
              </h3>
              <p className="text-gray-400 leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Connecting line (desktop only) */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="hidden md:block h-px bg-linear-to-r from-transparent via-primary/30 to-transparent max-w-2xl mx-auto -mt-[calc(theme(spacing.12)+theme(spacing.6)+28px+theme(spacing.6))] mb-[calc(theme(spacing.6)+theme(spacing.6)+28px+theme(spacing.6)+theme(spacing.12))]"
          style={{ transformOrigin: "left" }}
          aria-hidden="true"
        />

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center"
        >
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-primary text-white font-semibold text-lg transition-all hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] min-h-[44px] touch-manipulation"
          >
            Start Your Migration
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function FAQSection({ items }: { items: FAQItem[] }) {
  return (
    <section className="py-20 md:py-28 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
          Common questions
        </h2>
        <p className="text-gray-400 text-lg text-center mb-12">
          Everything you need to know about making the switch.
        </p>

        <div className="space-y-3">
          {items.map((item) => (
            <details
              key={item.question}
              className="group glass-card rounded-xl border border-white/10 overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer text-white font-medium list-none [&::-webkit-details-marker]:hidden select-none min-h-[44px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[-2px] rounded-xl">
                <span>{item.question}</span>
                <ChevronDown className="w-5 h-5 shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="px-6 pb-5 text-gray-400 leading-relaxed">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-20 md:py-28 px-6 relative overflow-hidden" ref={ref}>
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-primary/10 blur-[128px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-3xl mx-auto text-center"
      >
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          Ready to own your community?
        </h2>
        <p className="text-lg text-gray-300 mb-10 max-w-xl mx-auto leading-relaxed">
          Your conversations. Your rules. Your community, on a platform that
          puts people over profit.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-primary text-white font-semibold text-lg transition-all hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] min-h-[44px] touch-manipulation"
          >
            Start Migration
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-white/20 text-white font-semibold text-lg transition-all hover:bg-white/5 min-h-[44px] touch-manipulation"
          >
            Create Account First
          </Link>
        </div>

        <p className="text-sm text-gray-500">
          Join the communities already making the switch.
        </p>
      </motion.div>
    </section>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function SwitchContent({ faqItems }: { faqItems: FAQItem[] }) {
  return (
    <main className="min-h-screen bg-background-dark text-white overflow-x-hidden scroll-smooth">
      <HeroSection />
      <WhySwitchSection />
      <ComparisonSection />
      <MigrationStepsSection />
      <FAQSection items={faqItems} />
      <CTASection />

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-white font-semibold hover:text-primary transition-colors"
            >
              Bedrock Chat
            </Link>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
          <nav
            className="flex items-center gap-6"
            aria-label="Footer navigation"
          >
            <Link
              href="/privacy-policy"
              className="hover:text-gray-300 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms-of-service"
              className="hover:text-gray-300 transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/"
              className="hover:text-gray-300 transition-colors"
            >
              Home
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
