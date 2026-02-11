/**
 * Animation utilities using Motion 12.x (motion/react)
 * 2026 best practices - no unnecessary useMemo/useCallback
 */

import type { Transition, Variant } from "motion/react";

/**
 * Standard easing curves
 */
export const easings = {
  easeOut: [0.4, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  spring: { type: "spring", stiffness: 300, damping: 30 },
  springBouncy: { type: "spring", stiffness: 400, damping: 20 },
  springSoft: { type: "spring", stiffness: 200, damping: 25 },
} as const;

/**
 * Duration presets (in seconds)
 */
export const durations = {
  fast: 0.15,
  base: 0.2,
  slow: 0.3,
  slower: 0.5,
} as const;

/**
 * Fade in animation variants
 */
export const fadeIn: Record<string, Variant> = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
};

/**
 * Slide up animation variants
 */
export const slideUp: Record<string, Variant> = {
  initial: {
    y: 10,
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
  },
  exit: {
    y: -10,
    opacity: 0,
  },
};

/**
 * Slide down animation variants
 */
export const slideDown: Record<string, Variant> = {
  initial: {
    y: -10,
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
  },
  exit: {
    y: 10,
    opacity: 0,
  },
};

/**
 * Scale in animation variants
 */
export const scaleIn: Record<string, Variant> = {
  initial: {
    scale: 0.95,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
  },
  exit: {
    scale: 0.95,
    opacity: 0,
  },
};

/**
 * Slide from left animation variants
 */
export const slideLeft: Record<string, Variant> = {
  initial: {
    x: -20,
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
  },
  exit: {
    x: -20,
    opacity: 0,
  },
};

/**
 * Slide from right animation variants
 */
export const slideRight: Record<string, Variant> = {
  initial: {
    x: 20,
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
  },
  exit: {
    x: 20,
    opacity: 0,
  },
};

/**
 * Glass reveal animation (for glass components)
 */
export const glassReveal: Record<string, Variant> = {
  initial: {
    opacity: 0,
    backdropFilter: "blur(0px)",
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    backdropFilter: "blur(8px)",
    scale: 1,
  },
  exit: {
    opacity: 0,
    backdropFilter: "blur(0px)",
    scale: 0.98,
  },
};

/**
 * Stagger children animation
 */
export const staggerContainer: Record<string, Variant> = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

/**
 * Stagger child item
 */
export const staggerItem: Record<string, Variant> = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: 10,
  },
};

/**
 * Create a fade in transition with custom duration
 */
export function createFadeTransition(
  duration: number = durations.base
): Transition {
  return {
    duration,
    ease: easings.easeOut as [number, number, number, number],
  };
}

/**
 * Create a spring transition with custom settings
 */
export function createSpringTransition(
  stiffness = 300,
  damping = 30
): Transition {
  return {
    type: "spring",
    stiffness,
    damping,
  };
}

/**
 * Create a slide transition with custom direction and duration
 */
export function createSlideTransition(
  direction: "up" | "down" | "left" | "right" = "up",
  duration = durations.base
): Record<string, Variant> {
  const axis = direction === "left" || direction === "right" ? "x" : "y";
  const value = direction === "down" || direction === "right" ? 10 : -10;

  return {
    initial: {
      [axis]: value,
      opacity: 0,
    } as Variant,
    animate: {
      [axis]: 0,
      opacity: 1,
      transition: createFadeTransition(duration),
    } as Variant,
    exit: {
      [axis]: -value,
      opacity: 0,
      transition: createFadeTransition(duration),
    } as Variant,
  };
}

/**
 * Hover scale effect
 */
export const hoverScale = {
  scale: 1.02,
  transition: createSpringTransition(400, 25),
};

/**
 * Tap scale effect
 */
export const tapScale = {
  scale: 0.98,
};

/**
 * Hover brightness effect (for glass components)
 */
export const hoverBrightness = {
  filter: "brightness(1.05)",
  transition: createFadeTransition(durations.fast as number),
};

/**
 * Default page transition
 */
export const pageTransition: Record<string, Variant> = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: createFadeTransition(durations.slow as number),
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: createFadeTransition(durations.base as number),
  },
};

/**
 * Modal animation variants
 */
export const modalVariants: Record<string, Variant> = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: createSpringTransition(400, 30),
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: createFadeTransition(durations.base),
  },
};

/**
 * Backdrop overlay animation
 */
export const backdropVariants: Record<string, Variant> = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: createFadeTransition(durations.base),
  },
  exit: {
    opacity: 0,
    transition: createFadeTransition(durations.base),
  },
};
