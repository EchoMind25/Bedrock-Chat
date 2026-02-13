/**
 * Animation timeline constants and spring configs for the
 * immersive world-formation login sequence.
 */

import type { Transition, Variant } from "motion/react";

/** Stage timing in milliseconds */
export const INTRO_TIMELINE = {
	full: {
		stage1Start: 0,
		stage1End: 2000,
		stage2Start: 2000,
		stage2End: 5000,
		stage3Start: 5000,
		stage3End: 7000,
		total: 7000,
	},
	condensed: {
		stage1Start: 0,
		stage1End: 600,
		stage2Start: 600,
		stage2End: 1400,
		stage3Start: 1400,
		stage3End: 2000,
		total: 2000,
	},
	skip: {
		total: 0,
	},
} as const;

/** Spring configs for world formation elements */
export const worldSprings = {
	portalOpen: {
		type: "spring" as const,
		stiffness: 180,
		damping: 22,
	},
	formSlide: {
		type: "spring" as const,
		stiffness: 260,
		damping: 20,
	},
	environmentReveal: {
		type: "spring" as const,
		stiffness: 120,
		damping: 30,
	},
	particleSettle: {
		type: "spring" as const,
		stiffness: 300,
		damping: 25,
	},
} satisfies Record<string, Transition>;

/** Motion variants for the environment layers */
export const environmentVariants = {
	ground: {
		initial: { opacity: 0, y: 40 } as Variant,
		animate: { opacity: 1, y: 0 } as Variant,
	},
	structures: {
		initial: { opacity: 0, y: 60, scaleY: 0.6 } as Variant,
		animate: { opacity: 1, y: 0, scaleY: 1 } as Variant,
	},
	lighting: {
		initial: { opacity: 0, scale: 0.3 } as Variant,
		animate: { opacity: 0.6, scale: 1 } as Variant,
	},
	atmosphere: {
		initial: { opacity: 0 } as Variant,
		animate: { opacity: 0.4 } as Variant,
	},
	particles: {
		initial: { opacity: 0 } as Variant,
		animate: { opacity: 0.7 } as Variant,
	},
};

/** Motion variants for the portal reveal */
export const portalVariants = {
	closed: {
		clipPath: "circle(0% at 50% 50%)",
		opacity: 0,
	} as Variant,
	open: {
		clipPath: "circle(100% at 50% 50%)",
		opacity: 1,
	} as Variant,
};

/** Motion variants for the auth form entry */
export const authFormVariants = {
	initial: {
		opacity: 0,
		y: 30,
		scale: 0.96,
	} as Variant,
	animate: {
		opacity: 1,
		y: 0,
		scale: 1,
	} as Variant,
	exit: {
		opacity: 0,
		y: -20,
		scale: 0.96,
	} as Variant,
};

/** Particle color palette (hex equivalents of the OKLCH primaries) */
export const PARTICLE_COLORS = ["#6B5CE7", "#7B9CF0", "#5BC98C"] as const;

/** Number of particles by tier */
export const PARTICLE_COUNT = {
	high: 150,
	medium: 0,
	low: 0,
} as const;
