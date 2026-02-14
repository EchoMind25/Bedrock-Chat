/**
 * Browser detection utilities for audio enhancement features
 */

/**
 * Detects if the browser is Chromium-based (Chrome, Edge, Brave, Opera)
 * Chromium browsers support Daily.co's native noise cancellation
 */
export function isChromiumBrowser(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent;
  // Check for Chromium-based browsers, but exclude Safari
  // Safari contains "Chrome" in UA but is not Chromium
  return /Chrome|Chromium|Edge|Brave|Opera/.test(ua) && !/Safari/.test(ua);
}

/**
 * Checks if the browser supports Daily.co's noise cancellation feature
 * Requires Chromium browser + AudioContext support
 */
export function supportsNoiseCancellation(): boolean {
  if (typeof window === 'undefined') return false;

  return isChromiumBrowser() && 'AudioContext' in window;
}

/**
 * Gets a human-readable browser name for display purposes
 */
export function getBrowserName(): string {
  if (typeof window === 'undefined') return 'Unknown';

  const ua = navigator.userAgent;

  if (/Edg/.test(ua)) return 'Edge';
  if (/Chrome/.test(ua) && !/Chromium/.test(ua)) return 'Chrome';
  if (/Chromium/.test(ua)) return 'Chromium';
  if (/Brave/.test(ua)) return 'Brave';
  if (/Opera|OPR/.test(ua)) return 'Opera';
  if (/Safari/.test(ua) && !/Chrome/.test(ua)) return 'Safari';
  if (/Firefox/.test(ua)) return 'Firefox';

  return 'Unknown';
}

/**
 * Determines which audio enhancement method to use
 */
export function getAudioEnhancementMethod(): 'daily-co' | 'rnnoise' | 'none' {
  if (typeof window === 'undefined') return 'none';

  // Chromium browsers use Daily.co's native noise cancellation
  if (supportsNoiseCancellation()) {
    return 'daily-co';
  }

  // Safari and Firefox will use RNNoise fallback
  if ('AudioContext' in window) {
    return 'rnnoise';
  }

  // No audio enhancement support
  return 'none';
}
