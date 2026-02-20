# Bedrock Chat - Security & Compliance

**Last Updated:** 2026-02-16
**Status:** Post-security-sprint, beta ready
**Platform:** Privacy-first Discord alternative for families with teens

---

## 1. Privacy Architecture

| Control | Status | Details |
|---|---|---|
| Zero third-party analytics | Implemented | No analytics scripts, no tracking pixels, confirmed via codebase search |
| Zero tracking pixels | Implemented | No external tracking of any kind |
| No PII in console logs | Implemented | Only generic error messages logged |
| GPC signal detection | Implemented | `proxy.ts` reads `Sec-GPC` header, sets `privacy-mode` cookie |
| DNT signal detection | Implemented | `proxy.ts` reads `DNT` header |
| Voice: metadata only | Implemented | DB stores timestamps, participants, duration. NO audio recordings. Confirmed in schema + code |
| Family monitoring transparency | Implemented | `visible_to_child` always TRUE. All parent actions logged. Teens see all monitoring activity |
| E2E encryption library | Exists | `lib/encryption.ts` has AES-GCM, ECDH, PBKDF2, IndexedDB key storage. **NOT integrated** into message pipeline -- messages are plaintext in DB |
| Data minimization | Implemented | No behavioral tracking, no device fingerprinting, local-first storage preference |

---

## 2. Regulatory Compliance

### GDPR (EU General Data Protection Regulation)

| Requirement | Status | Implementation |
|---|---|---|
| Explicit opt-in consent | Implemented | `components/consent/consent-banner.tsx` -- shows on first visit, granular controls (analytics, marketing, functional) |
| Right to access (Art. 15) | Implemented | Data export at `/data-export` -- JSON download of all user data |
| Right to erasure (Art. 17) | Implemented | Account deletion via `app/api/account/delete/route.ts` -- password-confirmed, cascading delete across all tables, auth user removed via service role |
| Data portability (Art. 20) | Implemented | Same data export feature (JSON format) |
| Consent versioning | Implemented | `store/consent.store.ts` tracks consent version, re-prompts on policy change |
| Privacy Policy | Implemented | `/privacy-policy` -- 366 lines, comprehensive, publicly accessible (no auth required) |
| Cookie Policy | Implemented | `/cookie-policy` -- documents all cookies and localStorage items |

### CCPA/CPRA (California)

| Requirement | Status | Implementation |
|---|---|---|
| "Do Not Sell or Share" link | Implemented | Footer link to `/privacy-settings?section=ccpa` |
| "Limit Sensitive Information" link | Implemented | Footer link to privacy settings |
| Honor GPC signals | Implemented | `proxy.ts` detects and honors Global Privacy Control |
| Privacy settings page | Implemented | `/privacy-settings` with CCPA opt-out controls |

### COPPA (Children's Online Privacy Protection Act)

| Requirement | Status | Implementation |
|---|---|---|
| Age verification at signup | Implemented | Account type selection: standard, parent, teen |
| Parental consent schema | Partial | `parental_consent` table exists in DB. Verified consent mechanism (e.g., credit card verification, signed form) NOT yet implemented |
| Parental controls | Implemented | 4 monitoring levels, keyword alerts, time limits, content flags |

### 18 U.S.C. 2258A (CSAM Reporting)

| Requirement | Status | Implementation |
|---|---|---|
| Reporting mechanism | Implemented | Report dialog (`components/chat/report-dialog.tsx`), message context menu "Report" option |
| Report types | Implemented | `lib/types/report.ts` -- CSAM, harassment, spam, hate speech, violence, self-harm, impersonation, other |
| Report storage | Implemented | `reports` table with RLS. Message content snapshot preserved even if original deleted |
| Report API | Implemented | `app/api/reports/route.ts` -- authenticated submission, CSAM reports auto-escalated |
| Admin review | Implemented | Admin report review page |
| NCMEC CyberTipline API | NOT automated | Manual reporting possible. API registration at `report.cybertip.org/ispws/` needed for automation |

---

## 3. Security Posture

### Authentication

| Control | Status | Details |
|---|---|---|
| Email/password auth | Implemented | Supabase Auth |
| Email verification | Implemented | Required before access |
| Password strength | Implemented | 8+ chars, uppercase, lowercase, number. Visual strength indicator (`components/ui/password-strength/`) |
| Password reset | Implemented | `store/auth.store.ts` actions + `app/auth/reset-password/page.tsx` + login form UI |
| Rate limiting | Implemented | Server-side: Supabase auth rate limits. Client-side: exponential backoff (2s, 4s, 8s, 16s, 32s max) |
| Account lockout | Implemented | 5 failed attempts -> 15-minute lockout. Persisted to localStorage (`failedLoginAttempts`, `lockoutUntil` in auth store `partialize`) |
| Remember Me | Implemented | localStorage vs sessionStorage toggle |
| Session management | Implemented | `proxy.ts` refreshes session on every request. Auth listener handles SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED |
| MFA/2FA | NOT implemented | Supabase supports TOTP natively; client flow not built |
| CAPTCHA | NOT implemented | No bot protection on auth endpoints |
| Session inactivity timeout | NOT implemented | Sessions persist until Supabase refresh token expires (default: 1 week). Idle detection changes presence only |
| OAuth | NOT implemented | Google, GitHub planned post-beta |

