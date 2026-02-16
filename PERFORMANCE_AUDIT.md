# Bedrock Chat - Performance & Reliability Audit

**Date:** 2026-02-16
**Auditor:** Claude Opus 4.6
**Method:** Exhaustive static code analysis
**Scope:** All stores (13), components (127+), route files, hooks, and utilities

---

## Executive Summary

Bedrock Chat's codebase demonstrates **excellent engineering discipline** overall. Zustand patterns, effect cleanup, and code splitting are handled correctly across nearly all files. The audit identified **14 actionable issues** (2 HIGH, 8 MEDIUM, 4 LOW) primarily in error boundary coverage, resource cleanup, accessibility semantics, and one remaining Zustand anti-pattern.

**Overall Grade: A-**

| Severity | Count |
|----------|-------|
| HIGH     | 2     |
| MEDIUM   | 8     |
| LOW      | 4     |

**Top 3 Priorities:**
1. Add `error.tsx` for the `/family` route group (6 unprotected sub-routes)
2. Fix `controllerchange` listener leak in service worker registration
3. Fix Zustand destructuring anti-pattern in signup page

---

## 1. Zustand State Management Audit

**Grade: A**

### 1.1 Selector Pattern Compliance

**Status: CLEAN** - 12 of 13 stores and all their consumers use the correct selector pattern.

All stores audited:
- `auth.store.ts` (492 lines) - Clean
- `server.store.ts` (549 lines) - Clean
- `message.store.ts` (403 lines) - Clean
- `ui.store.ts` (139 lines) - Clean
- `presence.store.ts` (325 lines) - Clean
- `member.store.ts` (190 lines) - Clean
- `voice.store.ts` (228 lines) - Clean
- `friends.store.ts` (321 lines) - Clean
- `dm.store.ts` (161 lines) - Clean
- `family.store.ts` (1112 lines) - Clean
- `favorites.store.ts` (134 lines) - Clean
- `consent.store.ts` (94 lines) - Clean
- `performance.store.ts` (132 lines) - Clean

60+ correct selector usages found across the codebase. Representative examples:

```tsx
// app/(main)/layout.tsx:46-49
const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
const user = useAuthStore((s) => s.user);
const isInitializing = useAuthStore((s) => s.isInitializing);
const serversInitialized = useServerStore((s) => s.isInitialized);
```

```tsx
// components/navigation/member-list/member-list-panel.tsx:29-32
const members = useMemberStore((s) => s.membersByServer[serverId] ?? EMPTY_MEMBERS);
const isLoading = useMemberStore((s) => s.loadingServers[serverId] ?? false);
const onlineUsers = usePresenceStore((s) => s.onlineUsers);
const currentUserId = useAuthStore((s) => s.user?.id);
```

### 1.2 PA-005: Signup Page Store Destructuring (MEDIUM)

**File:** `app/(auth)/signup/page.tsx:17-23`
**Impact:** Subscribes to entire auth store; any auth state change causes re-render of the signup form.

```tsx
// CURRENT (lines 17-23):
const {
    signUpWithEmail,
    resendConfirmationEmail,
    isLoading,
    error,
    clearError,
} = useAuthStore();
```

**Recommended Fix:**
```tsx
const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail);
const resendConfirmationEmail = useAuthStore((s) => s.resendConfirmationEmail);
const isLoading = useAuthStore((s) => s.isLoading);
const error = useAuthStore((s) => s.error);
const clearError = useAuthStore((s) => s.clearError);
```

### 1.3 useEffect Dependency Management

**Status: CLEAN** - All 40+ useEffect hooks properly managed. Zustand actions correctly excluded from dependency arrays with eslint-disable comments. DOM refs captured in closures rather than placed in deps.

Verified files:
- `app/(main)/layout.tsx:221-222` - Excludes `joinServer`, `leaveServer`
- `app/(main)/family/layout.tsx:37-38` - Excludes `init`
- `components/navigation/portal-overlay.tsx:37` - Excludes `endPortalTransition`
- `components/voice/voice-channel.tsx:84,92,167,182,202` - Excludes Daily.co callbacks
- `components/login/world-formation/world-formation.tsx:95,110` - Excludes `handleComplete`

