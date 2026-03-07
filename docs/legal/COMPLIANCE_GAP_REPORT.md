# Bedrock Chat — Compliance Gap Report

**Generated:** March 4, 2026
**Audit Scope:** Full codebase privacy audit covering GDPR, CCPA/CPRA, COPPA, FTC Act §5, 18 U.S.C. §2258A
**Methodology:** Automated codebase search + manual code review of all tracking, analytics, data collection, family monitoring, and third-party integrations
**Disclaimer:** This is a technical audit, not legal advice. Legal counsel review is recommended before publishing any legal documents or making compliance claims.

---

## Executive Summary

Bedrock Chat has a genuinely strong privacy-by-design architecture: zero third-party analytics, anonymous in-house analytics with age-tiered collection, database-enforced transparent family monitoring, and comprehensive data rights implementation (export + deletion). However, the audit identified **1 critical misrepresentation** and **several gaps** that must be addressed before public launch and the April 22, 2026 COPPA update deadline.

**Overall posture:** Strong foundation with specific gaps in verified consent, E2E encryption claims, and sub-processor formalization.

---

## Critical Gaps

### GAP-FTC-1: E2E Encryption Misrepresentation (CRITICAL)

- **Regulation:** FTC Act §5 (deceptive practices)
- **Risk:** High — claiming a security feature exists when it does not is a textbook FTC §5 violation
- **Finding:** The privacy policy (`app/privacy-policy/page.tsx` lines 126-128, 217-241) and terms of service (`app/terms-of-service/page.tsx` lines 392-394) both claimed that messages are end-to-end encrypted using AES-GCM. However, `SECURITY-AND-COMPLIANCE.md` line 20 explicitly states: *"NOT integrated into message pipeline — messages are plaintext in DB."* The encryption library exists at `lib/encryption.ts` (ECDH P-256 + AES-256-GCM + HKDF + PBKDF2) but has never been integrated into the message send/receive pipeline.
- **Status:** **FIXED** in the March 4, 2026 policy rewrite (Version 2.0.0). Both documents now state: "We have built an end-to-end encryption library and are actively working to integrate it. Currently, messages are not yet end-to-end encrypted between users."
- **Remediation deadline:** Immediate (completed)

### GAP-COPPA-1: Verified Parental Consent Incomplete (CRITICAL)

- **Regulation:** COPPA (16 CFR §312.5), April 22, 2026 COPPA Rule update
- **Risk:** High — without verified parental consent, collecting data from under-13 users violates COPPA
- **Finding:** The `parental_consent` table exists in the database with a `consent_method` column supporting `email`, `credit_card`, `id_verification`, and `signed_form`. However, only `signed_form` is currently implemented (`app/api/family/add-teen/route.ts` line 237). The parent simply checks a checkbox. No email OTP verification, credit card micro-transaction, or government ID verification is implemented. Source: `SECURITY-AND-COMPLIANCE.md` line 53.
- **Mitigating factor:** Family accounts are feature-flagged off (`lib/feature-flags.ts`: `ENABLE_FAMILY_ACCOUNTS = false`), so no under-13 accounts can currently be created. This effectively defers COPPA liability for beta.
- **Remediation deadline:** Before enabling `ENABLE_FAMILY_ACCOUNTS` AND before April 22, 2026

---

## High Priority Gaps

### GAP-COPPA-2: No Age Gate on Standard Signup

- **Regulation:** COPPA, FTC guidance on age screening
- **Risk:** A user under 13 could create a standard (non-family) account with no age verification
- **Finding:** The signup flow (`app/(auth)/signup/page.tsx`) allows account creation without providing a date of birth. Age verification only exists in the Family Account teen creation flow. A minor could bypass COPPA protections by creating a standard account.
- **Mitigating factor:** Family accounts are flagged off, and the platform is in beta without public marketing to children
- **Remediation deadline:** Before public launch

### GAP-GDPR-1: No Data Processing Agreements with Sub-Processors

