/**
 * POST /api/family/consent/initiate
 *
 * Initiates COPPA-compliant parental consent via email OTP.
 * Generates a 6-digit OTP, stores the SHA-256 hash, and sends
 * the code to the parent's email via Resend.
 *
 * Rate limits: 3 OTP sends per email per hour, 10 per IP per hour.
 * OTP expires in 15 minutes. Previous pending OTPs are invalidated.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateOTP, generateOTPSalt, hashOTP, maskEmail } from "@/lib/otp";
import { renderOTPEmail } from "@/lib/emails/otp-verification";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/utils/rate-limiter";
import type { OTPInitiateRequest, OTPInitiateResponse } from "@/lib/types/otp";

const OTP_RATE_LIMIT_PER_EMAIL = 3; // per hour
const OTP_RATE_LIMIT_PER_IP = 10;   // per hour
const OTP_EXPIRY_MINUTES = 15;
const ONE_HOUR_MS = 60 * 60 * 1000;

function emptyResponse(error: string, status: number): NextResponse<OTPInitiateResponse> {
  return NextResponse.json(
    { success: false, error, verificationId: "", expiresAt: "", maskedEmail: "" },
    { status }
  );
}

export async function POST(request: NextRequest): Promise<NextResponse<OTPInitiateResponse>> {
  try {
    // 1. IP rate limit
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const ipCheck = checkRateLimit(`otp-initiate-ip:${ip}`, OTP_RATE_LIMIT_PER_IP, ONE_HOUR_MS);
    if (!ipCheck.allowed) {
      return emptyResponse("Too many requests. Please try again later.", 429);
    }

    // 2. Authenticate parent
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return emptyResponse("Authentication required", 401);
    }

    // Verify caller is a parent account
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_type")
      .eq("id", user.id)
      .single();

    if (!profile || profile.account_type !== "parent") {
      return emptyResponse("Only parent accounts can initiate consent verification", 403);
    }

    // 3. Parse and validate request body
    let body: OTPInitiateRequest;
    try {
      body = await request.json();
    } catch {
      return emptyResponse("Invalid request body", 400);
    }

    const { parentEmail, consentContext } = body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!parentEmail || !emailRegex.test(parentEmail)) {
      return emptyResponse("Valid parent email required", 400);
    }

    const normalizedEmail = parentEmail.toLowerCase().trim();

    // 4. Per-email rate limit
    const emailCheck = checkRateLimit(
      `otp-initiate-email:${normalizedEmail}`,
      OTP_RATE_LIMIT_PER_EMAIL,
      ONE_HOUR_MS
    );
    if (!emailCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many verification attempts for this email. Please try again in an hour.",
          verificationId: "",
          expiresAt: "",
          maskedEmail: maskEmail(normalizedEmail),
        },
        { status: 429 }
      );
    }

    const serviceClient = createServiceClient();

    // 5. Invalidate any existing pending OTPs for this parent+email
    await serviceClient
      .from("otp_verifications")
      .update({ is_invalidated: true })
      .eq("parent_user_id", user.id)
      .eq("parent_email", normalizedEmail)
      .eq("is_used", false)
      .eq("is_invalidated", false);

    // 6. Generate OTP and hash it
    const otpCode = generateOTP();
    const otpSalt = generateOTPSalt();
    const otpHash = hashOTP(otpCode, otpSalt);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    // 7. Store hashed OTP — never store plaintext
    const { data: otpRecord, error: insertError } = await serviceClient
      .from("otp_verifications")
      .insert({
        parent_email: normalizedEmail,
        parent_user_id: user.id,
        otp_hash: otpHash,
        otp_salt: otpSalt,
        expires_at: expiresAt,
        consent_context: consentContext ?? {},
      })
      .select("id, expires_at")
      .single();

    if (insertError || !otpRecord) {
      console.error("[OTP Initiate] DB insert error:", insertError?.message);
      return emptyResponse("Failed to initiate verification. Please try again.", 500);
    }

    // 8. Send OTP email via Resend
    const { html, text, subject } = renderOTPEmail({
      otpCode,
      parentEmail: normalizedEmail,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });

    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject,
      html,
      text,
      tags: [{ name: "type", value: "otp_verification" }],
    });

    if (!emailResult.success) {
      console.error("[OTP Initiate] Email send error:", emailResult.error);
      // Clean up the OTP record since we couldn't deliver
      await serviceClient.from("otp_verifications").delete().eq("id", otpRecord.id);
      return emptyResponse("Failed to send verification email. Please check the address and try again.", 500);
    }

    // 9. Return success — never return the OTP code
    return NextResponse.json({
      success: true,
      verificationId: otpRecord.id,
      expiresAt: otpRecord.expires_at,
      maskedEmail: maskEmail(normalizedEmail),
    });
  } catch (error) {
    console.error("[OTP Initiate] Unexpected error:", error);
    return emptyResponse("An unexpected error occurred. Please try again.", 500);
  }
}
