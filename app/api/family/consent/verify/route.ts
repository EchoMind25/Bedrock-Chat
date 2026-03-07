/**
 * POST /api/family/consent/verify
 *
 * Verifies the 6-digit OTP code entered by the parent.
 * On success: marks OTP as used, creates parental_consent record,
 * sends confirmatory email (COPPA §312.5(b)(2)(ii) requirement).
 *
 * Max 3 attempts before invalidation.
 * Constant-time hash comparison to prevent timing attacks.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { hashOTP, secureCompare } from "@/lib/otp";
import { renderConfirmatoryEmail } from "@/lib/emails/otp-verification";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/utils/rate-limiter";
import type { OTPVerifyRequest, OTPVerifyResponse } from "@/lib/types/otp";

const MAX_ATTEMPTS = 3;

const MONITORING_LEVEL_LABELS: Record<number, string> = {
  1: "Minimal — Basic safety features only",
  2: "Moderate — Activity summary and flagged content",
  3: "Supervised — Full activity visibility with approvals",
  4: "Restricted — Full oversight with time limits",
};

export async function POST(request: NextRequest): Promise<NextResponse<OTPVerifyResponse>> {
  try {
    // IP rate limit
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const ipCheck = checkRateLimit(`otp-verify-ip:${ip}`, 10, 15 * 60 * 1000);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { success: false, errorCode: "RATE_LIMITED" as const, error: "Too many attempts. Please wait." },
        { status: 429 }
      );
    }

    // 1. Authenticate parent
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, errorCode: "NOT_FOUND" as const, error: "Authentication required" },
        { status: 401 }
      );
    }

    // 2. Parse request
    let body: OTPVerifyRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, errorCode: "INVALID_OTP" as const, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { verificationId, otpCode } = body;

    // Validate OTP format — must be 6 digits
    if (!otpCode || !/^\d{6}$/.test(otpCode)) {
      return NextResponse.json(
        { success: false, errorCode: "INVALID_OTP" as const, error: "Verification code must be 6 digits" },
        { status: 400 }
      );
    }

    if (!verificationId) {
      return NextResponse.json(
        { success: false, errorCode: "NOT_FOUND" as const, error: "Verification session not found" },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // 3. Fetch OTP record — must belong to authenticated parent
    const { data: otpRecord, error: fetchError } = await serviceClient
      .from("otp_verifications")
      .select("*")
      .eq("id", verificationId)
      .eq("parent_user_id", user.id)
      .single();

    if (fetchError || !otpRecord) {
      return NextResponse.json(
        { success: false, errorCode: "NOT_FOUND" as const, error: "Verification session not found or expired" },
        { status: 404 }
      );
    }

    // 4. Check already-terminated states
    if (otpRecord.is_used) {
      return NextResponse.json(
        { success: false, errorCode: "ALREADY_USED" as const, error: "This verification code has already been used" },
        { status: 400 }
      );
    }

    if (otpRecord.is_invalidated) {
      return NextResponse.json(
        { success: false, errorCode: "MAX_ATTEMPTS" as const, error: "Too many incorrect attempts. Please request a new code." },
        { status: 400 }
      );
    }

    // 5. Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      await serviceClient
        .from("otp_verifications")
        .update({ is_invalidated: true })
        .eq("id", verificationId);

      return NextResponse.json(
        { success: false, errorCode: "EXPIRED" as const, error: "Verification code expired. Please request a new one." },
        { status: 400 }
      );
    }

    // 6. Increment attempt count BEFORE verifying
    const newAttemptCount = (otpRecord.attempt_count as number) + 1;
    const willInvalidate = newAttemptCount >= MAX_ATTEMPTS;

    // 7. Verify OTP — constant-time comparison
    const expectedHash = hashOTP(otpCode, otpRecord.otp_salt as string);
    const isValid = secureCompare(expectedHash, otpRecord.otp_hash as string);

    if (!isValid) {
      await serviceClient
        .from("otp_verifications")
        .update({
          attempt_count: newAttemptCount,
          is_invalidated: willInvalidate,
        })
        .eq("id", verificationId);

      if (willInvalidate) {
        return NextResponse.json(
          {
            success: false,
            errorCode: "MAX_ATTEMPTS" as const,
            error: "Too many incorrect attempts. Please request a new code.",
            attemptsRemaining: 0,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          errorCode: "INVALID_OTP" as const,
          error: "Incorrect verification code",
          attemptsRemaining: MAX_ATTEMPTS - newAttemptCount,
        },
        { status: 400 }
      );
    }

    // 8. OTP is valid — mark as used
    const verifiedAt = new Date().toISOString();
    await serviceClient
      .from("otp_verifications")
      .update({
        is_used: true,
        verified_at: verifiedAt,
        attempt_count: newAttemptCount,
      })
      .eq("id", verificationId);

    // 9. Return success — consent record will be created by the add-teen route
    // when it receives the verificationId. This keeps the flow atomic:
    // consent is only recorded when the teen account is actually created.

    // 10. Send confirmatory email (COPPA §312.5(b)(2)(ii) requirement)
    const context = otpRecord.consent_context as Record<string, unknown> | null;
    const monitoringLevel =
      MONITORING_LEVEL_LABELS[(context?.monitoringLevel as number) ?? 1] ??
      "Standard family monitoring";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://bedrockchat.com";

    const { html, text, subject } = renderConfirmatoryEmail({
      parentEmail: otpRecord.parent_email as string,
      teenDisplayName: (context?.teenDisplayName as string) ?? "your child",
      monitoringLevel,
      consentTimestamp: new Date(verifiedAt).toLocaleString("en-US", {
        timeZone: "UTC",
        dateStyle: "long",
        timeStyle: "short",
      }) + " UTC",
      revocationUrl: `${appUrl}/parent-dashboard`,
    });

    // Fire and forget — don't block response on confirmatory email
    sendEmail({
      to: otpRecord.parent_email as string,
      subject,
      html,
      text,
      tags: [{ name: "type", value: "consent_confirmation" }],
    }).catch((err) => {
      console.error("[OTP Verify] Confirmatory email failed:", err);
    });

    return NextResponse.json({
      success: true,
      consentId: verificationId, // The add-teen route uses this to verify consent
    });
  } catch (error) {
    console.error("[OTP Verify] Unexpected error:", error);
    return NextResponse.json(
      { success: false, errorCode: "INVALID_OTP" as const, error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
