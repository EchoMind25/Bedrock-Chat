"use client";

import { Glass } from "@/components/ui/glass";
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
} from "motion/react";
import { useRef, useEffect, useState } from "react";
import { Users, MessageSquare, Server, Cpu } from "lucide-react";

interface LiveStat {
  value: number | null;
  label: string;
  icon: typeof Users;
}

interface StaticStat {
  display: string;
  label: string;
  sublabel: string;
  icon: typeof Cpu;
}

type StatEntry =
  | { type: "live"; data: LiveStat }
  | { type: "static"; data: StaticStat };

const formatter = new Intl.NumberFormat("en-US");

function AnimatedCounter({
  value,
  inView,
}: {
  value: number;
  inView: boolean;
}) {
  const count = useMotionValue(0);
  const display = useTransform(count, (latest) =>
    formatter.format(Math.round(latest)),
  );

  useEffect(() => {
    if (!inView || value === 0) return;
    const controls = animate(count, value, {
      duration: 2,
      ease: "easeOut",
    });
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value]);

  return <motion.span>{display}</motion.span>;
}

function LiveStatCard({
  stat,
  inView,
}: {
  stat: LiveStat;
  inView: boolean;
}) {
  const Icon = stat.icon;

  return (
    <div className="text-center">
      <div className="flex justify-center mb-3">
        <Icon className="w-6 h-6 text-primary/70" />
      </div>
      <div className="text-4xl md:text-5xl font-bold text-white mb-2">
        {stat.value === null ? (
          <span className="text-white/40">&mdash;</span>
        ) : (
          <AnimatedCounter value={stat.value} inView={inView} />
        )}
      </div>
      <p className="text-gray-400 text-sm">{stat.label}</p>
    </div>
  );
}

function StaticStatCard({ stat }: { stat: StaticStat }) {
  const Icon = stat.icon;

  return (
    <div className="text-center">
      <div className="flex justify-center mb-3">
        <Icon className="w-6 h-6 text-primary/70" />
      </div>
      <div className="text-4xl md:text-5xl font-bold text-white mb-2">
        <span className="text-primary">&lt;</span>50
        <span className="text-primary">MB</span>
      </div>
      <p className="text-gray-400 text-sm">{stat.label}</p>
      <p className="text-gray-500 text-xs mt-1">{stat.sublabel}</p>
    </div>
  );
}

interface StatsData {
  users: number;
  messages: number;
  servers: number;
}

export function SocialProofSection() {
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-80px" });
  const [data, setData] = useState<StatsData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const res = await fetch("/api/stats");
        if (!res.ok) throw new Error("Failed to fetch");
        const json: StatsData = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError(true);
      }
    }

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats: StatEntry[] = [
    {
      type: "live",
      data: {
        value: error ? null : (data?.users ?? null),
        label: "Registered Users",
        icon: Users,
      },
    },
    {
      type: "live",
      data: {
        value: error ? null : (data?.messages ?? null),
        label: "Messages Sent",
        icon: MessageSquare,
      },
    },
    {
      type: "live",
      data: {
        value: error ? null : (data?.servers ?? null),
        label: "Servers Created",
        icon: Server,
      },
    },
    {
      type: "static",
      data: {
        display: "<50MB",
        label: "RAM Target",
        sublabel: "Engineered for gaming performance",
        icon: Cpu,
      },
    },
  ];

  return (
    <section className="py-24 px-6 bg-linear-to-b from-background-dark to-background-dark/95">
      <div className="max-w-7xl mx-auto">
        <motion.div
          ref={statsRef}
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
              {stats.map((entry) =>
                entry.type === "live" ? (
                  <LiveStatCard
                    key={entry.data.label}
                    stat={entry.data}
                    inView={statsInView}
                  />
                ) : (
                  <StaticStatCard
                    key={entry.data.label}
                    stat={entry.data}
                  />
                ),
              )}
            </div>
          </Glass>
        </motion.div>
      </div>
    </section>
  );
}
