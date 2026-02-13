"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe media query hook
 * Returns false during SSR to prevent hydration mismatch
 * Updates after mount on client with actual media query result
 *
 * @param query - Media query string (e.g., "(max-width: 768px)")
 * @returns boolean - Whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Start with false during SSR to prevent hydration mismatch
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Modern browsers support matchMedia
    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Handler for changes
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Try modern addEventListener first, fallback to deprecated addListener
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
