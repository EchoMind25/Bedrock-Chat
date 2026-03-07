# Bedrock Chat — Post-Audit Implementation Checklist

**Generated:** March 4, 2026
**Companion to:** `docs/legal/COMPLIANCE_GAP_REPORT.md`

---

## Legal Documents (Completed March 4, 2026)

- [x] Privacy Policy rewritten at `/privacy-policy` — Version 2.0.0
  - [x] E2E encryption claim corrected (was misrepresenting active E2E — now honest about "library built, integration in progress")
  - [x] Data cards format for every data type collected
  - [x] Third-party service section with links to their privacy policies
  - [x] DPA status disclosed as "in progress"
  - [x] Complete data retention schedule table
  - [x] Breach notification procedures (72h GDPR, expedient COPPA)
  - [x] COPPA Section with age-tiered analytics protections
  - [x] GPC/DNT signal honoring disclosed
  - [x] All GDPR rights (Art. 15-21) enumerated
  - [x] All CCPA/CPRA rights enumerated
  - [x] Response SLA stated (72h ack, 30d resolution)
  - [x] Push notification data collection disclosed
  - [x] Content report / CSAM mandatory reporting disclosed
  - [x] International data transfer status disclosed
- [x] Terms of Use rewritten at `/terms-of-service` — Version 2.0.0
  - [x] E2E encryption claim corrected (same honest disclosure)
  - [x] Voice "Gamer Code" section with architectural enforcement explanation
  - [x] Law enforcement section (what we have, what we don't, our process)
  - [x] CSAM mandatory reporting to NCMEC stated
  - [x] Circumventing family monitoring added to prohibited activities
  - [x] De-anonymization attempts added to prohibited activities
  - [x] Family Account rights and responsibilities expanded
  - [x] Class action waiver enforceability caveat added
  - [x] Content ownership and AI training prohibition stated
  - [x] Service discontinuation notice period (90 days) stated
- [x] Compliance Gap Report at `docs/legal/COMPLIANCE_GAP_REPORT.md`
- [x] This checklist at `docs/legal/IMPLEMENTATION_CHECKLIST.md`
- [ ] All documents reviewed by legal counsel before publishing
- [ ] Bump `CURRENT_POLICY_VERSION` in `store/consent.store.ts` from `"1.0.0"` to `"2.0.0"` to trigger re-consent banner

---

## Critical (Before April 22, 2026 COPPA Deadline)

### GAP-COPPA-1: Verified Parental Consent

- [x] Implement email OTP verification for parental consent (Completed March 2026)
  - Parent enters email → receives 6-digit code → enters code to verify
  - Record `consent_method: "email"` in `parental_consent` table with `otp_verification_id`
  - Files: `app/api/family/consent/initiate/route.ts`, `app/api/family/consent/verify/route.ts`, `app/api/family/add-teen/route.ts`, `components/family/consent/ParentalConsentOTP.tsx`, `lib/otp.ts`, `lib/email.ts`, `lib/emails/otp-verification.ts`
- [ ] OR implement credit card micro-transaction verification
  - $0.50 charge and immediate refund as age/identity verification
  - Record `consent_method: "credit_card"` in `parental_consent` table
- [ ] Test the full consent flow end-to-end before enabling family accounts
- [x] Update `SECURITY-AND-COMPLIANCE.md` line 53 (Updated March 2026)

### GAP-COPPA-2: Age Gate on Standard Signup

- [ ] Add neutral age screen to standard signup flow
  - Present month/year selector (not leading questions per FTC guidance)
  - If under 13: redirect to Family Account creation flow or block with explanation
  - If 13-17: allow creation, encourage Family Account
  - File to modify: `app/(auth)/signup/page.tsx`
- [ ] Store age tier determination for analytics age-tier enforcement
- [ ] Do NOT store exact date of birth for standard accounts (COPPA data minimization)

### Pre-Launch Gate

- [ ] Enable `ENABLE_FAMILY_ACCOUNTS` in `lib/feature-flags.ts` only AFTER GAP-COPPA-1 and GAP-COPPA-2 are resolved
- [ ] Run full COPPA compliance test suite before enabling

---

## High Priority (Before Public Launch)

### GAP-GDPR-1: Data Processing Agreements

- [ ] Execute Supabase DPA (available at supabase.com/legal/dpa)
- [ ] Execute LiveKit DPA (contact sales@livekit.io)
- [ ] Execute Vercel DPA (available at vercel.com/legal/dpa)
- [ ] Store signed DPAs in `docs/legal/dpas/` directory
- [ ] Update privacy policy to confirm DPA status when complete

### GAP-GDPR-2: International Transfer Mechanism

- [ ] Incorporate Standard Contractual Clauses (SCCs) into DPAs with each sub-processor
- [ ] Document transfer impact assessments for US-based processing
- [ ] Update privacy policy Section 9 when complete

### GAP-CSAM-1: NCMEC CyberTipline Automation

- [ ] Register as Electronic Service Provider at `report.cybertip.org/ispws/`
- [ ] Implement API integration in `app/api/reports/route.ts` for auto-filing CSAM reports
- [ ] Include required fields: reporter info, upload date, apparent child victim info, relevant identifiers
- [ ] Test with NCMEC sandbox before production
- [ ] Update `SECURITY-AND-COMPLIANCE.md` line 65 when automated

### GAP-SEC-1: Multi-Factor Authentication

- [ ] Build TOTP setup flow using Supabase Auth MFA support
  - QR code display for authenticator app enrollment
  - Backup codes generation and download
  - MFA challenge on login
  - File to create: `app/(auth)/mfa-setup/page.tsx`
  - File to modify: `app/(auth)/login/page.tsx` (add MFA challenge step)
  - Store to modify: `store/auth.store.ts` (add MFA state)
- [ ] Update privacy policy and ToS to remove "planned" language
- [ ] Update `SECURITY-AND-COMPLIANCE.md` line 83

### E2E Encryption Integration (INFO-3, High Priority)

- [ ] Integrate `lib/encryption.ts` into message send pipeline
  - Encrypt message content client-side before sending to API
  - Store encrypted ciphertext in `messages.content` column
  - Distribute public keys via key exchange protocol
- [ ] Integrate into message receive pipeline
  - Decrypt ciphertext client-side after receiving from API/realtime
  - Handle key rotation and device management
- [ ] Handle edge cases: group chats (multi-recipient encryption), key recovery, device loss
- [ ] Update privacy policy Section 2 (Messages card) and Section 7 (Data Security) when deployed
- [ ] Update terms of service Section 10 (Privacy summary) when deployed
- [ ] Bump `CURRENT_POLICY_VERSION` again to trigger re-consent

---

## Medium Priority (Before or Shortly After Launch)

### GAP-COPPA-3: Consent Revocation UI

- [ ] Add "Revoke Consent" button to parent dashboard
  - Sets `revoked_at` timestamp in `parental_consent` table
  - Triggers teen account suspension or conversion to limited mode
  - File to modify: `components/family/dashboard/` area
- [ ] Handle downstream effects of revoked consent (data retention, access)

### GAP-COPPA-4: Keyword Alert Triggers

- [ ] Add message handler middleware that checks new messages against `family_keyword_alerts` table
  - Only for teens at monitoring Level 4 (Restricted)
  - Write matches to `family_keyword_matches` table (200-char snippet, not full message)
  - Send real-time notification to parent
  - File to create/modify: message handling pipeline
- [ ] Ensure keyword matching is transparent (logged in `family_activity_log`)

### GAP-COPPA-5: Time Limit Enforcement

- [ ] Add client-side timer that checks remaining time against `family_time_limits` table
  - Show warning at 10 minutes and 5 minutes remaining
  - Force graceful logout when time expires (save state, close voice calls)
  - Log screen time to `family_screen_time` table
  - File to modify: `app/(main)/layout-client.tsx` or equivalent
- [ ] Add server-side validation (API routes check time limit on requests from time-limited teens)

### GAP-SEC-2: CAPTCHA

- [ ] Integrate Cloudflare Turnstile on auth endpoints
  - Signup, login, password reset
  - File to modify: `app/(auth)/signup/page.tsx`, `app/(auth)/login/page.tsx`
  - API validation: `app/api/auth/` routes
- [ ] Invisible mode preferred (no user friction unless suspicious)

### DPO Formal Appointment (INFO-1)

- [ ] Formally appoint a Data Protection Officer
- [ ] Document appointment (name, contact, qualifications)
- [ ] Update privacy policy with formal DPO details

### CCPA Notice at Collection (INFO-2)

- [ ] Add notice at the point of data collection (signup flow)
  - Link to full privacy policy
  - State categories of data collected and purposes

---

## Low Priority (Post-Launch, Ongoing)

### Security Hardening

- [ ] GAP-SEC-3: Migrate CSP from `unsafe-inline` to nonce-based CSP
  - Requires Next.js configuration changes
  - Test thoroughly — can break hydration if misconfigured
- [ ] GAP-SEC-4: Implement session inactivity timeout
  - Log out after configurable idle period (e.g., 30 minutes)
  - Add hook: `hooks/useSessionTimeout.ts`
- [ ] Implement OAuth providers (Google, GitHub) for passwordless login
  - Supabase supports these natively
  - Reduces password-related attack surface

### Ongoing Compliance

- [ ] Set calendar: Quarterly privacy audit (review data flows, third-party services)
- [ ] Set calendar: April 22, 2026 — COPPA Rule update compliance deadline
- [ ] Set calendar: Annual privacy impact assessment
- [ ] Set calendar: Review data retention automation (verify purge jobs running)
- [ ] Penetration testing before public launch and annually thereafter
- [ ] Update legal documents on each significant feature launch
- [ ] Monitor state privacy law developments (Utah UCPA, Virginia CDPA, Colorado CPA, Connecticut CTDPA)

---

## Document Update Triggers

The following events require updating legal documents and bumping `CURRENT_POLICY_VERSION` in `store/consent.store.ts`:

| Event | Documents to Update |
|-------|-------------------|
| E2E encryption deployed to messages | Privacy Policy §2 (Messages card), §7; Terms §10 |
| MFA/2FA added | Privacy Policy §7; Terms §2.3 |
| Family accounts enabled (`ENABLE_FAMILY_ACCOUNTS = true`) | Both — remove "feature-flagged" language |
| New third-party service added | Privacy Policy §4 |
| Data retention periods changed | Privacy Policy §8 |
| NCMEC API automated | Terms §4 (can reference automated reporting) |
| OAuth login added | Privacy Policy §2 (Account card); Terms §2.3 |
| Self-hosted infrastructure migration | Privacy Policy §4 |

---

## Cookie Banner Verification

- [ ] Banner accurately reflects the 2 cookies and localStorage keys listed in policy
- [ ] "Reject All" functions correctly — verify no non-essential cookies fire after rejection
- [ ] Consent is recorded before any non-essential tracking fires
- [ ] Consent record stored with: what was consented to, when, policy version
- [ ] COPPA: No non-essential cookies for users under 13 regardless of consent setting
- [ ] GPC signal detected → non-essential collection auto-disabled (verify `proxy.ts` + `store/consent.store.ts`)
- [ ] Policy version change triggers re-consent banner

---

## Voice Metadata Verification

- [ ] Confirm no audio/video stream is recorded or stored (LiveKit configuration audit)
- [ ] Confirm only metadata is logged: room join/leave, duration, participant count, had_video, had_screen_share
- [ ] Confirm room names (`vc-{channelId}`) cannot be used to re-identify participants without database access
- [ ] Confirm voice token lifetime (4 hours) in `app/api/voice/token/route.ts`
- [ ] Confirm family monitoring of voice is metadata-only (who + when + how long, never audio content)
- [ ] Document LiveKit configuration for audit trail

---

**End of Checklist**