### Security Headers

All headers set in `proxy.ts`:

| Header | Value | Status |
|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Implemented (production only) |
| `Content-Security-Policy` | See below | Implemented (unsafe-eval removed in production) |
| `X-Frame-Options` | `DENY` | Implemented |
| `X-Content-Type-Options` | `nosniff` | Implemented |
| `X-XSS-Protection` | `1; mode=block` | Implemented |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Implemented |
| `Permissions-Policy` | `microphone=(self), camera=(), geolocation=(), payment=()` | Implemented |
| `frame-ancestors` | `'none'` (in CSP) | Implemented |

**CSP Details:**

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
connect-src 'self' https://*.supabase.co wss://*.supabase.co wss://*.livekit.cloud https://*.livekit.cloud;
frame-src 'self';
media-src 'self' blob: mediastream:;
worker-src 'self' blob:;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

### Route Protection

| Layer | Status | Details |
|---|---|---|
| Server-side auth check | Implemented | `app/(main)/layout.tsx` -- server component wrapper calls `supabase.auth.getUser()`, redirects to `/login` if unauthenticated |
| Client-side fallback | Implemented | `useAuthStore` in client layout component redirects on session expiry |
| Auth callback validation | Implemented | `app/auth/callback/route.ts` validates `next` parameter -- must start with `/`, not `//`, no backslashes |

### Voice Authorization

| Control | Status | Details |
|---|---|---|
| Server membership check | Implemented | `app/api/daily/rooms/route.ts` verifies user is a member of the server before creating a Daily.co room. Non-members get 403 |
| Privacy audit logging | Implemented | Voice joins/leaves/mute changes logged |
| No audio recording | Implemented | Only metadata in DB -- confirmed in schema and code |

### Database Security

| Control | Status | Details |
|---|---|---|
| Row Level Security | Implemented | RLS enabled on ALL 30+ tables |
| Comprehensive policies | Implemented | SELECT, INSERT, UPDATE, DELETE policies on every table |
| Indexes | Implemented | Optimized for common query patterns |
| Service role isolation | Implemented | `SUPABASE_SERVICE_ROLE_KEY` used only server-side (account deletion). Never exposed to client |
| Realtime scoping | Implemented | Realtime enabled selectively: messages, DMs, voice sessions, voice participants, friend requests, family activity log |

---

## 4. Family Account Safety Architecture

### Monitoring Levels

| Level | Name | Parent Can See | Requires Approval |
|---|---|---|---|
| 1 | Minimal | Server list, friend list | None |
| 2 | Moderate | + Messages, DMs (manual view) | None |
| 3 | Supervised | + AI-flagged content alerts | Server joins, friend requests |
| 4 | Restricted | + Screen time limits, real-time alerts | All activity, whitelist only |

### Transparency Controls

- ALL parent actions are logged with timestamps in `family_activity_log`
- Teens see ALL monitoring activity in Settings > Family
- Teen badge visible to all chat participants
- `visible_to_child` is always TRUE -- no hidden monitoring
- Monitoring level indicator visible in teen UI

### Safety Features

- Keyword alert management (parent-configured)
- Time limit editor
- Screen time tracking (Recharts charts in parent dashboard)
- Voice metadata cards (who, when, duration -- NO audio)
- Content flag system (AI-flagged in supervised/restricted modes)
- Activity timeline

### Voice Ethics ("Gamer Code")

- Voice calls store ONLY metadata: call start/end timestamps, participant list, duration
- NO audio is recorded, transmitted to storage, or retained
- Both teens and parents see voice call logs (metadata only)
- This is a core ethical commitment, not a feature gap

---

## 5. Data Storage Inventory

### Cookies

| Cookie | Purpose | Duration | Set By |
|---|---|---|---|
| `sb-*-auth-token` | Supabase auth session | Session or 30 days (Remember Me) | Supabase SDK |
| `privacy-mode` | GPC/DNT signal detected | 1 year | `proxy.ts` |

### localStorage

| Key | Purpose | Cleared On |
|---|---|---|
| `bedrock-auth` | Persisted auth state (user profile, lockout state) | Logout / Account deletion |
| `bedrock-server` | Selected server/channel | Logout |
| `bedrock-ui` | Theme, collapsed sidebar states | Logout |
| `bedrock-remember-me` | Login persistence preference | Logout |
| `bedrock-consent` | Cookie consent choices (version, timestamps) | Manual clear |
| `bedrock-favorites` | Channel favorites | Logout |
| `bedrock-performance` | Performance metrics | Logout |

