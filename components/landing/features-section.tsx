"use client";

import { Glass } from "@/components/ui/glass";
import {
  Shield,
  Users,
  Zap,
  Gamepad2,
  Code2,
  Baby,
} from "lucide-react";
import { motion, type Variants } from "motion/react";
import { useRef, useState, type ReactNode, type MouseEvent } from "react";

interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
  accent: string; // accent color class for icon
}

const features: Feature[] = [
  {
    icon: <Shield className="w-10 h-10" />,
    title: "True Privacy",
    description:
      "End-to-end encryption by default. Zero-knowledge architecture means we can't read your messages even if we wanted to.",
    accent: "text-primary",
  },
  {
    icon: <Users className="w-10 h-10" />,
    title: "Family Accounts",
    description:
      "Four monitoring levels: Full Visibility, Activity Summary, Alerts Only, and Independent. Parents choose, kids know.",
    accent: "text-secondary",
  },
  {
    icon: <Zap className="w-10 h-10" />,
    title: "Blazing Fast",
    description:
      "5x lighter than Discord. Under 50MB RAM. Your games won't even notice it's running in the background.",
    accent: "text-accent",
  },
  {
    icon: <Gamepad2 className="w-10 h-10" />,
    title: "Gaming Optimized",
    description:
      "Near-zero CPU overhead, no frame drops, and a minimal overlay that stays out of your way mid-game.",
    accent: "text-primary",
  },
  {
    icon: <Code2 className="w-10 h-10" />,
    title: "Open Source",
    description:
      "Fully auditable codebase. Every line of code is public. Trust isn't given, it's verified.",
    accent: "text-secondary",
  },
  {
    icon: <Baby className="w-10 h-10" />,
    title: "COPPA Compliant",
    description:
      "Built for families from day one. COPPA, GDPR, and CCPA compliant. No dark patterns, no tricks.",
    accent: "text-accent",
  },
];

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

function FeatureCard({ feature }: { feature: Feature }) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setRotateX(((y - centerY) / centerY) * -8);
    setRotateY(((x - centerX) / centerX) * 8);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      variants={cardVariants}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: "1000px" }}
    >
      <motion.div
        ref={ref}
        animate={{ rotateX, rotateY }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        style={{
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        <Glass
          variant="medium"
          border="light"
          className="p-8 h-full hover:border-primary/40 transition-colors duration-300"
        >
          <div className={`${feature.accent} mb-4`}>{feature.icon}</div>
          <h3 className="text-xl font-bold text-white mb-3">
            {feature.title}
          </h3>
          <p className="text-gray-400 leading-relaxed text-sm">
            {feature.description}
          </p>
        </Glass>
      </motion.div>
    </motion.div>
  );
}

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="py-24 px-6 bg-linear-to-b from-background-dark to-background-dark/95"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Why Bedrock Chat?
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Built from the ground up with privacy, performance, and families in
            mind.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
