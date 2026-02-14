/**
 * Orbital layout utilities for voice channel participant positioning.
 * Pure math - computes circular avatar positions around a center point.
 */

export interface OrbitalPosition {
  x: number;
  y: number;
  scale: number;
  angle: number;
}

/**
 * Compute the position of a participant in the orbital ring.
 * Starts from the top (-PI/2) and distributes evenly clockwise.
 */
export function getOrbitalPosition(
  index: number,
  total: number,
  radius: number
): OrbitalPosition {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    scale: 1.0,
    angle,
  };
}

/**
 * Adaptive orbit radius based on participant count.
 * Scales up to prevent avatar overlap with more participants.
 */
export function getOrbitRadius(participantCount: number): number {
  if (participantCount <= 2) return 140;
  if (participantCount <= 4) return 170;
  if (participantCount <= 6) return 200;
  if (participantCount <= 10) return 240;
  return 280;
}
