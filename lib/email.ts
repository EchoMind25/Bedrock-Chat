/**
 * Email sending utility using Resend.
 *
 * Resend is also configured as Supabase's SMTP provider for auth emails.
 * This module handles custom transactional emails (OTP, confirmations)
 * that go beyond Supabase Auth's built-in email templates.
 *
 * IMPORTANT: Server-side only. Never import in client components.
 */

import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        "RESEND_API_KEY environment variable is required for sending emails"
      );
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  tags?: Array<{ name: string; value: string }>;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const FROM_ADDRESS =
  process.env.RESEND_FROM_ADDRESS ?? "Bedrock Chat <noreply@bedrockchat.com>";

export async function sendEmail(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  try {
    const resend = getResend();

    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      tags: options.tags,
    });

    if (error) {
      console.error("[Email] Send error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error("[Email] Unexpected error:", message);
    return { success: false, error: message };
  }
}
