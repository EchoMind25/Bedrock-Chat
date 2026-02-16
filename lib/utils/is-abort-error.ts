/**
 * Check if an error is an AbortError (from AbortController signal).
 * Supabase GoTrueClient internally aborts concurrent getUser() requests,
 * so these are transient and should not be treated as fatal failures.
 */
export function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error && err.message.includes("signal is aborted"))
  );
}
