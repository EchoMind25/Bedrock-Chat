# Bedrock Chat - Roadmap

**Last Updated:** 2026-02-16
**Status:** Beta Ready (pending final testing)

---

## 1. Current Status

| Metric | Value |
|---|---|
| Overall | BETA READY (pending final testing) |
| Feature completion | ~85% of total feature set |
| Blockers (6) | All resolved |
| Critical items (8) | All resolved |
| Remaining HIGH priority | 6 features |
| Performance audit issues | 14 identified, 14 resolved |

### What's Working

Messaging (real-time, reactions, virtual scroll, typing indicators), voice/video (Daily.co WebRTC, screen share, noise cancellation), servers (CRUD, roles, permissions, invites, drag-and-drop channels), family accounts (4 monitoring levels, transparency logging, parent dashboard), privacy compliance (GDPR consent, CCPA links, data export, cookie policy, privacy policy, account deletion), auth (login, signup, password reset, rate limiting, account lockout, strong passwords), security headers (HSTS, CSP without unsafe-eval in prod, X-Frame-Options, Referrer-Policy, Permissions-Policy), file uploads (Supabase Storage), CSAM/NCMEC reporting, custom email templates, server-side route protection.

---

## 2. Beta Launch Checklist

### Blockers (All Resolved)

| # | Item | Status |
|---|---|---|
| 1 | HSTS header enabled (production-conditional) | Done |
| 2 | CSP fixed (unsafe-eval removed from production) | Done |
| 3 | Voice room authorization check activated | Done |
| 4 | Auth callback redirect validation | Done |
| 5 | Password reset flow (store + page + login UI) | Done |
| 6 | Strong password validation (8+ chars, mixed case, number, strength indicator) | Done |

### Critical Items (All Resolved)

| # | Item | Status |
|---|---|---|
| 1 | Rate limiting (server-side + client exponential backoff) | Done |
| 2 | Account lockout (5 failures -> 15-min lockout, persisted) | Done |
| 3 | Account deletion API (GDPR Art. 17, password-confirmed, cascading) | Done |
| 4 | Server-side route protection (server component wrapper + client fallback) | Done |
| 5 | Cookie policy page + footer link fixed | Done |
| 6 | CSAM/NCMEC reporting (types, DB table, API, report dialog, message context menu) | Done |
| 7 | File upload backend (Supabase Storage, upload utility, file preview, attachments) | Done |
| 8 | Custom email templates (4 branded HTML templates for Supabase) | Done |

### Remaining Items

| # | Item | Priority | Status |
|---|---|---|---|
| 1 | Message search | HIGH | Not started |
| 2 | Read receipts | HIGH | Not started |
| 3 | E2E encryption integration | HIGH | Not started (library exists) |
| 4 | Platform admin panel | HIGH | Not started |
| 5 | Session inactivity timeout | HIGH | Not started |
| 6 | MFA/2FA support | HIGH | Not started |
| 7 | CAPTCHA/bot protection | MEDIUM | Not started |
| 8 | Message threads/replies | DEFERRED | Post-beta |
| 9 | Message pinning UI | DEFERRED | Post-beta |
| 10 | Rich embeds | DEFERRED | Post-beta |
| 11 | Easter eggs system | DEFERRED | Post-beta |
| 12 | Custom themes | DEFERRED | Post-beta |
| 13 | OAuth providers (Google, GitHub) | DEFERRED | Post-beta |

---

## 3. HIGH Priority Feature Guides

Each guide below is self-contained -- copy-paste ready for implementation with zero prior context.

---

### 3.1 Message Search

**Tech Stack:** Next.js 16.1, React 19.2, Zustand 5, Supabase (PostgreSQL full-text search), TypeScript 5.7
**Why:** Users need to find past messages. Without search, users must scroll through thousands of messages manually.

#### Current State

No search exists. `store/message.store.ts` loads messages per channel with no search action. No search UI in channel header.

#### Files to Create/Modify

| File | Action |
|---|---|
| `components/chat/search/search-bar.tsx` | CREATE -- Search input with debounce |
| `components/chat/search/search-results.tsx` | CREATE -- Results list |
| `store/search.store.ts` | CREATE -- Search state |
| `app/api/search/route.ts` | CREATE -- Server-side search endpoint |
| `components/chat/channel-header.tsx` | Add search toggle button |

#### Step-by-Step

