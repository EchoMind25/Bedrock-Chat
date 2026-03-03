"use client";

import { motion } from "motion/react";
import Link from "next/link";
import type { InvitePreview } from "@/lib/types/invites";

const spring = {
  type: "spring" as const,
  stiffness: 260,
  damping: 25,
  mass: 1,
};

interface Props {
  preview: InvitePreview | null;
  code: string;
}

function ServerIcon({
  icon,
  name,
}: {
  icon: string | null;
  name: string;
}) {
  if (icon) {
    return (
      <img
        src={icon}
        alt={name}
        className="w-20 h-20 rounded-2xl object-cover"
      />
    );
  }

  // Fallback: first letter of server name
  const letter = name.charAt(0).toUpperCase();
  return (
    <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center text-3xl font-bold text-white/80">
      {letter}
    </div>
  );
}

function RoleBadge({
  name,
  color,
}: {
  name: string;
  color: string | null;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
      style={{
        backgroundColor: color
          ? `color-mix(in oklch, ${color} 20%, transparent)`
          : "oklch(0.5 0.15 265 / 0.2)",
        color: color || "oklch(0.8 0.15 265)",
        border: `1px solid ${color ? `color-mix(in oklch, ${color} 40%, transparent)` : "oklch(0.5 0.15 265 / 0.3)"}`,
      }}
    >
      <svg
        className="w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
      {name}
    </span>
  );
}

function InvalidInvite() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="text-center space-y-6"
    >
      <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-red-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Invite Not Found
        </h1>
        <p className="text-white/50 max-w-sm mx-auto">
          This invite link may have expired, been revoked, or the code is
          incorrect. Ask the server owner for a new invite.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 text-white/70 hover:bg-white/15 transition-colors text-sm font-medium min-h-[44px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary"
      >
        Go to Bedrock Chat
      </Link>
    </motion.div>
  );
}

function ExpiredInvite({ preview }: { preview: InvitePreview }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="text-center space-y-6"
    >
      <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-amber-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Invite Expired</h1>
        <p className="text-white/50 max-w-sm mx-auto">
          The invite to <span className="text-white/80 font-medium">{preview.serverName}</span> has
          expired or reached its maximum uses. Ask the server owner for a new invite link.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 text-white/70 hover:bg-white/15 transition-colors text-sm font-medium min-h-[44px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary"
      >
        Go to Bedrock Chat
      </Link>
    </motion.div>
  );
}

export function InviteLandingClient({ preview, code }: Props) {
  if (!preview) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[oklch(0.1_0.02_270)]">
        <InvalidInvite />
      </div>
    );
  }

  if (!preview.isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[oklch(0.1_0.02_270)]">
        <ExpiredInvite preview={preview} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[oklch(0.1_0.02_270)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={spring}
        className="w-full max-w-md space-y-8"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.1 }}
          className="text-center"
        >
          <p className="text-sm font-medium text-white/40 tracking-wider uppercase mb-1">
            Bedrock Chat
          </p>
          <h1 className="text-lg text-white/60">
            You&apos;ve been invited to join
          </h1>
        </motion.div>

        {/* Server card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.15 }}
          className="rounded-2xl p-6 space-y-4 border border-white/10"
          style={{
            backgroundColor: "oklch(0.15 0.02 270 / 0.8)",
            backdropFilter: "blur(16px)",
          }}
        >
          <div className="flex items-center gap-4">
            <ServerIcon icon={preview.serverIcon} name={preview.serverName} />
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-white truncate">
                {preview.serverName}
              </h2>
              <p className="text-sm text-white/40">
                {preview.memberCount.toLocaleString()}{" "}
                {preview.memberCount === 1 ? "member" : "members"} &middot;{" "}
                {preview.channelCount} {preview.channelCount === 1 ? "channel" : "channels"}
              </p>
            </div>
          </div>

          {/* Role badge */}
          {preview.mappedRoleName && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/50">Your role:</span>
              <RoleBadge
                name={preview.mappedRoleName}
                color={preview.mappedRoleColor}
              />
            </div>
          )}

          {/* Label */}
          {preview.label && (
            <p className="text-sm text-white/40 italic">
              {preview.label}
            </p>
          )}

          {/* Family account notice */}
          {preview.requiresFamilyAccount && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <svg
                className="w-4 h-4 text-amber-400 mt-0.5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p className="text-xs text-amber-300/80">
                This server requires a family account. A parent must create or
                approve your account before you can join.
              </p>
            </div>
          )}
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.25 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Link
            href={`/signup?invite=${code}`}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-white transition-colors min-h-[48px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary"
            style={{ backgroundColor: "oklch(0.55 0.25 265)" }}
          >
            Sign Up to Join
          </Link>
          <Link
            href={`/login?invite=${code}`}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-white/80 border border-white/15 hover:bg-white/5 transition-colors min-h-[48px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary"
          >
            I Have an Account
          </Link>
        </motion.div>

        {/* Privacy footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...spring, delay: 0.35 }}
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-white/30"
        >
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            No tracking
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Family safe
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
            You control your data
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