---

## 2. Memory Leak Analysis

**Grade: B+**

### 2.1 PA-003: ServiceWorker Listener Not Cleaned (MEDIUM)

**File:** `components/pwa/service-worker-register.tsx:29-33`
**Impact:** The `controllerchange` event listener persists for the component's lifetime without cleanup. While this component typically lives for the entire session, it violates best practices.

```tsx
// CURRENT (lines 26-33 inside useEffect with no cleanup for this listener):
let refreshing = false;

navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
});
```

**Recommended Fix:**
```tsx
useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") {
        return;
    }

    let refreshing = false;

    const handleControllerChange = () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    // ... existing SW registration code ...

    return () => {
        navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
}, []);
```

### 2.2 PA-004: Typing Timeout Accumulation (MEDIUM)

**File:** `store/presence.store.ts:149-159`
**Impact:** Each incoming typing broadcast creates a `setTimeout(3000)` without cancelling the previous one for the same user. If a user types rapidly, multiple uncancelled timeouts accumulate. They eventually resolve but consume memory unnecessarily.

```tsx
// CURRENT (lines 149-159):
// Auto-clear typing after 3 seconds
setTimeout(() => {
    set((s) => ({
        typingUsers: {
            ...s.typingUsers,
            [channelId]: (s.typingUsers[channelId] || []).filter(
                (u) => u !== username,
            ),
        },
    }));
}, 3000);
```

**Recommended Fix:**
```tsx
// Add to store state:
_typingTimeouts: {} as Record<string, ReturnType<typeof setTimeout>>,

// In the broadcast handler:
const key = `${channelId}:${username}`;
const existing = get()._typingTimeouts[key];
if (existing) clearTimeout(existing);

const timeout = setTimeout(() => {
    set((s) => ({
        typingUsers: {
            ...s.typingUsers,
            [channelId]: (s.typingUsers[channelId] || []).filter((u) => u !== username),
        },
    }));
    const { [key]: _, ...rest } = get()._typingTimeouts;
    set({ _typingTimeouts: rest });
}, 3000);

set((s) => ({ _typingTimeouts: { ...s._typingTimeouts, [key]: timeout } }));
```

Also clear all timeouts in `leaveServer()`:
```tsx
leaveServer: () => {
    const { _typingTimeouts } = get();
    for (const t of Object.values(_typingTimeouts)) clearTimeout(t);
    // ... existing cleanup ...
}
```

### 2.3 Well-Managed Cleanup (Verified Clean)

The following resources are properly cleaned up:

| Resource | File | Cleanup Method |
|----------|------|---------------|
| Supabase message subscriptions | `store/message.store.ts` | `unsubscribeFromChannel()` with stored cleanup functions |
| Presence channel + reconnect interval | `store/presence.store.ts` | `leaveServer()` and `destroy()` methods |
| Daily.co call object | `lib/hooks/use-daily-call.ts` | `destroyCall()` with leave, destroy, and RNNoise cleanup |
| AbortController for voice join | `lib/hooks/use-daily-call.ts` | `abortRef.current?.abort()` on unmount |
| PerformanceObserver instances | `lib/performance/monitoring.ts` | All observers stored in array and `disconnect()`-ed |
| Idle detection listeners | `app/(main)/layout.tsx` | 5 event listeners with cleanup in useEffect return |
| Mouse/keyboard listeners | Multiple components | All wrapped in useEffect with proper cleanup |
| Timers (setTimeout) | `components/login/world-formation/world-formation.tsx` | Stored in `timersRef` and cleared in cleanup |
| Animation frames | `components/login/world-formation/particle-coalesce.tsx` | `cancelAnimationFrame(frameRef.current)` |

---

## 3. Error Boundary & Error Handling Audit

**Grade: B**

### 3.1 Error Boundary Coverage Map