**Step 1: Create full-text search index in Supabase**

```sql
ALTER TABLE messages ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_messages_search ON messages USING gin(search_vector);
```

**Step 2: Create search store**

```tsx
// store/search.store.ts
import { create } from "zustand";

interface SearchResult {
  messageId: string;
  channelId: string;
  channelName: string;
  content: string;
  authorName: string;
  createdAt: string;
  highlight: string;
}

interface SearchState {
  query: string;
  results: SearchResult[];
  isSearching: boolean;
  isOpen: boolean;
  setQuery: (query: string) => void;
  search: (serverId: string, query: string) => Promise<void>;
  setOpen: (open: boolean) => void;
  clearResults: () => void;
}

export const useSearchStore = create<SearchState>()((set) => ({
  query: "",
  results: [],
  isSearching: false,
  isOpen: false,
  setQuery: (query) => set({ query }),
  search: async (serverId, query) => {
    if (!query.trim()) {
      set({ results: [], isSearching: false });
      return;
    }
    set({ isSearching: true });
    try {
      const response = await fetch(
        `/api/search?serverId=${serverId}&q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      set({ results: data.results, isSearching: false });
    } catch {
      set({ isSearching: false });
    }
  },
  setOpen: (open) => set({ isOpen: open }),
  clearResults: () => set({ results: [], query: "" }),
}));
```

**Step 3: Create API endpoint**

```tsx
// app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const serverId = searchParams.get("serverId");
  const query = searchParams.get("q");

  if (!serverId || !query) return NextResponse.json({ results: [] });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll() {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("messages")
    .select("id, content, channel_id, user_id, created_at, profiles(username, display_name)")
    .textSearch("search_vector", query, { type: "websearch" })
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ results: data || [] });
}
```

**Step 4: Build search UI** -- Add search icon to channel header. Clicking opens a slide-in panel from the right. Debounce input by 300ms. Show results with message content, author, timestamp, channel. Clicking a result navigates to that message.

#### Testing Criteria

- [ ] Search icon in channel header opens search panel
- [ ] Debounced search triggers after 300ms
- [ ] Results show content, author, timestamp, channel
- [ ] Clicking a result navigates to the message
- [ ] Full-text search handles partial words
- [ ] Search respects server boundaries

#### Troubleshooting

- **No results:** Verify `search_vector` column populated -- `SELECT search_vector FROM messages LIMIT 5`
- **Slow:** GIN index handles most cases. For millions of messages, consider `pg_trgm`.
- **Zustand pattern:** Use selectors: `useSearchStore((s) => s.results)`

---

### 3.2 Read Receipts

**Tech Stack:** Next.js 16.1, React 19.2, Zustand 5, Supabase (Realtime), TypeScript 5.7
**Why:** Users want to know if messages have been seen. Standard feature in modern chat.

#### Current State

No read tracking exists. No read receipts table or client-side logic.

#### Files to Create/Modify

| File | Action |
|---|---|
| `store/read-receipts.store.ts` | CREATE -- Read receipt state |
| `app/api/read-receipts/route.ts` | CREATE -- Mark-as-read endpoint |
| `components/chat/message.tsx` | Show read indicators |
| `components/chat/message-list.tsx` | Track scroll for auto-read |

#### Step-by-Step

**Step 1: Create database table**

```sql
CREATE TABLE read_receipts (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL,
  last_read_message_id uuid REFERENCES messages(id),
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, channel_id)
);

ALTER TABLE read_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own receipts" ON read_receipts
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Server members can view receipts" ON read_receipts
  FOR SELECT USING (
    channel_id IN (
      SELECT c.id FROM channels c
      JOIN server_members sm ON sm.server_id = c.server_id
      WHERE sm.user_id = auth.uid()
    )
  );
