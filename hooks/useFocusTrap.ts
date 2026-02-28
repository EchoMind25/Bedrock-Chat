"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Traps keyboard focus within a container element while `isActive` is true.
 * Restores focus to the previously focused element when deactivated.
 *
 * Usage:
 * ```tsx
 * const containerRef = useFocusTrap(isDrawerOpen);
 * return <div ref={containerRef} role="dialog" aria-modal="true">...</div>;
 * ```
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store the element that had focus before the trap activated.
    previousFocusRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    // Move focus into the container.
    first?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      // Restore focus to the element that was active before the trap.
      previousFocusRef.current?.focus();
    };
  }, [isActive]);

  return containerRef;
}
