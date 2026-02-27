"use client";

import { useEffect, useLayoutEffect, useState } from "react";

// On the server useLayoutEffect causes a warning, so fall back to useEffect.
// On the client, useLayoutEffect runs synchronously before paint, which prevents
// the flash of desktop UI that would otherwise appear on mobile before the media
// query resolves.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * SSR-safe media query hook
 * Returns false during SSR to prevent hydration mismatch.
 * On the client it resolves before the first paint (via useLayoutEffect)
 * so mobile and desktop layouts never flash-swap on initial render.
 *
 * @param query - Media query string (e.g., "(max-width: 768px)")
 * @returns boolean - Whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const mediaQuery = window.matchMedia(query);

    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }

    // Fallback for older browsers
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, [query]);

  return matches;
}

/**
 * Common breakpoint hooks for convenience
 */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 768px)");
}

export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 769px) and (max-width: 1024px)");
}

export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1025px)");
}
