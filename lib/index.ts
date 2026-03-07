/**
 * Barrel file for shared library utilities.
 *
 * Re-exports public APIs so consumers can import from `@/lib` directly.
 * @module lib
 */

export {
  getClientContext,
  getPlatformDownload,
  usePWAInstallPrompt,
  useClientContext,
} from "./client-detection";

export type { ClientContext, PlatformDownload } from "./client-detection";
