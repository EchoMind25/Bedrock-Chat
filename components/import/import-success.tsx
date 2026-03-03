"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { useImportStore } from "@/store/import.store";
import { useRouter } from "next/navigation";
import { useServerStore } from "@/store/server.store";
import { useServerManagementStore } from "@/store/server-management.store";

const spring = { type: "spring" as const, stiffness: 260, damping: 20, mass: 1 };

// ---------------------------------------------------------------------------
// Confetti particle component
// ---------------------------------------------------------------------------

function ConfettiParticle({ index }: { index: number }) {
  const style = useMemo(() => {
    const hue = (index * 47) % 360;
    const left = `${(index * 17) % 100}%`;
    const delay = (index * 0.08) % 1.5;
    const duration = 2 + (index % 3) * 0.5;
    return { hue, left, delay, duration };
  }, [index]);

  return (
    <motion.div
      className="absolute w-2 h-2 rounded-sm"
      style={{
        backgroundColor: `oklch(0.75 0.2 ${style.hue})`,
        left: style.left,
        top: "-8px",
      }}
      initial={{ y: 0, opacity: 1, rotate: 0 }}
      animate={{
        y: [0, 400 + Math.random() * 200],
        opacity: [1, 1, 0],
        rotate: [0, 360 + Math.random() * 720],
        x: [0, (Math.random() - 0.5) * 200],
      }}
      transition={{
        duration: style.duration,
        delay: style.delay,
        ease: "easeOut",
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Feature highlights for new users migrating from Discord
// ---------------------------------------------------------------------------

const FEATURES = [
  {
    title: "Privacy Dashboard",
    description: "See exactly what data we store and control it completely.",
  },
  {
    title: "Family Safety",
    description: "Built-in parental controls, content filtering, and monitoring.",
  },
  {
    title: "No Tracking",
    description: "We don't sell your data or track your behavior across the web.",
  },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ImportSuccess() {
  const createdServerId = useImportStore((s) => s.createdServerId);
  const serverName = useImportStore((s) => s.serverName);
  const reset = useImportStore((s) => s.reset);
  const router = useRouter();
  const setCurrentServer = useServerStore((s) => s.setCurrentServer);
  const servers = useServerStore((s) => s.servers);

  // Find the first channel of the created server for navigation
  const firstChannelId = useMemo(() => {
    if (!createdServerId) return null;
    const server = servers.find((s) => s.id === createdServerId);
    if (!server || !server.channels || server.channels.length === 0) return null;
    const textChannels = server.channels.filter(
      (ch) => ch.type === "text" || ch.type === "announcement",
    );
    return textChannels[0]?.id ?? server.channels[0]?.id ?? null;
  }, [createdServerId, servers]);

  const handleGoToServer = () => {
    if (createdServerId && firstChannelId) {
      setCurrentServer(createdServerId);
      reset();
      router.push(`/servers/${createdServerId}/${firstChannelId}`);
    }
  };

  return (
    <div className="relative text-center py-8 space-y-8 overflow-hidden">
      {/* Confetti */}
      <div className="absolute inset-x-0 top-0 h-full pointer-events-none overflow-hidden">
        {Array.from({ length: 30 }, (_, i) => (
          <ConfettiParticle key={i} index={i} />
        ))}
      </div>

      {/* Success icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ ...spring, delay: 0.2 }}
        className="relative z-10"
      >
        <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
          <motion.svg
            className="w-10 h-10 text-green-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
          >
            <motion.path
              d="M5 13l4 4L19 7"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
            />
          </motion.svg>
        </div>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.3 }}
        className="relative z-10 space-y-2"
      >
        <h1 className="text-2xl font-bold text-white">
          Your server is ready!
        </h1>
        <p className="text-white/50">
          <span className="font-medium text-white/80">{serverName || "Your server"}</span>{" "}
          has been created on Bedrock.
        </p>
      </motion.div>

      {/* CTA buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.5 }}
        className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3"
      >
        <motion.button
          type="button"
          onClick={handleGoToServer}
          className="px-6 py-3 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors min-h-[44px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={spring}
        >
          Go to Server
        </motion.button>
        <motion.button
          type="button"
          onClick={() => {
            if (createdServerId && firstChannelId) {
              setCurrentServer(createdServerId);
              reset();
              useServerManagementStore.getState().openServerSettings("migration");
              router.push(`/servers/${createdServerId}/${firstChannelId}`);
            }
          }}
          className="px-6 py-3 text-sm font-medium rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors min-h-[44px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={spring}
        >
          Set Up Migration Invites
        </motion.button>
        <motion.button
          type="button"
          onClick={() => {
            reset();
            router.push("/servers/import");
          }}
          className="px-6 py-3 text-sm font-medium rounded-lg border border-white/10 text-white/70 hover:bg-white/5 transition-colors min-h-[44px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={spring}
        >
          Import Another Server
        </motion.button>
      </motion.div>

      {/* Feature highlights */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.7 }}
        className="relative z-10 pt-6 border-t border-white/10"
      >
        <h3 className="text-sm font-medium text-white/50 mb-4">
          Welcome to Bedrock — here&apos;s what&apos;s different
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="p-4 rounded-lg bg-white/5 border border-white/10 text-left"
            >
              <h4 className="text-sm font-medium text-white mb-1">
                {feature.title}
              </h4>
              <p className="text-xs text-white/40">{feature.description}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
