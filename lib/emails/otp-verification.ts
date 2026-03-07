/**
 * Email templates for COPPA parental consent OTP verification.
 *
 * Two templates:
 * 1. OTP delivery email — sent when parent initiates consent
 * 2. Confirmatory email — sent after consent is verified (COPPA §312.5(b)(2)(ii) requirement)
 *
 * Privacy: No tracking pixels. No click tracking.
 */

interface OTPEmailProps {
  otpCode: string;
  parentEmail: string;
  expiresInMinutes: number;
}

export function renderOTPEmail({
  otpCode,
  parentEmail,
  expiresInMinutes,
}: OTPEmailProps): { html: string; text: string; subject: string } {
  const subject = `Your Bedrock Chat verification code: ${otpCode}`;

  const text = `Your Parental Consent Verification Code

${otpCode}

You're receiving this because someone is setting up a Family Account on Bedrock Chat for a child using your email address (${parentEmail}).

This code expires in ${expiresInMinutes} minutes.

If you did NOT request this, you can safely ignore this email. No account will be created without entering this code.

Questions? Contact privacy@bedrockchat.com

— The Bedrock Chat Team`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>${subject}</title>
</head>
<body style="font-family: system-ui, sans-serif; background: #0a0a0a; color: #ffffff; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #8b5cf6; font-size: 24px; margin: 0;">Bedrock Chat</h1>
    <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0;">Privacy-first family communication</p>
  </div>
  <div style="background: #1a1a2e; border: 1px solid #2d2d4a; border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 24px;">
    <p style="color: #9ca3af; font-size: 14px; margin: 0 0 16px;">Your parental consent verification code</p>
    <div style="font-size: 48px; font-weight: 700; letter-spacing: 8px; color: #8b5cf6; font-family: monospace;">${otpCode}</div>
    <p style="color: #6b7280; font-size: 13px; margin: 16px 0 0;">Expires in ${expiresInMinutes} minutes</p>
  </div>
  <div style="background: #111827; border-left: 3px solid #f59e0b; border-radius: 4px; padding: 16px; margin-bottom: 24px;">
    <p style="color: #d1d5db; font-size: 13px; margin: 0; line-height: 1.6;">
      <strong style="color: #f59e0b;">What is this?</strong><br>
      You're confirming parental consent to create a supervised Family Account for a child on Bedrock Chat. This verification is required by the Children's Online Privacy Protection Act (COPPA).
    </p>
  </div>
  <p style="color: #6b7280; font-size: 12px; text-align: center; line-height: 1.6;">
    If you didn't request this, ignore this email — no account will be created.<br>
    Questions: <a href="mailto:privacy@bedrockchat.com" style="color: #8b5cf6;">privacy@bedrockchat.com</a>
  </p>
</body>
</html>`;

  return { html, text, subject };
}

interface ConfirmatoryEmailProps {
  parentEmail: string;
  teenDisplayName: string;
  monitoringLevel: string;
  consentTimestamp: string;
  revocationUrl: string;
}

/**
 * Confirmatory email — sent AFTER successful consent.
 * Required by COPPA 16 CFR §312.5(b)(2)(ii).
 */
export function renderConfirmatoryEmail({
  parentEmail,
  teenDisplayName,
  monitoringLevel,
  consentTimestamp,
  revocationUrl,
}: ConfirmatoryEmailProps): { html: string; text: string; subject: string } {
  // parentEmail included to satisfy the interface even though not directly rendered
  void parentEmail;

  const subject = "Parental consent confirmed — Bedrock Chat Family Account";

  const text = `Parental Consent Confirmed

You've successfully verified your parental consent for ${teenDisplayName}'s Bedrock Chat Family Account on ${consentTimestamp}.

What you consented to:
- Creating a supervised account for ${teenDisplayName}
- Monitoring level: ${monitoringLevel}
- All monitoring is transparent — ${teenDisplayName} can see exactly what you access

Your rights as a parent:
- Access and review data associated with ${teenDisplayName}'s account at any time
- Delete the account and all associated data at any time
- Change or revoke consent at any time

To revoke consent or manage the account: ${revocationUrl}

Or contact us: privacy@bedrockchat.com

Full privacy policy: https://bedrockchat.com/privacy-policy

— The Bedrock Chat Team`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family: system-ui, sans-serif; background: #0a0a0a; color: #ffffff; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #8b5cf6; font-size: 24px; margin: 0;">Bedrock Chat</h1>
  </div>
  <div style="background: #052e16; border: 1px solid #166534; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
    <p style="color: #86efac; font-size: 16px; font-weight: 600; margin: 0 0 8px;">Parental consent confirmed</p>
    <p style="color: #d1d5db; font-size: 14px; margin: 0;">
      Family Account created for <strong>${teenDisplayName}</strong><br>
      <span style="color: #6b7280; font-size: 12px;">${consentTimestamp}</span>
    </p>
  </div>
  <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <p style="color: #9ca3af; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px;">What you consented to</p>
    <ul style="color: #d1d5db; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
      <li>Supervised account for ${teenDisplayName}</li>
      <li>Monitoring level: ${monitoringLevel}</li>
      <li>${teenDisplayName} can always see what you monitor</li>
    </ul>
  </div>
  <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
    <p style="color: #9ca3af; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px;">Your parental rights</p>
    <ul style="color: #d1d5db; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
      <li>Review all data associated with this account</li>
      <li>Delete the account and all data at any time</li>
      <li>Change monitoring level at any time</li>
      <li>Revoke consent at any time</li>
    </ul>
  </div>
  <div style="text-align: center; margin-bottom: 24px;">
    <a href="${revocationUrl}" style="display: inline-block; background: #1e1b4b; color: #a78bfa; border: 1px solid #4c1d95; border-radius: 8px; padding: 12px 24px; font-size: 14px; text-decoration: none;">Manage consent &amp; account settings</a>
  </div>
  <p style="color: #6b7280; font-size: 12px; text-align: center; line-height: 1.6;">
    Questions: <a href="mailto:privacy@bedrockchat.com" style="color: #8b5cf6;">privacy@bedrockchat.com</a><br>
    <a href="https://bedrockchat.com/privacy-policy" style="color: #4b5563;">Privacy Policy</a>
  </p>
</body>
</html>`;

  return { html, text, subject };
}