- **Regulation:** GDPR Art. 28 (processor obligations)
- **Risk:** Medium-High — processing EU personal data through sub-processors without DPAs is non-compliant
- **Finding:** No signed or referenced DPAs with Supabase, LiveKit, or Vercel found in the codebase or documentation. These providers likely have standard DPAs available, but they need to be formally executed and documented.
- **Remediation deadline:** Before processing EU user data (public launch)

### GAP-GDPR-2: No International Data Transfer Mechanism

- **Regulation:** GDPR Chapter V (transfers to third countries)
- **Risk:** Medium — EU-to-US data transfers require Standard Contractual Clauses or equivalent
- **Finding:** The privacy policy states data "may be processed in the United States" but no transfer mechanism (SCCs, adequacy decision, binding corporate rules) is documented.
- **Remediation deadline:** Before processing EU user data (public launch)

### GAP-CSAM-1: NCMEC CyberTipline API Not Automated

- **Regulation:** 18 U.S.C. §2258A (mandatory CSAM reporting)
- **Risk:** Medium-High — electronic service providers are legally required to report CSAM to NCMEC
- **Finding:** A content reporting system exists (`components/chat/report-dialog.tsx`, `app/api/reports/route.ts`) with CSAM as a report type that is auto-escalated. However, the NCMEC CyberTipline API integration is not automated. Reports must be filed manually. Source: `SECURITY-AND-COMPLIANCE.md` line 65.
- **Remediation deadline:** Before public launch. API registration needed at `report.cybertip.org/ispws/`

### GAP-SEC-1: No Multi-Factor Authentication

- **Regulation:** GDPR Art. 32 (security of processing), industry best practice
- **Risk:** Medium — account compromise risk without MFA
- **Finding:** Supabase supports TOTP natively, but the client flow is not built. Source: `SECURITY-AND-COMPLIANCE.md` line 83. Current mitigations: strong password requirements, rate limiting, account lockout after 5 failures.
- **Remediation deadline:** High priority, before public launch

---

## Medium Priority Gaps

### GAP-COPPA-3: Consent Revocation UI Missing

- **Regulation:** COPPA (16 CFR §312.6 — parental right to revoke consent)
- **Finding:** The `parental_consent` table has a `revoked_at` column, but no UI exists for parents to formally revoke consent (as distinct from deleting the teen account).
- **Remediation deadline:** Before enabling family accounts

### GAP-COPPA-4: Keyword Alert Triggers Not Implemented

- **Regulation:** COPPA parental controls
- **Finding:** The `family_keyword_alerts` table and `family_keyword_matches` table exist in the database schema. Parents can configure keywords via the dashboard. However, no trigger exists in message handlers to actually scan messages against keyword lists.
- **Remediation deadline:** Before enabling family accounts at Level 4 (Restricted)

### GAP-COPPA-5: Time Limit Enforcement Not Implemented

- **Regulation:** COPPA parental controls
- **Finding:** The `family_time_limits` and `family_screen_time` tables exist. Parents can configure time limits. However, no enforcement exists in the client or server to actually log out or restrict access when time limits are exceeded.
- **Remediation deadline:** Before enabling family accounts at Level 4 (Restricted)

### GAP-SEC-2: No CAPTCHA on Auth Endpoints

- **Regulation:** Security best practice
- **Finding:** No bot protection on authentication endpoints. Rate limiting provides partial protection. Cloudflare Turnstile planned. Source: `SECURITY-AND-COMPLIANCE.md` line 84.
- **Remediation deadline:** Before public launch

### GAP-SEC-3: CSP Contains unsafe-inline

- **Regulation:** Security best practice
- **Finding:** Content Security Policy (`proxy.ts`) allows `unsafe-inline` for scripts and styles. Required for Next.js hydration and inline styles. `unsafe-eval` is removed in production. Nonce-based CSP is planned post-beta. Source: `SECURITY-AND-COMPLIANCE.md` line 95.
- **Remediation deadline:** Post-beta

### GAP-SEC-4: No Session Inactivity Timeout

- **Regulation:** Security best practice
- **Finding:** Sessions persist until Supabase refresh token expires (default: 1 week). No idle timeout logs users out. Presence status changes on idle, but session remains active. Source: `SECURITY-AND-COMPLIANCE.md` line 85.
- **Remediation deadline:** Post-launch