```

**Step 2: Create read receipts store** -- Track unread counts per channel, last-read position. Use Supabase realtime to sync across devices.

**Step 3: Auto-marking** -- Use `IntersectionObserver` on the last message. When visible and user at bottom, update `last_read_message_id`. Debounce by 1 second to prevent excessive DB writes.

**Step 4: Display** -- Small avatar stack beneath last-read message (server messages). "Seen" text with timestamp (DMs). Unread count badge in channel list.

#### Testing Criteria

- [ ] Messages marked as read when scrolled into view
- [ ] Unread count in channel list
- [ ] Receipts sync across devices via Supabase realtime
- [ ] DMs show "Seen" indicator
- [ ] No excessive re-renders (use individual selectors per channel)

#### Troubleshooting

- **Excessive DB writes:** Batch updates -- update `last_read_message_id` once per scroll stop (1s debounce)
- **Re-render:** Use `useReadReceiptsStore((s) => s.unreadCount[channelId])`

---

### 3.3 E2E Encryption Integration

**Tech Stack:** Web Crypto API (AES-GCM, ECDH, P-256), IndexedDB for key storage
**Why:** Bedrock Chat markets as "privacy-first." E2E encryption ensures the server cannot read messages. Key differentiator from Discord.

#### Current State

`lib/encryption.ts` exists with AES-GCM/ECDH/PBKDF2 implementations but is NOT integrated into the message pipeline. Messages are plaintext in the database.

#### Files to Create/Modify

| File | Action |
|---|---|
| `lib/crypto/e2e.ts` | CREATE -- Core encrypt/decrypt using Web Crypto |
| `lib/crypto/key-exchange.ts` | CREATE -- ECDH key exchange for DMs |
| `lib/crypto/group-keys.ts` | CREATE -- Sender keys for channels |
| `store/crypto.store.ts` | CREATE -- Key storage and management |
| `store/message.store.ts` | Integrate encryption into send/receive |

#### Step-by-Step

**Step 1: Core crypto module**

```tsx
// lib/crypto/e2e.ts
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"]
  );
}

export async function deriveSharedSecret(
  privateKey: CryptoKey, publicKey: CryptoKey
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: publicKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptMessage(
  key: CryptoKey, plaintext: string
): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  return { ciphertext, iv };
}

export async function decryptMessage(
  key: CryptoKey, ciphertext: ArrayBuffer, iv: Uint8Array
): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv }, key, ciphertext
  );
  return new TextDecoder().decode(decrypted);
}
```

**Step 2: DM key exchange** -- Generate ECDH key pairs per user. Exchange public keys via `public_keys` table. Derive shared secret locally. Encrypt messages with AES-256-GCM.

**Step 3: Group channels** -- Use sender keys pattern: each member has a sending key shared with the group. Key rotation on member join/leave.

**Step 4: Message pipeline** -- Before sending: encrypt content. After receiving: decrypt. Store only ciphertext on server.

#### Testing Criteria

- [ ] Key generation produces valid ECDH pairs
- [ ] Key exchange produces identical shared secrets
- [ ] Encrypted messages decryptable by receiver
- [ ] Server only stores ciphertext
- [ ] Wrong keys fail gracefully
- [ ] < 5ms latency per message for encrypt/decrypt

#### Troubleshooting

- **Web Crypto unavailable:** Requires HTTPS (localhost is OK for dev). Check `crypto.subtle !== undefined`.
- **Lost keys:** If IndexedDB cleared, old messages unreadable. Consider password-encrypted key backup.
- **Complexity:** Start with DM-only E2E, add group encryption later.

---

### 3.4 Platform Admin Panel

**Tech Stack:** Next.js 16.1, React 19.2, Zustand 5, Supabase, TypeScript 5.7
**Why:** Platform needs admin tools for user management, report review (CSAM/NCMEC), content moderation, and system health. Without this, moderation requires direct Supabase dashboard access.

#### Current State

No admin panel. No `role` column on profiles table (only account types: standard/parent/teen).

#### Files to Create/Modify

| File | Action |
|---|---|
| `app/(main)/admin/layout.tsx` | CREATE -- Admin layout with role guard |
| `app/(main)/admin/page.tsx` | CREATE -- Dashboard (stats) |
| `app/(main)/admin/users/page.tsx` | CREATE -- User management |
| `app/(main)/admin/reports/page.tsx` | CREATE -- Report review |
| `app/(main)/admin/servers/page.tsx` | CREATE -- Server management |

#### Step-by-Step

**Step 1: Add admin role to profiles**

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'moderator', 'admin', 'superadmin'));
```

Make yourself admin: `UPDATE profiles SET role = 'admin' WHERE id = 'your-user-id';`

**Step 2: Admin layout with role guard**

```tsx
// app/(main)/admin/layout.tsx
"use client";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "superadmin") {
      router.push("/friends");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return null;

  return (
    <div className="flex h-full">
      <nav className="w-60 border-r border-white/10 p-4">
        {/* Dashboard, Users, Reports, Servers links */}
      </nav>
      <div className="flex-1 overflow-auto p-6">{children}</div>
    </div>
  );
}
```

