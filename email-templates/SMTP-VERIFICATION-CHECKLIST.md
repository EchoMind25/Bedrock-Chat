# Resend SMTP Verification Checklist

Use this checklist to verify the email delivery pipeline from Supabase through Resend.

---

## 1. Supabase Dashboard > Settings > SMTP

Verify these settings match your Resend account:

| Setting | Expected Value |
|---------|---------------|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | `re_XXXXXXXXX` (your Resend API key) |
| Sender name | `Bedrock Chat` |
| Sender email | `noreply@bedrockchat.com` (must be a verified domain in Resend) |
| Minimum interval | `60` seconds |

## 2. Supabase Dashboard > Authentication > URL Configuration

**All** of these must be in the "Redirect URLs" list:

- [ ] `http://localhost:3000/auth/callback`
- [ ] `https://bedrockchat.com/auth/callback`
- [ ] `http://localhost:3000/auth/callback?next=/auth/reset-password`
- [ ] `https://bedrockchat.com/auth/callback?next=/auth/reset-password`

> Supabase matches redirect URLs exactly, including query parameters.
> If `emailRedirectTo` in the code doesn't match a whitelisted URL, the email
> link will silently fail to redirect properly.

## 3. Supabase Dashboard > Authentication > Email Templates

Verify **custom** templates are saved (not Supabase defaults) for:

- [ ] Confirm signup
- [ ] Reset password
- [ ] Magic link
- [ ] Invite user

Each template **must** use `{{ .ConfirmationURL }}` for the action link.

> If using custom HTML templates with Resend, the `{{ .ConfirmationURL }}`
> variable is replaced by Supabase before sending. The URL goes to Supabase's
> auth server first, which then redirects to your `emailRedirectTo` callback.

## 4. Supabase Dashboard > Authentication > Settings

- [ ] **Enable email confirmations** is ON
- [ ] **Secure email change** is ON (requires confirmation for email changes)
- [ ] **PKCE** flow is selected (default for SSR apps)
- [ ] Rate limit settings are reasonable (default: 60s between emails per user)

## 5. Resend Dashboard

- [ ] Domain `bedrockchat.com` is verified (DNS records: SPF, DKIM, DMARC)
- [ ] API key used in Supabase SMTP config is active and not revoked
- [ ] API key has sending permissions (not read-only)
- [ ] Check Resend > Emails tab for delivery status

## 6. DNS Records (in your domain registrar)

These must be set for `bedrockchat.com`:

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| TXT | `@` or `bedrockchat.com` | `v=spf1 include:amazonses.com ~all` | SPF (Resend uses AWS SES) |
| CNAME | `resend._domainkey` | (from Resend dashboard) | DKIM |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@bedrockchat.com` | DMARC |

> Without these records, emails will land in spam or be rejected entirely.

---

## Testing Procedure

### Step 1: Verify SMTP connection
1. Sign up with a **new** email address (not previously used)
2. Check browser console for `[AUTH DEBUG]` logs:
   - `signUp called` — confirms the client-side call fired
   - `signUp response` — should show `userId`, `hasSession: false`, `identities: 1`, `error: null`
3. If `error` is not null, the issue is in the Supabase signUp call itself

### Step 2: Check Resend delivery
1. Go to Resend Dashboard > Emails tab
2. Look for the send attempt to the test email
3. Possible outcomes:

| Resend shows | Diagnosis |
|-------------|-----------|
| No send attempt | Supabase SMTP config is wrong (host/port/key) |
| `delivered` | Email was sent. Check spam folder, or DNS records are wrong |
| `bounced` | Recipient email invalid or their server rejected it |
| `failed` | Check error in Resend logs (usually auth/domain issue) |
| `complained` | Email was marked as spam by a previous recipient |

### Step 3: Verify the email link works
1. Click the confirmation link in the email
2. You should be redirected to `/auth/callback?code=xxx` (or `?token_hash=xxx&type=signup`)
3. The callback exchanges the code for a session and redirects to `/onboarding`
4. If you see `/login?error=confirmation_failed`, the code exchange failed:
   - **Different browser**: The PKCE verifier cookie is missing. The `token_hash` fallback should handle this.
   - **Expired link**: Confirmation links expire (default 24h in Supabase)
   - **Already used**: Each confirmation code can only be used once

---

## Common Fixes

| Problem | Fix |
|---------|-----|
| "Sender not verified" | Add and verify `bedrockchat.com` domain in Resend |
| Port 587 not working | Switch to port 465 (SSL) in Supabase SMTP config |
| Emails in spam | Add SPF, DKIM, and DMARC DNS records per Resend docs |
| Rate limited | Supabase enforces minimum interval between emails (default 60s) |
| "Email not confirmed" error on login | User hasn't clicked the confirmation link yet |
| Redirect URL mismatch | Add exact URL (with query params) to Supabase Redirect URLs |
| Code exchange fails | Ensure `/auth/callback` route handles both `code` AND `token_hash` params |
| Link expired | User waited too long. Use "Resend confirmation email" button |

---

## Code-Side Verification

Run these from the project root to verify the code is correct:

```bash
# Verify callback handles both auth flows
grep -n "token_hash\|exchangeCodeForSession\|verifyOtp" app/auth/callback/route.ts

# Verify redirect URLs use window.location.origin (not hardcoded)
grep -rn "emailRedirectTo\|redirectTo" store/auth.store.ts

# Verify resend uses type: "signup" (not "email_change")
grep -n 'type:' store/auth.store.ts

# Check for any hardcoded domains in auth flows
grep -rn "bedrockchat.com\|localhost" store/auth.store.ts app/auth/
```