---

## Informational (Best Practice)

### INFO-1: DPO Not Formally Appointed

- **Finding:** Email addresses `dpo@bedrock-chat.com` exist in policy documents, but no formal DPO appointment is documented. GDPR Art. 37 requires formal appointment for certain data controllers.
- **Recommendation:** Formally appoint and document a DPO before processing significant EU user data.

### INFO-2: No Separate "Notice at Collection" for CCPA

- **Finding:** CCPA requires a "Notice at Collection" that may be separate from the privacy policy. Currently, collection practices are disclosed only in the privacy policy.
- **Recommendation:** Consider a separate notice at the point of data collection (signup flow).

### INFO-3: E2E Encryption Integration Priority

- **Finding:** `lib/encryption.ts` implements a complete E2E encryption system (ECDH P-256 + AES-256-GCM + HKDF + PBKDF2 + IndexedDB key storage). This is production-quality code that is ready for integration. Given the privacy-first brand positioning, deploying this should be the highest engineering priority.
- **Recommendation:** Integrate before public launch. Update privacy policy and ToS version when deployed.

---

## Data Flow Inventory

### Data Collected (with code evidence)

| Data Type | Collection Point | Storage Location | Retention | Linked to User? | COPPA Trigger? |
|-----------|-----------------|------------------|-----------|-----------------|----------------|
| Username, email, password hash | Signup flow | `profiles` table (Supabase) | While active + 30d | Yes | Yes (parental consent) |
| Display name, avatar, bio | Profile settings | `profiles` table | While active + 30d | Yes | Yes |
| Date of birth | Teen account creation | `profiles.date_of_birth` + `auth.users.user_metadata` | While active | Yes | Yes (COPPA age calc) |
| Messages | Message send | `messages` table | Until deleted | Yes | Yes |
| File uploads | Message attachment | `chat-attachments` storage bucket (10MB limit) | Until deleted | Yes | Yes |
| Reactions | Emoji reaction | `message_reactions` table | Until deleted | Yes | No |
| Voice metadata | Call join/leave | `voice_sessions`, `voice_participant_log` tables | 90 days | Yes | Yes (family oversight) |
| DMs | Direct message send | `direct_messages` table | Until deleted | Yes | Yes |
| Friend list | Friend request | `friendships`, `friend_requests` tables | While active | Yes | Yes |
| Server membership | Join server | `server_members` table | While member | Yes | Yes |
| Page views (anonymized) | Page navigation | `analytics.raw_events` table | 30 days (auto-purge) | No | No (disabled < 13) |
| Feature usage | Feature interaction | `analytics.raw_events` table | 30 days (auto-purge) | No | No (disabled < 15) |
| Performance metrics | Page load | `analytics.raw_events` table | 30 days (auto-purge) | No | No (disabled < 15) |
| Errors (sanitized) | JS/API error | `analytics.error_events` table | 30 days (auto-purge) | No | No (disabled < 13) |
| Session token | Session start | `sessionStorage` (browser) | Tab close | No | No (disabled < 13) |
| Bug reports | User submission | `analytics.bug_reports` table | Until resolved + 12mo | Optional (opt-in) | No |
| Content reports | User report | `reports` table | As required by law | Yes (reporter) | Yes (CSAM reporting) |
| Push subscriptions | Notification permission | `push_subscriptions` table | Until unsubscribed | Yes | No |
| Family monitoring logs | Parent action | `family_activity_log` table | While family active | Yes | Yes (transparency) |
| Consent preferences | Consent banner | `localStorage` (`bedrock-consent`) | Until cleared | No (local only) | No |
| IP address | API request | Ephemeral (rate-limit key only) | Not stored | No | No |

### Third-Party Service Assessment

| Service | Data They Receive | DPA Status | COPPA Compliant? | Data Residency |
|---------|-------------------|------------|-------------------|----------------|
| Supabase | All database data, auth tokens, file uploads | **Not documented** (gap) | Conditional (requires DPA) | US (configurable) |
| LiveKit | User identity, room name, audio/video streams (real-time only, not stored) | **Not documented** (gap) | Conditional (metadata only) | US |
| Vercel | HTTP requests, static assets (no analytics) | **Not documented** (gap) | Yes (hosting only) | US/Global CDN |