**Step 3: Build pages** -- Dashboard: total users, active users, pending reports, server count. Users: search, view profiles, suspend/ban, change roles. Reports: pending reports, assign, resolve/escalate. Servers: list all, membership counts, delete abusive.

**Step 4: Server-side enforcement** -- Every admin API route must verify role:

```tsx
const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
if (profile?.role !== 'admin' && profile?.role !== 'superadmin') {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

#### Testing Criteria

- [ ] Non-admin users redirected from /admin routes
- [ ] API routes verify role server-side
- [ ] Dashboard shows accurate stats
- [ ] User management: search, view, role changes
- [ ] Report review integrates with reporting system
- [ ] All admin actions logged for audit

---

### 3.5 Session Inactivity Timeout

**Tech Stack:** React 19.2, Zustand 5, TypeScript 5.7
**Why:** Prevents unauthorized access from unattended computers. Currently the Supabase session lasts until refresh token expires (default: 1 week).

#### Current State

Idle detection exists (`useIdleDetection` in `app/(main)/layout.tsx`) -- changes presence to "idle" after 30s. Does NOT log the user out.

#### Files to Create/Modify

| File | Action |
|---|---|
| `lib/hooks/use-session-timeout.ts` | CREATE -- Inactivity timeout hook |
| `app/(main)/layout.tsx` | Integrate the hook |

#### Step-by-Step

**Step 1: Create the hook**

```tsx
// lib/hooks/use-session-timeout.ts
"use client";
import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/auth.store";

const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function useSessionTimeout(timeoutMs = DEFAULT_TIMEOUT_MS) {
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (isAuthenticated) logout();
    }, timeoutMs);
  }, [timeoutMs, isAuthenticated, logout]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);
}
```

**Step 2: Integrate**

```tsx
// In app/(main)/layout.tsx client component:
import { useSessionTimeout } from "@/lib/hooks/use-session-timeout";
useSessionTimeout(30 * 60 * 1000);
```

#### Testing Criteria

- [ ] After 30 min inactivity, user is logged out
- [ ] Any input (mouse, keyboard, scroll, touch) resets timer
- [ ] Timer cleared on unmount/logout
- [ ] Does not run for unauthenticated users

---

### 3.6 MFA/2FA Support

**Tech Stack:** Supabase Auth (TOTP), React 19.2, Zustand 5, TypeScript 5.7
**Why:** Even with strong passwords and lockout, compromised credentials allow access. MFA prevents this.

#### Current State

No MFA. Supabase supports TOTP-based MFA natively -- the client flow is not implemented.

#### Files to Create/Modify

| File | Action |
|---|---|
| `components/settings/tabs/security-tab.tsx` | CREATE -- MFA enrollment UI |
| `components/auth/mfa-challenge.tsx` | CREATE -- MFA challenge during login |
| `store/auth.store.ts` | Add `mfaRequired`, `verifyMfa` action |
| `components/login/login-form.tsx` | Handle MFA challenge response |

#### Step-by-Step

**Step 1: MFA enrollment in security settings**

```tsx
// components/settings/tabs/security-tab.tsx
const handleEnroll = async () => {
  const supabase = createClient();
  const { data } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Authenticator App",
  });
  if (data) {
    setQrCode(data.totp.qr_code); // Display QR for user to scan
    setFactorId(data.id);
  }
};

const handleVerify = async () => {
  const supabase = createClient();
  const challenge = await supabase.auth.mfa.challenge({ factorId });
  const verify = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.data.id,
    code: verifyCode,
  });
  // MFA enrolled on success
};
```

**Step 2: Handle MFA challenge during login**

```tsx
// In store/auth.store.ts login action:
const { data, error } = await supabase.auth.signInWithPassword({ email, password });

if (error?.message.includes("mfa")) {
  set({ isLoading: false, mfaRequired: true });
  return false;
}

