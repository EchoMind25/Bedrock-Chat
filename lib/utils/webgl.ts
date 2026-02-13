/**
 * WebGL detection and performance tier utility
 * Used for progressive enhancement of the 3D hero scene
 */

export type PerformanceTier = "high" | "medium" | "low";

let cachedTier: PerformanceTier | null = null;

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

function checkWebGL(version: 1 | 2): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const contextName = version === 2 ? "webgl2" : "webgl";
    const gl = canvas.getContext(contextName) as WebGLRenderingContext | null;
    if (!gl) return false;
    const ext = gl.getExtension("WEBGL_lose_context");
    ext?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function getCoreCount(): number {
  if (typeof navigator === "undefined") return 1;
  return navigator.hardwareConcurrency ?? 1;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Determines the rendering tier for the 3D hero scene.
 * - high: Full Three.js scene with post-processing
 * - medium: Enhanced 2D with CSS parallax
 * - low: Basic CSS gradient + floating orbs
 *
 * Results are cached after first call.
 */
export function getPerformanceTier(): PerformanceTier {
  if (cachedTier) return cachedTier;

  // Server-side: always low (no WebGL)
  if (typeof window === "undefined") {
    return "low";
  }

  // Reduced motion preference: skip heavy animations
  if (prefersReducedMotion()) {
    cachedTier = "low";
    return "low";
  }

  const cores = getCoreCount();
  const hasWebGL2 = checkWebGL(2);
  const hasWebGL1 = checkWebGL(1);
  const mobile = isMobileDevice();

  // Relaxed requirements for better 3D scene visibility
  // Original: WebGL2 + 4 cores + !mobile for high tier
  // New: WebGL1/2 + 2 cores for high tier (allow mobile tablets)
  if ((hasWebGL2 || hasWebGL1) && cores >= 2) {
    cachedTier = "high";
  } else if (hasWebGL1 && cores >= 1) {
    cachedTier = "medium";
  } else {
    cachedTier = "low";
  }

  // Debug logging
  if (typeof window !== "undefined") {
    console.log("🎨 Performance Tier Detection:", {
      tier: cachedTier,
      cores,
      hasWebGL2,
      hasWebGL1,
      mobile,
      userAgent: navigator.userAgent.slice(0, 50) + "...",
    });
  }

  return cachedTier;
}

/**
 * Simple WebGL support check
 */
export function supportsWebGL(): boolean {
  return checkWebGL(1);
}