| Route Group | error.tsx | loading.tsx | Status |
|---|---|---|---|
| `app/` (root) | `global-error.tsx` | N/A | Has issues (PA-002) |
| `app/(auth)/` | Yes | No | Missing loading.tsx (PA-010) |
| `app/(main)/` | Yes | Yes | Comprehensive |
| `app/parent-dashboard/` | Yes | Yes | Good |
| `app/(main)/family/*` | **No** | **No** | **Missing (PA-001)** |
| `app/(main)/data-export/` | No | No | Missing |
| `app/(main)/privacy-settings/` | No | No | Missing |

### 3.2 PA-001: Missing Error Boundary for Family Routes (HIGH)

**File:** `app/(main)/family/` (directory)
**Impact:** 6 sub-routes are unprotected: `/family/dashboard`, `/family/messages`, `/family/servers`, `/family/friends`, `/family/flags`, `/family/page`. Errors in any of these will bubble up to the `(main)` error boundary, which lacks family-specific recovery navigation.

**Recommended Fix:** Create `app/(main)/family/error.tsx`:
```tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function FamilyError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Family page error:", error);
    }, [error]);

    return (
        <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
                <h2 className="text-xl font-semibold text-white mb-2">
                    Something went wrong
                </h2>
                <p className="text-white/60 text-sm mb-6">{error.message}</p>
                <div className="flex gap-3 justify-center">
                    <button type="button" onClick={reset}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors">
                        Try Again
                    </button>
                    <Link href="/family/dashboard"
                        className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/15 transition-colors">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
```

### 3.3 PA-002: Global Error Lacks Navigation (HIGH)

**File:** `app/global-error.tsx` (entire file)
**Impact:** When the global error boundary triggers, users can only "Try Again" or "Reload". There is no way to navigate to login or home, leaving users trapped if the error persists.

**Recommended Fix:** Add a third button:
```tsx
<button
    type="button"
    onClick={() => (window.location.href = "/login")}
    style={{
        padding: "10px 24px",
        backgroundColor: "rgba(255,255,255,0.1)",
        color: "white",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 500,
    }}
>
    Go to Login
</button>
```

### 3.4 PA-008: Auth Callback Silent Failure (MEDIUM)

**File:** `app/auth/callback/route.ts:62`
**Impact:** When `exchangeCodeForSession` fails (expired link, invalid code), the user is silently redirected to `/login` with no error feedback.

```tsx
// CURRENT (line 62):
return NextResponse.redirect(`${origin}/login`);
```

**Recommended Fix:**
```tsx
return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
```

Then handle the query param in the login page to show a toast/banner.

### 3.5 Positive Findings

- Multi-level ErrorBoundary system in main layout wraps ServerList, ChannelList, MobileNav, MemberList individually
- Black screen detection with automatic recovery UI
- Error log persistence to localStorage (50-entry ring buffer)
- Auth error boundary includes "Back to Login" button

---

## 4. Navigation & Routing Analysis

**Grade: B+**

### 4.1 PA-009: Channels Redirect Uses Stale Auth State (MEDIUM)

**File:** `app/channels/page.tsx:11-20`
**Impact:** Redirects based on `isAuthenticated` from persisted Zustand state. If localStorage has stale auth but the Supabase session has expired, the user is redirected to `/friends`, then the `(main)` layout detects no auth and redirects to `/login` -- causing a visible double-redirect.

```tsx
// CURRENT (lines 11-20):
useEffect(() => {
    if (!isAuthenticated) {
        router.push("/login");
    } else {
        router.push("/friends");
    }
}, [isAuthenticated, router]);
```

**Recommended Fix:** Always redirect to `/friends` and let the `(main)` layout handle auth verification:
```tsx
useEffect(() => {
    router.push("/friends");
}, [router]);
```

### 4.2 PA-012: Silent Catch-All Redirect (LOW)

**File:** `app/(main)/[...catchAll]/page.tsx`
**Impact:** Unknown routes silently redirect to `/friends` without logging, making debugging harder.

**Recommended Fix:** Add a console warning:
```tsx
useEffect(() => {
    console.warn(`[Navigation] Unknown route "${pathname}" — redirecting to /friends`);
    router.replace("/friends");
}, [router, pathname]);
```

### 4.3 Positive Findings

