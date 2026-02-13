/**
 * PWA detection and utilities
 */

/**
 * Detects if the app is running as an installed PWA
 */
export function isPWA(): boolean {
  if (typeof window === 'undefined') return false;

  // Check if running in standalone mode (installed PWA)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  // iOS Safari specific check
  const isIOSStandalone = (window.navigator as any).standalone === true;

  return isStandalone || isIOSStandalone;
}

/**
 * Detects if the app CAN be installed as a PWA (not yet installed)
 */
export function canInstallPWA(): boolean {
  if (typeof window === 'undefined') return false;

  // Check if beforeinstallprompt event has fired (set by ServiceWorkerRegister)
  return (window as any).__canInstallPWA === true;
}

/**
 * Gets the display mode (browser, standalone, fullscreen, minimal-ui)
 */
export function getDisplayMode(): 'browser' | 'standalone' | 'fullscreen' | 'minimal-ui' {
  if (typeof window === 'undefined') return 'browser';

  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen';
  }
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone';
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui';
  }
  return 'browser';
}
