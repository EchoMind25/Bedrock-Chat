import { devtools } from 'zustand/middleware';
import type { StateCreator } from 'zustand';

/**
 * Conditional devtools middleware for Zustand stores
 * Only enables devtools when explicitly requested via localStorage
 *
 * Performance: Reduces serialization overhead in development
 *
 * To enable devtools, run in browser console:
 * localStorage.setItem('zustand-devtools-enabled', 'true')
 *
 * To disable:
 * localStorage.removeItem('zustand-devtools-enabled')
 */
export const conditionalDevtools = <T>(
  initializer: StateCreator<T, any, any>,
  options: { name: string }
): StateCreator<T, any, any> => {
  // Check if devtools should be enabled
  const shouldEnableDevtools =
    typeof window !== 'undefined' &&
    typeof localStorage !== 'undefined' &&
    localStorage.getItem('zustand-devtools-enabled') === 'true';

  // Return either devtools-wrapped or plain initializer
  return shouldEnableDevtools
    ? devtools(initializer as StateCreator<T, [], []>, options) as StateCreator<T, any, any>
    : initializer;
};

/**
 * Helper to enable devtools globally
 * Run this in browser console to enable devtools for all stores
 */
export const enableDevtools = () => {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.setItem('zustand-devtools-enabled', 'true');
    console.log('✅ Zustand devtools enabled. Reload the page to apply.');
  }
};

/**
 * Helper to disable devtools globally
 */
export const disableDevtools = () => {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.removeItem('zustand-devtools-enabled');
    console.log('✅ Zustand devtools disabled. Reload the page to apply.');
  }
};

// Make helpers available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).enableDevtools = enableDevtools;
  (window as any).disableDevtools = disableDevtools;
}
