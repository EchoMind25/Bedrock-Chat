/**
 * SSR-safe client context detection utilities for Bedrock Chat.
 *
 * Detects whether the app is running in a browser tab, as an installed PWA,
 * or inside the Tauri desktop shell. All detection runs client-side only
 * (behind `typeof window` guards or inside `useEffect`).
 *
 * @module lib/client-detection
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Possible runtime contexts for Bedrock Chat. */
export type ClientContext = "ssr" | "browser" | "pwa" | "tauri";

/**
 * Detect the current client context.
 * Must be called on the client only (inside useEffect or event handler).
 */
export function getClientContext(): ClientContext {
  if (typeof window === "undefined") return "ssr";

  if ("__TAURI__" in window) return "tauri";

  if (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as Record<string, unknown>).standalone === true
  ) {
    return "pwa";
  }

  return "browser";
}

/** Platform info for desktop downloads. */
export interface PlatformDownload {
  os: "windows" | "macos" | "linux";
  label: string;
  extension: string;
  url: string;
}

/**
 * Derive platform-specific download info from the user agent.
 * Returns `null` on the server or if the platform is unrecognised.
 */
export function getPlatformDownload(): PlatformDownload | null {
  if (typeof navigator === "undefined") return null;

  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes("win")) {
    return {
      os: "windows",
      label: "Windows",
      extension: ".exe",
      url: "/releases/bedrock-chat-latest-windows.exe",
    };
  }

  if (ua.includes("mac")) {
    return {
      os: "macos",
      label: "macOS",
      extension: ".dmg",
      url: "/releases/bedrock-chat-latest-macos.dmg",
    };
  }

  if (ua.includes("linux")) {
    return {
      os: "linux",
      label: "Linux",
      extension: ".AppImage",
      url: "/releases/bedrock-chat-latest-linux.AppImage",
    };
  }

  return null;
}

/**
 * Manage the `beforeinstallprompt` lifecycle for PWA installation.
 *
 * Returns:
 * - `canPrompt` – true when the browser has a deferred install prompt available
 * - `promptInstall` – call to trigger the native install dialog
 * - `isInstalled` – true after a successful install (or if already in standalone mode)
 */
export function usePWAInstallPrompt() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [canPrompt, setCanPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Already running as PWA or Tauri — nothing to prompt
    const ctx = getClientContext();
    if (ctx === "pwa" || ctx === "tauri") {
      setIsInstalled(true);
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setCanPrompt(true);
    };

    const onAppInstalled = () => {
      deferredPrompt.current = null;
      setCanPrompt(false);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    deferredPrompt.current = null;
    setCanPrompt(false);
  }, []);

  return { canPrompt, promptInstall, isInstalled };
}

/**
 * React hook that returns the detected client context after hydration.
 * Returns `"ssr"` during SSR / before mount to avoid hydration mismatches.
 */
export function useClientContext(): ClientContext {
  const [ctx, setCtx] = useState<ClientContext>("browser");

  useEffect(() => {
    setCtx(getClientContext());
  }, []);

  return ctx;
}

/* -------------------------------------------------------------------------- */
/*  Type augmentation for BeforeInstallPromptEvent (not in lib.dom.d.ts)       */
/* -------------------------------------------------------------------------- */

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}