- Channel page (`app/(main)/servers/[serverId]/[channelId]/page.tsx`) uses `mountedRef` and `hasRedirectedRef` to prevent post-unmount state updates and duplicate redirects
- Fallback logic tries to find a valid server/channel before falling back to `/friends`
- Mobile sidebars auto-close on route change (`app/(main)/layout.tsx:98-102`)

---

## 5. Accessibility Audit

**Grade: B-**

### 5.1 PA-006: Server List Missing `<nav>` Semantic Wrapper (MEDIUM)

**File:** `components/navigation/server-list/server-list.tsx:172`

```tsx
// CURRENT (line 172):
<div className="w-[72px] h-screen bg-[oklch(0.12_0.02_250)] flex flex-col ...">
```

**Recommended Fix:**
```tsx
<nav aria-label="Servers" className="w-[72px] h-screen bg-[oklch(0.12_0.02_250)] flex flex-col ...">
```

### 5.2 PA-007: Channel List Missing `<nav>` Semantic Wrapper (MEDIUM)

**File:** `components/navigation/channel-list/channel-list.tsx:204`

```tsx
// CURRENT (line 204):
<div className="w-60 h-screen bg-[oklch(0.15_0.02_250)] flex flex-col">
```

**Recommended Fix:**
```tsx
<nav aria-label="Channels" className="w-60 h-screen bg-[oklch(0.15_0.02_250)] flex flex-col">
```

### 5.3 PA-010: Missing Loading State for Auth Routes (MEDIUM)

**File:** `app/(auth)/` (directory)
**Impact:** No `loading.tsx` at the auth route group level. Login/signup pages handle their own loading, but there is no route-level fallback if the page chunk is slow to load.

**Recommended Fix:** Create `app/(auth)/loading.tsx` with a centered spinner matching the auth page style.

### 5.4 PA-013: OAuth Buttons Lack Disabled Context (LOW)

**File:** `components/login/login-form.tsx:98-143`
**Impact:** Google and GitHub OAuth buttons are `disabled` with `title="Coming soon"`, but screen readers may not announce the `title` attribute on disabled buttons.

**Recommended Fix:** Use `aria-disabled="true"` instead of `disabled` and add `aria-label`:
```tsx
<button
    aria-disabled="true"
    aria-label="Continue with Google (coming soon)"
    onClick={(e) => e.preventDefault()}
    ...
>
```

### 5.5 PA-014: Missing Focus-Visible Styles in Navigation (LOW)

**Files:** `components/navigation/server-list/server-list.tsx`, `components/navigation/channel-list/channel-list.tsx`
**Impact:** Interactive elements in navigation sidebars lack `focus-visible:outline-2` or `focus-visible:ring-2` styles, making keyboard navigation difficult to track visually.

**Recommended Fix:** Add `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2` to `ServerButton` and `ChannelItem` interactive elements.

### 5.6 Positive Findings

- Skip-to-content link implemented (`app/(main)/layout.tsx:283-288`) with `sr-only` / `focus:not-sr-only` pattern
- Toast component uses `aria-live="polite"` and `aria-atomic="true"`
- Reduced motion support via `@media (prefers-reduced-motion: reduce)` in `globals.css`
- Clickable divs correctly use `role="button"`, `tabIndex={0}`, and `onKeyDown` handlers
- Points animation uses `aria-live="polite"`
- `viewport` meta allows user scaling (`userScalable: true`, `maximumScale: 5`)

---

## 6. Bundle & Dependencies

**Grade: A-**

### 6.1 PA-011: @faker-js/faker in Production Dependencies (MEDIUM)

**File:** `package.json`
**Impact:** `@faker-js/faker` (~500KB+) is listed under `dependencies` rather than `devDependencies`. While it is not currently imported in any source file (verified by search), it remains a risk: any developer who imports it would unknowingly add ~500KB to the production bundle.

**Recommended Fix:**
```bash
pnpm remove @faker-js/faker
pnpm add -D @faker-js/faker
```

### 6.2 Positive Findings: Code Splitting

Heavy dependencies are properly lazy-loaded:

