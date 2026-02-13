"use client";

import { Glass } from "@/components/ui/glass";
import {
  ShieldOff,
  Eye,
  Database,
  Scale,
} from "lucide-react";
import { motion, useInView } from "motion/react";
import { useRef, type ReactNode } from "react";

interface TrustSignal {
  icon: ReactNode;
  title: string;
  description: string;
  highlight: string;
}

const trustSignals: TrustSignal[] = [
  {
    icon: <ShieldOff className="w-8 h-8" />,
    title: "No Government ID Required",
    description:
      "While Discord now demands government-issued identification to verify age, we believe your identity is yours to protect. Create an account with just an email.",
    highlight: "Your identity stays private",
  },
  {
    icon: <Eye className="w-8 h-8" />,
    title: "Transparent Monitoring",
    description:
      "Your kids know they're being monitored. That's the entire point. No hidden surveillance, no secret data collection. Parents and children agree on the monitoring level together.",
    highlight: "Consent-based oversight",
  },
  {
    icon: <Database className="w-8 h-8" />,
    title: "You Own Your Data",
    description:
      "Export everything, anytime. We don't sell, mine, or monetize your conversations. When you delete your account, your data is gone. Actually gone.",
    highlight: "Full data portability",
  },
  {
    icon: <Scale className="w-8 h-8" />,
    title: "Compliance From Day One",
    description:
      "COPPA, GDPR, and CCPA compliant by design, not by afterthought. We built the legal framework into the architecture, not bolted it on after a scandal.",
    highlight: "Built-in compliance",
  },
];

function TrustCard({
  signal,
  index,
  reversed,
}: {
  signal: TrustSignal;
  index: number;
  reversed: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className={`flex flex-col md:flex-row items-center gap-8 ${
        reversed ? "md:flex-row-reverse" : ""
      }`}
      initial={{ opacity: 0, x: reversed ? 40 : -40 }}
      animate={
        isInView
          ? { opacity: 1, x: 0 }
          : { opacity: 0, x: reversed ? 40 : -40 }
      }
      transition={{
        duration: 0.7,
        delay: index * 0.1,
        ease: "easeOut",
      }}
    >
      {/* Icon block */}
      <div className="flex-shrink-0">
        <Glass
          variant="liquid"
          border="liquid"
          className="w-20 h-20 flex items-center justify-center rounded-2xl"
        >
          <span className="text-primary">{signal.icon}</span>
        </Glass>
      </div>

      {/* Content */}
      <div className="flex-1 text-center md:text-left">
        <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-accent/10 text-accent border border-accent/20 mb-3">
          {signal.highlight}
        </span>
        <h3 className="text-2xl font-bold text-white mb-2">{signal.title}</h3>
        <p className="text-gray-400 leading-relaxed">{signal.description}</p>
      </div>
    </motion.div>
  );
}

export function TrustSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="py-24 px-6 bg-gradient-to-b from-background-dark/95 to-background-dark"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Trust, Not Surveillance
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            We believe safety and privacy aren't opposites. Here's how we
            prove it.
          </p>
        </motion.div>

        <div className="space-y-16">
          {trustSignals.map((signal, index) => (
            <TrustCard
              key={signal.title}
              signal={signal}
              index={index}
              reversed={index % 2 !== 0}
            />
          ))}
        </div>

        {/* Compliance badges */}
        <motion.div
          className="mt-20 flex flex-wrap justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {["COPPA", "GDPR", "CCPA", "SOC 2"].map((badge) => (
            <Glass
              key={badge}
              variant="medium"
              border="light"
              className="px-5 py-2.5 rounded-full"
            >
              <span className="text-sm font-semibold text-white/80">
                {badge}
              </span>
            </Glass>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