---

## Compliance Status by Regulation

### GDPR

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Explicit opt-in consent | Implemented | `components/consent/consent-banner.tsx` |
| Right to access (Art. 15) | Implemented | `lib/data-export.ts` → JSON download |
| Right to erasure (Art. 17) | Implemented | `app/api/account/delete/route.ts` → cascading delete |
| Right to portability (Art. 20) | Implemented | Same data export (JSON) |
| Consent versioning | Implemented | `store/consent.store.ts` with policy version tracking |
| DPAs with processors (Art. 28) | **GAP** | Not documented with Supabase, LiveKit, Vercel |
| International transfers (Ch. V) | **GAP** | No SCCs documented |
| DPO appointment (Art. 37) | **GAP** | Email exists, formal appointment not documented |
| Breach notification (Art. 33-34) | Documented in policy | 72-hour timeline stated |

### CCPA/CPRA

| Requirement | Status | Evidence |
|-------------|--------|----------|
| "Do Not Sell" link | Implemented | Footer link to `/privacy-settings?section=ccpa` |
| Honor GPC signals | Implemented | `proxy.ts` reads `Sec-GPC` header |
| Privacy settings page | Implemented | `/privacy-settings` |
| Right to know | Implemented | Data export |
| Right to delete | Implemented | Account deletion |
| Right to non-discrimination | Implemented | Opt-out has no penalty |

### COPPA

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Age verification | Partial | Only in Family Account flow, not standard signup |
| Verifiable parental consent | **GAP** | Only "signed_form" (checkbox), no verified method |
| Parental access to data | Implemented | Parent dashboard + data export |
| Parental deletion rights | Implemented | Account deletion |
| No behavioral ads to minors | Implemented | No ads at all |
| Minimal data collection | Implemented | Analytics disabled for under-13 |
| Third-party sharing restrictions | Implemented | No third-party analytics |

### 18 U.S.C. §2258A (CSAM)

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Reporting mechanism | Implemented | `components/chat/report-dialog.tsx` |
| Report types include CSAM | Implemented | `lib/types/report.ts` |
| Content snapshot preserved | Implemented | `reports` table preserves snapshot |
| CSAM auto-escalation | Implemented | `app/api/reports/route.ts` |
| NCMEC CyberTipline API | **GAP** | Manual reporting only |

---

## Risk Matrix (Priority Order)

| ID | Description | Severity | Regulation | Deadline |
|----|-------------|----------|------------|----------|
| GAP-FTC-1 | E2E encryption misrepresentation in policies | Critical | FTC §5 | **FIXED** (Mar 4, 2026) |
| GAP-COPPA-1 | Verified parental consent not implemented | Critical | COPPA | Before Apr 22, 2026 |
| GAP-COPPA-2 | No age gate on standard signup | High | COPPA | Before public launch |
| GAP-GDPR-1 | No DPAs with sub-processors | High | GDPR Art. 28 | Before public launch |
| GAP-GDPR-2 | No international transfer mechanism | High | GDPR Ch. V | Before public launch |
| GAP-CSAM-1 | NCMEC API not automated | High | 18 U.S.C. §2258A | Before public launch |
| GAP-SEC-1 | No MFA/2FA | High | GDPR Art. 32 | Before public launch |
| GAP-COPPA-3 | Consent revocation UI missing | Medium | COPPA | Before enabling family accounts |
| GAP-COPPA-4 | Keyword alert triggers missing | Medium | COPPA controls | Before family accounts Level 4 |
| GAP-COPPA-5 | Time limit enforcement missing | Medium | COPPA controls | Before family accounts Level 4 |
| GAP-SEC-2 | No CAPTCHA | Medium | Best practice | Before public launch |
| GAP-SEC-3 | CSP unsafe-inline | Medium | Best practice | Post-beta |
| GAP-SEC-4 | No session inactivity timeout | Medium | Best practice | Post-launch |

---

**End of Report**