| Dependency | Load Strategy | File |
|-----------|---------------|------|
| Three.js / R3F | `next/dynamic` with `ssr: false` | Landing page hero section |
| Chat components | `React.lazy()` with `Suspense` | Channel page |
| MemberListPanel | `React.lazy()` | Main layout |
| Server management modals (4) | `React.lazy()` | Channel list |
| Recharts | `next/dynamic` with `ssr: false` | Parent dashboard pages |

Additional optimizations in place:
- React Compiler enabled (`next.config.ts: reactCompiler: true`)
- Dev sourcemaps disabled for faster compilation
- TanStack Virtual used for message list (prevents DOM node explosion)
- Constants and static data defined outside components

---

## 7. Mobile-Specific Audit

**Grade: A-**

| Area | Status | Details |
|------|--------|---------|
| Touch targets | Clean | `min-w-[44px] min-h-[44px]` on mobile nav; `touch-manipulation` CSS applied |
| Safe area insets | Clean | `env(safe-area-inset-bottom)` on mobile nav and sidebars |
| Mobile sidebar | Clean | Slide-over overlay with backdrop blur, spring animations, auto-close on route change |
| PWA | Clean | Service worker, manifest.json, Apple web app meta tags, update notification toast |
| Viewport | Clean | `userScalable: true`, `viewportFit: "cover"`, `maximumScale: 5` |
| Responsive layout | Clean | 3-column layout collapses to mobile view at appropriate breakpoint |

---

## 8. Consolidated Issue Table

| ID | Severity | Category | File | Lines | Description | Effort |
|----|----------|----------|------|-------|-------------|--------|
| PA-001 | HIGH | Error Handling | `app/(main)/family/` | N/A | Missing error.tsx for 6 family sub-routes | Small |
| PA-002 | HIGH | Error Handling | `app/global-error.tsx` | 43-76 | No navigation option (login/home) in global error | Small |
| PA-003 | MEDIUM | Memory | `components/pwa/service-worker-register.tsx` | 29-33 | `controllerchange` listener never cleaned up | Small |
| PA-004 | MEDIUM | Memory | `store/presence.store.ts` | 149-159 | Typing timeouts accumulate without cancellation | Medium |
| PA-005 | MEDIUM | Zustand | `app/(auth)/signup/page.tsx` | 17-23 | Store destructuring without selectors | Small |
| PA-006 | MEDIUM | Accessibility | `components/navigation/server-list/server-list.tsx` | 172 | Missing `<nav>` semantic wrapper | Small |
| PA-007 | MEDIUM | Accessibility | `components/navigation/channel-list/channel-list.tsx` | 204 | Missing `<nav>` semantic wrapper | Small |
| PA-008 | MEDIUM | Error Handling | `app/auth/callback/route.ts` | 62 | Auth callback failure gives no error feedback | Small |
| PA-009 | MEDIUM | Navigation | `app/channels/page.tsx` | 11-20 | Stale persisted auth can cause double-redirect | Small |
| PA-010 | MEDIUM | Loading | `app/(auth)/` | N/A | Missing loading.tsx for auth route group | Small |
| PA-011 | MEDIUM | Bundle | `package.json` | N/A | `@faker-js/faker` in prod dependencies (not imported but risky) | Small |
| PA-012 | LOW | Navigation | `app/(main)/[...catchAll]/page.tsx` | 10 | Silent redirect without logging | Trivial |
| PA-013 | LOW | Accessibility | `components/login/login-form.tsx` | 98-143 | Disabled OAuth buttons lack screen reader context | Small |
| PA-014 | LOW | Accessibility | `components/navigation/` | various | Missing `focus-visible` ring styles on nav items | Small |

---

## 9. Verified Clean Checklist

These areas were explicitly audited and found to have **no issues**:

