/**
 * Check if an error is an AbortError (from AbortController signal).
 * Supabase GoTrueClient internally aborts concurrent getUser() requests,
 * and PostgREST queries can return abort errors as plain objects
 * ({message, details, hint, code}) rather than DOMException instances.
 * These are transient and should not be treated as fatal failures.
 */
export function isAbortError(err: unknown): boolean {
  // Thrown DOMException (e.g., from fetch abort)
  if (err instanceof DOMException && err.name === "AbortError") return true;

  // Thrown Error with abort message
  if (err instanceof Error && err.message.includes("signal is aborted")) return true;

  // Supabase PostgrestError object (plain object with message property)
  if (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
  ) {
    const msg = (err as { message: string }).message;
    if (msg.includes("AbortError") || msg.includes("signal is aborted")) return true;
  }

  return false;
}
