/**
 * /download — Public install-choice page (pre-auth).
 *
 * Detects client context (browser / PWA / Tauri) and presents the
 * appropriate installation options: PWA install and/or Tauri desktop app.
 *
 * Privacy: no analytics, no third-party scripts, COPPA-safe.
 */
"use client";

import {
  useClientContext,
  usePWAInstallPrompt,
  getPlatformDownload,
} from "@/lib/client-detection";
import type { PlatformDownload } from "@/lib/client-detection";
import { cn } from "@/lib/utils/cn";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";

/* -------------------------------------------------------------------------- */
/*  Icons (inline SVGs — no external assets)                                  */
/* -------------------------------------------------------------------------- */

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" />
    </svg>
  );
}

function DesktopIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Feature list item                                                          */
/* -------------------------------------------------------------------------- */

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm text-slate-300">
      <CheckIcon className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
      <span>{children}</span>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/*  PWA Install Card                                                           */
/* -------------------------------------------------------------------------- */

function PWACard({
  compact,
  canPrompt,
  isInstalled,
  recommended,
  onInstall,
}: {
  compact?: boolean;
  canPrompt: boolean;
  isInstalled: boolean;
  recommended?: boolean;
  onInstall: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-6 backdrop-blur-xl relative overflow-hidden",
        "border-white/10 bg-white/5",
        compact ? "col-span-full" : "flex-1 min-w-0"
      )}
    >
      {recommended && !isInstalled && (
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center rounded-full bg-green-500/20 border border-green-500/30 px-3 py-1 text-xs font-semibold text-green-400">
            RECOMMENDED
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15 text-primary">
          <GlobeIcon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Web App (PWA)</h2>
          <p className="text-xs text-slate-400">Instant, no download required</p>
        </div>
      </div>

      {isInstalled ? (
        <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-2.5 text-sm text-green-300">
          You have the web app installed
        </div>
      ) : (
        <>
          <ul className="space-y-2 mb-6">
            <Feature>Auto-updates — always the latest version</Feature>
            <Feature>Works offline with cached data</Feature>
            <Feature>0 MB download — runs in your browser</Feature>
            <Feature>Available on any device with a browser</Feature>
          </ul>

          {canPrompt ? (
            <button
              type="button"
              onClick={onInstall}
              className={cn(
                "w-full rounded-xl px-6 py-3 text-sm font-semibold",
                "bg-primary text-white",
                "hover:bg-primary/90 active:scale-[0.98]",
                "transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              )}
            >
              Install Web App
            </button>
          ) : (
            <p className="text-xs text-slate-500 text-center">
              Open this page in a supported browser (Chrome, Edge) to install.
            </p>
          )}
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Desktop App Card                                                           */
/* -------------------------------------------------------------------------- */

function DesktopCard({
  platform,
  compact,
}: {
  platform: PlatformDownload | null;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-6 backdrop-blur-xl relative overflow-hidden",
        "border-primary/20 bg-white/[0.07]",
        compact ? "col-span-full" : "flex-1 min-w-0"
      )}
    >
      {/* Coming soon badge */}
      <div className="absolute top-4 right-4">
        <span className="inline-flex items-center rounded-full bg-primary/20 border border-primary/30 px-3 py-1 text-xs font-semibold text-primary">
          COMING SOON
        </span>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15 text-primary">
          <DesktopIcon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Desktop App</h2>
          <p className="text-xs text-slate-400">
            Full power, Discord-like experience
          </p>
        </div>
      </div>

      <ul className="space-y-2 mb-6">
        <Feature>Activity sharing with friends</Feature>
        <Feature>Game overlays &amp; performance HUD</Feature>
        <Feature>System tray &amp; native notifications</Feature>
        <Feature>Hardware-accelerated rendering</Feature>
      </ul>

      {platform ? (
        <div
          className={cn(
            "w-full rounded-xl px-6 py-3 text-sm font-semibold text-center",
            "bg-white/10 text-slate-400 cursor-default",
            "border border-white/10"
          )}
          aria-disabled="true"
        >
          Download for {platform.label} ({platform.extension}) — coming soon
        </div>
      ) : (
        <div
          className={cn(
            "w-full rounded-xl px-6 py-3 text-sm text-center",
            "bg-white/10 text-slate-400 border border-white/10"
          )}
        >
          Desktop downloads coming soon
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tauri "already installed" view                                             */
/* -------------------------------------------------------------------------- */

function TauriInstalledView() {
  return (
    <div className="rounded-2xl border border-green-500/20 bg-green-500/5 backdrop-blur-xl p-8 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-500/15 text-green-400 mb-4">
        <CheckIcon className="w-7 h-7" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">
        You have the full desktop app
      </h2>
      <p className="text-sm text-slate-400 mb-4">
        You&apos;re running Bedrock Chat as a native desktop application.
      </p>
      <p className="text-xs text-slate-500">
        Version info will appear here in a future update.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page component                                                             */
/* -------------------------------------------------------------------------- */

export default function DownloadPage() {
  const ctx = useClientContext();
  const { canPrompt, promptInstall, isInstalled } = usePWAInstallPrompt();
  const [platform, setPlatform] = useState<PlatformDownload | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setPlatform(getPlatformDownload());
  }, []);

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 } as const,
        animate: { opacity: 1, y: 0 } as const,
        transition: { duration: 0.5, ease: "easeOut" as const },
      };

  const staggerDelay = (i: number) =>
    prefersReducedMotion ? {} : { transition: { delay: 0.1 * i, duration: 0.5, ease: "easeOut" as const } };

  return (
    <div className="min-h-screen bg-[#0D1117] text-white">
        {/* Header */}
        <header className="border-b border-white/5">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="text-lg font-bold text-white hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-primary"
            >
              Bedrock Chat
            </Link>
            <Link
              href="/privacy-policy"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors focus-visible:outline-2 focus-visible:outline-primary"
            >
              Privacy Policy
            </Link>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-5xl mx-auto px-6 py-16">
          <motion.div className="text-center mb-12" {...motionProps}>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Get Bedrock Chat
            </h1>
            <p className="text-slate-400 max-w-lg mx-auto">
              Choose how you want to use Bedrock Chat. Both options keep your
              data private — no tracking, no ads.
            </p>
          </motion.div>

          {/* Context-specific content */}
          {ctx === "tauri" ? (
            <motion.div {...motionProps} {...staggerDelay(1)}>
              <TauriInstalledView />
            </motion.div>
          ) : (
            <div className="flex flex-col md:flex-row gap-6">
              {/* PWA card — compact when already in PWA context */}
              <motion.div
                className={cn(
                  ctx === "pwa" ? "md:w-full order-2" : "flex-1 min-w-0"
                )}
                {...motionProps}
                {...staggerDelay(1)}
              >
                <PWACard
                  compact={ctx === "pwa"}
                  canPrompt={canPrompt}
                  isInstalled={isInstalled || ctx === "pwa"}
                  recommended={ctx === "browser"}
                  onInstall={promptInstall}
                />
              </motion.div>

              {/* Desktop app card — prominent in PWA context */}
              <motion.div
                className={cn(
                  ctx === "pwa" ? "md:w-full order-1" : "flex-1 min-w-0"
                )}
                {...motionProps}
                {...staggerDelay(2)}
              >
                <DesktopCard platform={platform} compact={ctx === "pwa"} />
              </motion.div>
            </div>
          )}

          {/* "Already have the app?" link */}
          {ctx === "browser" && (
            <motion.div
              className="mt-12 text-center"
              {...motionProps}
              {...staggerDelay(3)}
            >
              <p className="text-sm text-slate-500 mb-2">
                Already have the app?
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors focus-visible:outline-2 focus-visible:outline-primary"
              >
                Open Bedrock Chat
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </motion.div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/5 mt-auto">
          <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>&copy; {new Date().getFullYear()} Bedrock Chat</p>
            <div className="flex gap-4">
              <Link
                href="/privacy-policy"
                className="hover:text-slate-300 transition-colors focus-visible:outline-2 focus-visible:outline-primary"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-of-service"
                className="hover:text-slate-300 transition-colors focus-visible:outline-2 focus-visible:outline-primary"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </footer>
    </div>
  );
}
