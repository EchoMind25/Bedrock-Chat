/**
 * Centralized error logging utility
 * Logs errors to localStorage for debugging and analytics
 */

export type ErrorCategory = "AUTH" | "STORE_INIT" | "NETWORK" | "RENDER" | "UNKNOWN";

export interface ErrorLog {
  id: string;
  category: ErrorCategory;
  message: string;
  stack?: string;
  timestamp: number;
  userAgent: string;
  url: string;
}

const ERROR_LOG_KEY = "bedrock-error-log";
const MAX_ERRORS = 50;
const BLACK_SCREEN_THRESHOLD = 10000; // 10 seconds without successful render

/**
 * Log an error to localStorage
 */
export function logError(category: ErrorCategory, error: unknown): void {
  try {
    const errorLog: ErrorLog = {
      id: crypto.randomUUID(),
      category,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    const existingLogs = getErrorLogs();
    const updatedLogs = [errorLog, ...existingLogs].slice(0, MAX_ERRORS);

    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(updatedLogs));

    // Also log to console for development
    console.error(`[${category}]`, error);
  } catch (err) {
    // Fallback if localStorage is full or unavailable
    console.error("Failed to log error:", err);
    console.error("Original error:", error);
  }
}

/**
 * Get all error logs from localStorage
 */
export function getErrorLogs(): ErrorLog[] {
  try {
    const logs = localStorage.getItem(ERROR_LOG_KEY);
    if (!logs) return [];

    return JSON.parse(logs) as ErrorLog[];
  } catch (err) {
    console.error("Failed to retrieve error logs:", err);
    return [];
  }
}

/**
 * Get recent error logs (last N errors)
 */
export function getRecentErrors(count: number = 5): ErrorLog[] {
  const logs = getErrorLogs();
  return logs.slice(0, count);
}

/**
 * Clear all error logs
 */
export function clearErrorLogs(): void {
  try {
    localStorage.removeItem(ERROR_LOG_KEY);
  } catch (err) {
    console.error("Failed to clear error logs:", err);
  }
}

/**
 * Export error logs as JSON string
 */
export function exportErrorLogs(): string {
  const logs = getErrorLogs();
  return JSON.stringify(logs, null, 2);
}

/**
 * Detect if app is in "black screen state"
 * Returns true if no successful render in the last 10 seconds
 */
export function isBlackScreenState(): boolean {
  try {
    const lastRender = localStorage.getItem("bedrock-last-render");
    if (!lastRender) return false;

    const lastRenderTime = parseInt(lastRender, 10);
    const timeSinceLastRender = Date.now() - lastRenderTime;

    return timeSinceLastRender > BLACK_SCREEN_THRESHOLD;
  } catch (err) {
    console.error("Failed to check black screen state:", err);
    return false;
  }
}

/**
 * Update render heartbeat
 * Call this periodically to indicate successful renders
 */
export function updateRenderHeartbeat(): void {
  try {
    localStorage.setItem("bedrock-last-render", String(Date.now()));
  } catch (err) {
    console.error("Failed to update render heartbeat:", err);
  }
}

/**
 * Get error count by category
 */
export function getErrorCountByCategory(category: ErrorCategory): number {
  const logs = getErrorLogs();
  return logs.filter((log) => log.category === category).length;
}

/**
 * Get errors within a time range
 */
export function getErrorsInRange(startTime: number, endTime: number): ErrorLog[] {
  const logs = getErrorLogs();
  return logs.filter((log) => log.timestamp >= startTime && log.timestamp <= endTime);
}

/**
 * Check if there have been recent errors (within last 5 minutes)
 */
export function hasRecentErrors(minutes: number = 5): boolean {
  const cutoffTime = Date.now() - minutes * 60 * 1000;
  const recentErrors = getErrorsInRange(cutoffTime, Date.now());
  return recentErrors.length > 0;
}