- [x] Zustand selector patterns (12/13 stores clean, 60+ correct usages)
- [x] useEffect dependency arrays (40+ effects, all properly managed)
- [x] Event listener cleanup (10+ components verified with proper removeEventListener)
- [x] Supabase subscription lifecycle (message store, presence store)
- [x] Daily.co call cleanup (leave, destroy, RNNoise, AbortController)
- [x] PerformanceObserver cleanup (stored in array, all `disconnect()`-ed)
- [x] Timer cleanup (world-formation, points animation)
- [x] Animation frame cleanup (particle-coalesce)
- [x] React hydration safety (no nested buttons, `role="button"` pattern used)
- [x] Motion imports (all use `motion/react`, zero `framer-motion` imports)
- [x] Tailwind v4 compliance (no deprecated v3 utilities found)
- [x] Virtual scrolling for message list (TanStack Virtual)
- [x] Lazy loading for heavy components (Three.js, Recharts, modals, chat)
- [x] Skip-to-content link implemented
- [x] Reduced motion support via CSS media query
- [x] Mobile touch targets (44px minimum)
- [x] Safe area insets handled
- [x] PWA configuration (SW, manifest, meta tags)
- [x] OKLCH color system used consistently
- [x] State persistence to localStorage (server, UI, auth, consent stores)

---

## 10. Runtime Validation Required

The following areas **cannot be fully validated through static analysis** and require browser or build testing:

| Area | Test Method | Target |
|------|------------|--------|
| Bundle size (gzipped) | `pnpm build` + bundle analyzer | < 120KB |
| First Contentful Paint | Lighthouse | < 0.8s |
| Largest Contentful Paint | Lighthouse | < 2.5s |
| Time to Interactive | Lighthouse | < 1.5s |
| Total Blocking Time | Lighthouse | < 200ms |
| Cumulative Layout Shift | Lighthouse | < 0.1 |
| Lighthouse Performance Score | Lighthouse audit | > 95 |
| Lighthouse Accessibility Score | Lighthouse audit | > 95 |
| Memory (sustained use) | DevTools heap snapshots | < 100MB |
| Animation FPS | DevTools Performance tab | 60fps |
| WebSocket reconnection | Offline toggle in DevTools | Reconnect within 2s |
| 3D scene FPS (mobile) | Physical device test | > 40fps |
| Rapid channel switching | Manual test (10 rapid switches) | No stale data |

---

## 11. Optimization Recommendations

### Quick Wins (< 30 min each)
1. **PA-005**: Fix signup page Zustand destructuring (5 lines changed)
2. **PA-006/007**: Add `<nav>` wrappers to server-list and channel-list (2 lines each)
3. **PA-011**: Move `@faker-js/faker` to devDependencies (1 command)
4. **PA-012**: Add console.warn to catch-all redirect (1 line)

### Medium Effort (30 min - 2 hours)
1. **PA-001**: Create `app/(main)/family/error.tsx` (~30 lines)
2. **PA-002**: Add "Go to Login" button in global-error.tsx (~15 lines)
3. **PA-003**: Add cleanup return to service-worker-register useEffect
4. **PA-008**: Add error query param to auth callback redirect + handle in login page
5. **PA-010**: Create `app/(auth)/loading.tsx`

### Larger Effort (2+ hours)
1. **PA-004**: Implement typing timeout Map with cancellation in presence store
2. **PA-014**: Audit and add focus-visible styles across all navigation components

---

## Appendix A: Test Environment

- **OS:** Linux 6.8.0-1030-azure (GitHub Codespaces)
- **Platform:** Codespace container
- **Node:** (verify with `node --version`)
- **pnpm:** (verify with `pnpm --version`)
- **Analysis Method:** Static code analysis only (no runtime browser tests)

## Appendix B: Key Files Audited

| File | Lines | Significance |
|------|-------|-------------|
| `store/family.store.ts` | 1112 | Largest store, complex family management |
| `store/server.store.ts` | 549 | Server/channel selection with deduplication |
| `store/auth.store.ts` | 492 | Auth lifecycle, session management |
| `store/message.store.ts` | 403 | Real-time message subscriptions |
| `store/presence.store.ts` | 325 | Presence channels, typing indicators |
| `app/(main)/layout.tsx` | 340+ | Main layout with ErrorBoundaries, auth guard, idle detection |
| `app/global-error.tsx` | 81 | Global error boundary |
| `app/auth/callback/route.ts` | 63 | Email confirmation handler |
| `lib/hooks/use-daily-call.ts` | 600+ | Voice/video call lifecycle |
| `lib/performance/monitoring.ts` | 236 | Performance observer management |

---

**Audit Completed:** 2026-02-16
