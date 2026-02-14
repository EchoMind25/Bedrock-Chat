"use client";

import { Glass } from "@/components/ui/glass";
import { motion, useInView, useMotionValue, useTransform, animate } from "motion/react";
import { useRef, useEffect } from "react";

interface Stat {
  value: number;
  suffix: string;
  prefix?: string;
  label: string;
}

const stats: Stat[] = [
  { value: 10000, suffix: "+", label: "Families Protected" },
  { value: 50, suffix: "M+", label: "Messages Encrypted" },
  { value: 99.9, suffix: "%", label: "Uptime" },
  { prefix: "<", value: 50, suffix: "MB", label: "RAM Usage" },
];

interface Testimonial {
  quote: string;
  author: string;
  role: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      "Finally, a platform where I can let my kids chat with friends without worrying about who's watching. The transparency is everything.",
    author: "Sarah M.",
    role: "Parent of 3",
  },
  {
    quote:
      "Switched our gaming group from Discord after the ID mandate. Bedrock is faster, lighter, and doesn't ask for my passport.",
    author: "Alex K.",
    role: "Competitive Gamer",
  },
  {
    quote:
      "As a privacy researcher, I've audited the codebase. It's the real deal - zero-knowledge architecture done right.",
    author: "Dr. James L.",
    role: "Security Researcher",
  },
];

function AnimatedCounter({ stat, inView }: { stat: Stat; inView: boolean }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    if (stat.value % 1 !== 0) {
      // Decimal stat (like 99.9)
      return latest.toFixed(1);
    }
    return Math.round(latest).toLocaleString();
  });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, stat.value, {
      duration: 2,
      ease: "easeOut",
    });
    return controls.stop;
  }, [inView, count, stat.value]);

  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-bold text-white mb-2">
        <span className="text-primary">{stat.prefix}</span>
        <motion.span>{rounded}</motion.span>
        <span className="text-primary">{stat.suffix}</span>
      </div>
      <p className="text-gray-400 text-sm">{stat.label}</p>
    </div>
  );
}

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: Testimonial;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{
        duration: 0.6,
        delay: index * 0.15,
        ease: "easeOut",
      }}
    >
      <Glass
        variant="medium"
        border="light"
        className="p-6 h-full flex flex-col"
      >
        {/* Quote mark */}
        <svg
          className="w-8 h-8 text-primary/30 mb-4 shrink-0"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10H0z" />
        </svg>
        <p className="text-gray-300 leading-relaxed mb-6 flex-1 italic">
          &ldquo;{testimonial.quote}&rdquo;
        </p>
        <div className="flex items-center gap-3">
          {/* Avatar placeholder */}
          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">
              {testimonial.author[0]}
            </span>
          </div>
          <div>
            <p className="text-white text-sm font-medium">
              {testimonial.author}
            </p>
            <p className="text-gray-500 text-xs">{testimonial.role}</p>
          </div>
        </div>
      </Glass>
    </motion.div>
  );
}

export function SocialProofSection() {
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-80px" });

  const sectionRef = useRef<HTMLDivElement>(null);
  const sectionInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      ref={sectionRef}
      className="py-24 px-6 bg-linear-to-b from-background-dark to-background-dark/95"
    >
      <div className="max-w-7xl mx-auto">
        {/* Stats */}
        <motion.div
          ref={statsRef}
          className="mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={
            statsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
          }
          transition={{ duration: 0.6 }}
        >
          <Glass
            variant="liquid"
            border="liquid"
            className="p-10 rounded-2xl"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <AnimatedCounter
                  key={stat.label}
                  stat={stat}
                  inView={statsInView}
                />
              ))}
            </div>
          </Glass>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={
            sectionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
          }
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Trusted by Families, Gamers, and Privacy Advocates
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Hear from people who made the switch.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.author}
              testimonial={testimonial}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