// Add verifyMfa action:
verifyMfa: async (code) => {
  const supabase = createClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const factorId = factors?.totp?.[0]?.id;
  if (!factorId) { set({ error: "No MFA factor found" }); return false; }

  const { data: challenge } = await supabase.auth.mfa.challenge({ factorId });
  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  });

  if (error) { set({ error: "Invalid code" }); return false; }
  set({ mfaRequired: false });
  return true;
},
```

**Step 3: MFA challenge component** -- Show when `mfaRequired` is true. Single 6-digit input field. Submit calls `verifyMfa`. Use `motion/react` for entry animation.

**Step 4: Login form integration**

```tsx
const mfaRequired = useAuthStore((s) => s.mfaRequired);
// Render MfaChallenge when mfaRequired, otherwise render login form
```

#### Testing Criteria

- [ ] Enrollment generates scannable QR code
- [ ] QR works in Google Authenticator, Authy, 1Password
- [ ] Correct code enables MFA
- [ ] Login with MFA prompts for code
- [ ] Wrong code shows error
- [ ] MFA disableable from settings

#### Troubleshooting

- **QR not scanning:** `qr_code` from Supabase is a data URL SVG -- works in `<img>` tag
- **Clock skew:** TOTP is time-based. Show hint about device clock if verification fails.
- **Zustand:** Use selector `useAuthStore((s) => s.mfaRequired)`, never destructure.

---

## 4. Performance Fixes (All Resolved)

From the Performance & Reliability Audit (2026-02-16). All 14 issues resolved as of 2026-02-16.

| ID | Severity | File | Issue | Status |
|---|---|---|---|---|
| PA-001 | HIGH | `app/(main)/family/error.tsx` | Missing `error.tsx` for family sub-routes | Done |
| PA-002 | HIGH | `app/global-error.tsx` | No navigation option in global error | Done |
| PA-003 | MEDIUM | `components/pwa/service-worker-register.tsx` | `controllerchange` listener never cleaned up | Done |
| PA-004 | MEDIUM | `store/presence.store.ts` | Typing timeouts accumulate without cancellation | Done |
| PA-005 | MEDIUM | `app/(auth)/signup/page.tsx` | Zustand store destructuring without selectors | Done |
| PA-006 | MEDIUM | `components/navigation/server-list/server-list.tsx` | Missing `<nav>` semantic wrapper | Done |
| PA-007 | MEDIUM | `components/navigation/channel-list/channel-list.tsx` | Missing `<nav>` semantic wrapper | Done |
| PA-008 | MEDIUM | `app/auth/callback/route.ts` | Auth callback silent failure | Done |
| PA-009 | MEDIUM | `app/channels/page.tsx` | Stale auth can cause double-redirect | Done |
| PA-010 | MEDIUM | `app/(auth)/loading.tsx` | Missing `loading.tsx` | Done |
| PA-011 | MEDIUM | `package.json` | `@faker-js/faker` in prod dependencies | Done |
| PA-012 | LOW | `app/(main)/[...catchAll]/page.tsx` | Silent redirect without logging | Done |
| PA-013 | LOW | `components/login/login-form.tsx` | Disabled OAuth buttons lack screen reader context | Done |
| PA-014 | LOW | `components/navigation/` | Missing `focus-visible` ring styles | Done |

---

## 5. Future Roadmap (Post-Beta)

| Feature | Notes |
|---|---|
| Self-hosting migration | Replace Supabase/Daily.co/Vercel with dedicated hardware (PostgreSQL, Redis, MinIO, custom WebRTC) |
| Message threads/replies | Thread UI on messages |
| Rich embeds | Link previews, media embeds |
| OAuth providers | Google, GitHub (privacy-conscious consent) |
| CAPTCHA/bot protection | Cloudflare Turnstile (privacy-friendly) |
| Server discovery improvements | Browse by category, search with filters |
| Mobile app | React Native or PWA enhancement |
| Points/engagement polish | Shop, leaderboards, streaks |
| Nonce-based CSP | Replace `unsafe-inline` with nonces for maximum XSS protection |
| COPPA verified consent | Implement verified parental consent mechanism (DB schema ready) |
| NCMEC CyberTipline API | Automated CSAM reporting (currently manual, API registration needed) |

---

## 6. Deferred Items (Accepted for Beta)

| Item | Reason |
|---|---|
| Message threads/replies | Feature gap only, text messaging works |
| Message pinning UI | DB field exists, no UI needed for beta |
| Rich embeds | Nice-to-have, not blocking |
| Easter eggs system | Engagement feature, not critical |
| Custom themes | Theme system exists, custom editor deferred |
| Onboarding portal animation polish | Functional, cosmetic polish deferred |
| Profile themes | Nice-to-have |
| OAuth providers | Email/password sufficient for beta |
