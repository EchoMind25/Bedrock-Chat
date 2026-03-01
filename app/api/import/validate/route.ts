import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit } from "@/lib/utils/rate-limiter";
import {
  safeParseServerDefinition,
  scanForWarnings,
  MAX_PAYLOAD_BYTES,
} from "@/lib/templates/validate-definition";
import { sanitizeDefinition } from "@/lib/services/import-sanitizer";
import type {
  ValidationResult,
  ValidationError,
  ValidationSummary,
} from "@/lib/types/import-validation";
import type { ServerDefinition } from "@/lib/types/server-definition";

/**
 * POST /api/import/validate
 *
 * Validates and optionally sanitizes a ServerDefinition JSON payload.
 *
 * SECURITY:
 * - Authenticated: user must be logged in
 * - Rate limited: 10 requests per minute per IP
 * - Max payload: 1MB
 * - PII detection: rejects payloads containing email, phone, IP
 * - Injection detection: rejects HTML/script/SQL injection attempts
 *
 * PRIVACY:
 * - The raw import JSON is NEVER stored (may contain PII if malformed)
 * - Only a sanitized summary is logged to import_audit_log
 * - Validation errors reference field paths, not field values
 */
export async function POST(request: NextRequest) {
  // -------------------------------------------------------------------
  // 1. Rate limiting: 10 requests per minute per IP
  // -------------------------------------------------------------------
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(
    `import-validate:${ip}`,
    10,
    60_000,
  );

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before validating again." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
      },
    );
  }

  // -------------------------------------------------------------------
  // 2. Authentication
  // -------------------------------------------------------------------
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // -------------------------------------------------------------------
  // 3. Payload size check
  // -------------------------------------------------------------------
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
    return NextResponse.json(
      {
        error: `Payload too large. Maximum size is ${Math.floor(MAX_PAYLOAD_BYTES / 1024)}KB.`,
      },
      { status: 413 },
    );
  }

  // -------------------------------------------------------------------
  // 4. Parse JSON body
  // -------------------------------------------------------------------
  let rawBody: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        {
          error: `Payload too large. Maximum size is ${Math.floor(MAX_PAYLOAD_BYTES / 1024)}KB.`,
        },
        { status: 413 },
      );
    }
    rawBody = JSON.parse(text);
  } catch {
    await logAudit(user.id, "unknown", false, 1, 0, null, ip);
    return NextResponse.json(
      {
        valid: false,
        errors: [
          {
            field: "_root",
            message:
              "Invalid JSON. Please check your file for syntax errors (missing commas, unclosed brackets, etc.)",
            code: "invalid_json",
          },
        ],
        warnings: [],
        summary: null,
        sanitized: false,
        sanitize_changes: [],
      } satisfies ValidationResult,
      { status: 400 },
    );
  }

  // -------------------------------------------------------------------
  // 5. Run Zod validation
  // -------------------------------------------------------------------
  const result = safeParseServerDefinition(rawBody);

  if (!result.success) {
    const errors: ValidationError[] = result.error.issues.map((issue) => ({
      field: issue.path.join(".") || "_root",
      message: issue.message,
      code: issue.code,
    }));

    const source =
      typeof rawBody === "object" &&
      rawBody !== null &&
      "source" in rawBody &&
      typeof (rawBody as Record<string, unknown>).source === "string"
        ? ((rawBody as Record<string, unknown>).source as string)
        : "unknown";

    await logAudit(user.id, source, false, errors.length, 0, null, ip);

    return NextResponse.json(
      {
        valid: false,
        errors,
        warnings: [],
        summary: null,
        sanitized: false,
        sanitize_changes: [],
      } satisfies ValidationResult,
      { status: 200 },
    );
  }

  // -------------------------------------------------------------------
  // 6. Scan for warnings (non-blocking)
  // -------------------------------------------------------------------
  const validated = result.data as ServerDefinition;
  const warnings = scanForWarnings(validated);

  // -------------------------------------------------------------------
  // 7. Sanitize the definition
  // -------------------------------------------------------------------
  const { definition: sanitized, changes } = sanitizeDefinition(validated);

  // -------------------------------------------------------------------
  // 8. Build summary
  // -------------------------------------------------------------------
  const summary: ValidationSummary = {
    categories: sanitized.categories.length,
    channels: {
      text: sanitized.channels.filter((ch) => ch.type === "text").length,
      voice: sanitized.channels.filter((ch) => ch.type === "voice").length,
      announcement: sanitized.channels.filter((ch) => ch.type === "announcement").length,
    },
    roles: sanitized.roles.length,
    family_safe: sanitized.server.family_safe,
    source: sanitized.source,
  };

  // -------------------------------------------------------------------
  // 9. Audit log (non-critical)
  // -------------------------------------------------------------------
  await logAudit(
    user.id,
    sanitized.source,
    true,
    0,
    warnings.length,
    summary,
    ip,
  );

  // -------------------------------------------------------------------
  // 10. Return result
  // -------------------------------------------------------------------
  return NextResponse.json(
    {
      valid: true,
      errors: [],
      warnings: warnings.map((w) => ({
        field: w.field,
        message: w.message,
        type: w.type,
      })),
      summary,
      sanitized: changes.length > 0,
      sanitize_changes: changes.map((c) => c.message),
    } satisfies ValidationResult,
    { status: 200 },
  );
}

// ---------------------------------------------------------------------------
// Audit logging helper
// ---------------------------------------------------------------------------

async function logAudit(
  userId: string,
  source: string,
  passed: boolean,
  errorCount: number,
  warningCount: number,
  summary: ValidationSummary | null,
  ipAddress: string,
) {
  try {
    const service = createServiceClient();
    await service.from("import_audit_log").insert({
      user_id: userId,
      source,
      validation_passed: passed,
      error_count: errorCount,
      warning_count: warningCount,
      summary: summary ?? { error: "validation_failed" },
      ip_address: ipAddress !== "unknown" ? ipAddress : null,
    });
  } catch {
    // Audit logging is non-critical — swallow failures
  }
}
