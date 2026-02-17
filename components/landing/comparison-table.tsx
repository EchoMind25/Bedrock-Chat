"use client";

import { Glass } from "@/components/ui/glass";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

interface ComparisonRow {
  feature: string;
  discord: {
    value: string;
    isPositive: boolean;
  };
  bedrock: {
    value: string;
    isPositive: boolean;
  };
}

const comparisonData: ComparisonRow[] = [
  {
    feature: "Privacy",
    discord: { value: "Tracks everything", isPositive: false },
    bedrock: { value: "Zero tracking", isPositive: true },
  },
  {
    feature: "Performance",
    discord: { value: "300MB+ RAM", isPositive: false },
    bedrock: { value: "Under 50MB", isPositive: true },
  },
  {
    feature: "Family Controls",
    discord: { value: "Hidden monitoring", isPositive: false },
    bedrock: { value: "Transparent", isPositive: true },
  },
  {
    feature: "Data Ownership",
    discord: { value: "They own it", isPositive: false },
    bedrock: { value: "You own it", isPositive: true },
  },
  {
    feature: "Open Source",
    discord: { value: "Closed", isPositive: false },
    bedrock: { value: "Fully open", isPositive: true },
  },
];

function CheckIcon() {
  return (
    <motion.svg
      className="w-5 h-5 text-green-500 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      role="img"
      aria-label="Check mark"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
    >
      <motion.path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
    </motion.svg>
  );
}

function XIcon() {
  return (
    <motion.svg
      className="w-5 h-5 text-red-500 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      role="img"
      aria-label="X mark"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
    >
      <motion.path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
    </motion.svg>
  );
}

/* ── Desktop table row ── */
function ComparisonRowComponent({
  row,
  index,
}: {
  row: ComparisonRow;
  index: number;
}) {
  const ref = useRef<HTMLTableRowElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.tr
      ref={ref}
      className="border-b border-border-dark/20"
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
      }}
    >
      <td className="py-4 px-6 text-white font-medium">{row.feature}</td>
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          {row.discord.isPositive ? <CheckIcon /> : <XIcon />}
          <span className="text-gray-300">{row.discord.value}</span>
        </div>
      </td>
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          {row.bedrock.isPositive ? <CheckIcon /> : <XIcon />}
          <span className="text-white font-medium">{row.bedrock.value}</span>
        </div>
      </td>
    </motion.tr>
  );
}

/* ── Mobile card row ── */
function ComparisonCardComponent({
  row,
  index,
}: {
  row: ComparisonRow;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
      }}
    >
      <Glass variant="medium" border="light" className="p-4">
        <h3 className="text-white font-semibold text-base mb-3">
          {row.feature}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Discord column */}
          <div className="min-h-[44px] flex flex-col justify-center">
            <span className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
              Discord
            </span>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0">
                {row.discord.isPositive ? <CheckIcon /> : <XIcon />}
              </span>
              <span className="text-gray-300 text-sm min-w-0">
                {row.discord.value}
              </span>
            </div>
          </div>
          {/* Bedrock column */}
          <div className="min-h-[44px] flex flex-col justify-center border-l border-border-dark/20 pl-3">
            <span className="text-primary text-xs font-medium uppercase tracking-wide mb-1">
              Bedrock Chat
            </span>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0">
                {row.bedrock.isPositive ? <CheckIcon /> : <XIcon />}
              </span>
              <span className="text-white font-medium text-sm min-w-0">
                {row.bedrock.value}
              </span>
            </div>
          </div>
        </div>
      </Glass>
    </motion.div>
  );
}

export function ComparisonTable() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="py-24 px-6 bg-linear-to-b from-background-dark/95 to-background-dark"
    >
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Discord vs Bedrock Chat
          </h2>
          <p className="text-xl text-gray-400">
            See the difference that privacy-first design makes
          </p>
        </motion.div>

        {/* Desktop: table layout (md and up) */}
        <motion.div
          className="hidden md:block"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Glass variant="medium" border="light" className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-dark/30 bg-muted-dark/20">
                  <th className="py-4 px-6 text-left text-white font-semibold">
                    Feature
                  </th>
                  <th className="py-4 px-6 text-left text-gray-400 font-semibold">
                    Discord
                  </th>
                  <th className="py-4 px-6 text-left text-primary font-semibold">
                    Bedrock Chat
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <ComparisonRowComponent
                    key={row.feature}
                    row={row}
                    index={index}
                  />
                ))}
              </tbody>
            </table>
          </Glass>
        </motion.div>

        {/* Mobile: card layout (below md) */}
        <div className="md:hidden flex flex-col gap-3">
          {comparisonData.map((row, index) => (
            <ComparisonCardComponent
              key={row.feature}
              row={row}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
