/**
 * In-app dismissible banner promoting PWA install or desktop app download.
 *
 * Context behaviour:
 * - browser: shows "Get the PWA" or "Download Desktop App" CTA
 * - pwa: shows "Upgrade to Desktop App" CTA
 * - tauri: renders null
 *
 * Dismissible with 30-day suppression via localStorage.
 */
"use client";

import {
  useClientContext,
  usePWAInstallPrompt,
} from "@/lib/client-detection";
import { cn } from "@/lib/utils/cn";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "bedrock_download_banner_dismissed";
const SUPPRESS_DAYS = 30;

function isDismissed(): boolean {
  if (typeof localStorage === "undefined") return false;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < SUPPRESS_DAYS * 24 * 60 * 60 * 1000;
}

function dismiss() {
  localStorage.setItem(STORAGE_KEY, String(Date.now()));
}

export function DownloadBanner() {
  const ctx = useClientContext();
  const { canPrompt, promptInstall } = usePWAInstallPrompt();
  const prefersReducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (ctx === "tauri" || ctx === "ssr") return;
    if (isDismissed()) return;
    setVisible(true);
  }, [ctx]);

  const handleDismiss = () => {
    dismiss();
    setVisible(false);
  };

  if (ctx === "tauri" || ctx === "ssr") return null;

  const animProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: -8 } as const,
        animate: { opacity: 1, y: 0 } as const,
        exit: { opacity: 0, y: -8 } as const,
        transition: { type: "spring" as const, stiffness: 300, damping: 30 },
      };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          {...animProps}
          className={cn(
            "rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl",
            "px-4 py-3 flex items-center justify-between gap-3"
          )}
          role="status"
          aria-label="App installation suggestion"
        >
          <p className="text-sm text-slate-300 min-w-0">
            {ctx === "pwa"
              ? "Upgrade to the Desktop App for game overlays, system tray & more."
              : "Get the full Bedrock Chat experience — install the web app or desktop client."}
          </p>

          <div className="flex items-center gap-2 shrink-0">
            {ctx === "browser" && canPrompt && (
              <button
                type="button"
                onClick={promptInstall}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold",
                  "bg-primary text-white hover:bg-primary/90 transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                )}
              >
                Install PWA
              </button>
            )}

            <Link
              href="/download"
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold",
                "border border-white/10 text-slate-300 hover:bg-white/10 transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              )}
            >
              {ctx === "pwa" ? "Get Desktop App" : "All options"}
            </Link>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss download banner"
              className={cn(
                "rounded-lg p-1.5 text-slate-500 hover:text-slate-300 transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              )}
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