### Server-Side (Supabase PostgreSQL)

- All user data: profiles, messages, servers, channels, memberships, friends, DMs, family accounts, reports, settings
- 30+ tables with RLS
- Realtime subscriptions for 6 table types
- File attachments in Supabase Storage (`chat-attachments` bucket, 10MB limit, image/video/PDF/text)

### NOT Stored

- Audio recordings (voice calls)
- Analytics data
- Tracking data
- Device fingerprints
- Third-party cookies
- Behavioral profiles

---

## 6. Known Risks and Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| CSP still has `unsafe-inline` for scripts and styles | Medium | Required for Next.js hydration and inline styles. Nonce-based CSP is planned post-beta. `unsafe-eval` removed in production -- only `unsafe-inline` remains |
| COPPA verified consent not implemented | Medium | DB schema (`parental_consent` table) is ready. Age verification at signup exists. Full verified consent (credit card, signed form) needed before GA |
| NCMEC CyberTipline API not automated | Medium | Manual reporting possible via admin panel. ESP registration needed at `report.cybertip.org/ispws/` for API automation |
| In-memory rate limiter resets on deploy | Low | Supabase server-side auth rate limits are the primary protection. Client exponential backoff provides secondary layer. In-memory limiter is tertiary |
| Client-side lockout bypassable via localStorage clear | Low | Server-side Supabase rate limiting is the primary protection. Client lockout is defense-in-depth UX |
| E2E encryption not integrated | High | `lib/encryption.ts` exists with full Web Crypto implementation. Messages are currently plaintext in DB. Integration planned as HIGH priority post-beta |
| No MFA/2FA | Medium | Strong passwords + rate limiting + account lockout provide baseline. MFA planned as HIGH priority |
| No CAPTCHA | Medium | Rate limiting provides partial bot protection. Cloudflare Turnstile planned post-beta |
| No session inactivity timeout | Medium | Sessions persist until Supabase token expires. Idle detection changes presence status but does not logout. Timeout hook planned as HIGH priority |

---

## 7. Security Testing Checklist

### Authentication

- [ ] Brute-force login: verify rate limiting triggers after 5 rapid failures
- [ ] Account lockout: verify 15-minute lockout after 5 failures
- [ ] Password reset: verify token exchange, email delivery, new password works
- [ ] Expired reset token: verify error message displayed
- [ ] Weak password rejection: verify 8+ chars, mixed case, number required

### XSS / CSP

- [ ] Inject `<script>alert(1)</script>` in message content -- verify CSP blocks execution
- [ ] Verify production CSP does NOT contain `unsafe-eval`
- [ ] Verify `X-Content-Type-Options: nosniff` prevents MIME sniffing
- [ ] Verify `X-Frame-Options: DENY` prevents clickjacking

### Open Redirect

- [ ] `/auth/callback?code=xxx&next=//evil.com` -- verify redirect to default, not evil.com
- [ ] `/auth/callback?code=xxx&next=/\evil.com` -- verify backslash blocked
- [ ] `/auth/callback?code=xxx&next=https://evil.com` -- verify blocked (no leading `/`)
- [ ] `/auth/callback?code=xxx&next=/servers/abc/def` -- verify valid deep link works

### Voice Authorization

- [ ] Non-member requests voice room for server they don't belong to -- verify 403
- [ ] Unauthenticated request -- verify 401
- [ ] Member requests voice room -- verify success

### Database / RLS

- [ ] Direct Supabase query as User A to read User B's DMs -- verify RLS blocks
- [ ] Direct query to read reports table as non-admin -- verify RLS blocks
- [ ] Verify service role key is not exposed in any client-side bundle

### Headers

- [ ] Production: `curl -I https://yourdomain.com` -- verify HSTS header present
- [ ] Verify all security headers present in response
- [ ] Verify CSP includes all required sources (Supabase, Daily.co)

### File Upload

- [ ] Upload file > 10MB -- verify rejection
- [ ] Upload disallowed MIME type -- verify rejection
- [ ] Verify uploaded files accessible only via public URL (not guessable paths)

### Account Management

- [ ] Account deletion: verify all user data removed from all tables
- [ ] Account deletion: verify auth user removed from Supabase
- [ ] Account deletion: verify incorrect password is rejected
- [ ] Data export: verify all user data included in JSON download

### Family Safety

- [ ] Verify teen badge visible to all chat participants
- [ ] Verify parent actions logged in `family_activity_log`
- [ ] Verify teen can see monitoring activity
- [ ] Verify monitoring level changes propagate to teen UI
- [ ] Report CSAM content -- verify report created with escalated status
- [ ] Verify message content snapshot preserved in report even if original deleted
