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
      className="w-6 h-6 text-green-500"
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
      className="w-6 h-6 text-red-500"
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

export function ComparisonTable() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="py-24 px-6 bg-gradient-to-b from-background-dark/95 to-background-dark"
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

        <motion.div
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
      </div>
    </section>
  );
}
