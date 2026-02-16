# Bedrock Chat - Developer Reference

**Last Updated:** 2026-02-16
**Status:** Beta Ready (pending final testing)
**Maintained By:** Braxton Seegmiller

---

## 1. Project Overview

Bedrock Chat is a privacy-first Discord alternative built for families with teens. Created in response to Discord's controversial ID verification and facial recognition requirements, it offers transparent Family Account monitoring without platform data harvesting. Core philosophy: **privacy is not a feature -- it's the foundation.**

The platform uses a dark-themed liquid glass morphism design with spring-physics animations. It supports real-time messaging, voice/video via WebRTC, server/channel management with role-based permissions, and a comprehensive family monitoring system with four transparency levels. Voice calls store metadata only (timestamps, participants, duration) -- never audio recordings.

**Current deployment:** Vercel (frontend) + Supabase (auth, DB, realtime, storage) + Daily.co (voice/video). All three are temporary -- the target is fully self-hosted infrastructure.

---

## 2. Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.1.x | Framework (Turbopack, `proxy.ts`, Cache Components) |
| React | 19.2.x | UI (Activity API, refs as props, React Compiler) |
| TypeScript | 5.7.x | Language (strict mode) |
| Tailwind CSS | 4.1.x | Styling (CSS-first `@theme` directive, OKLCH colors) |
| Motion | 12.34.0 | Animation (`motion/react`, NOT `framer-motion`) |
| Zustand | 5.x | State management (persist, devtools middleware) |
| Supabase | 2.95.x | Auth, PostgreSQL, Realtime, Storage |
| @supabase/ssr | latest | Server-side Supabase client |
| Daily.co | 0.87.x | WebRTC voice/video |
| TanStack Virtual | 3.13.x | Virtual scrolling (`useFlushSync: false` for React 19) |
| @dnd-kit | 6.3.x | Drag-and-drop (channel reordering) |
| Recharts | 3.7.x | Charts (parent dashboard) |
| Three.js | 0.182.x | 3D landing page hero |
| @react-three/fiber | 9.5.x | React Three.js bindings |
| @react-three/drei | 10.7.x | Three.js helpers |
| Biome | 1.9.x | Linting + formatting (replaces ESLint + Prettier) |
| pnpm | latest | Package manager |

---

## 3. Critical Coding Patterns

### 3.1 Zustand Selectors (ALWAYS use arrow functions)

```tsx
// CORRECT -- subscribe to specific values
const user = useAuthStore((s) => s.user);
const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
const logout = useAuthStore((s) => s.logout);

// WRONG -- subscribes to entire store, causes unnecessary re-renders
const { user, isAuthenticated, logout } = useAuthStore();
```

For multiple values, use `useShallow`:

```tsx
import { useShallow } from "zustand/react/shallow";

const { user, isAuthenticated } = useAuthStore(
  useShallow((s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }))
);
```

### 3.2 Motion Imports

```tsx
// CORRECT
import { motion, AnimatePresence } from "motion/react";

// WRONG (deprecated package)
import { motion } from "framer-motion";
```

Standard spring config:

```tsx
const springConfig = { type: "spring", stiffness: 260, damping: 20, mass: 1 };
```

### 3.3 Tailwind CSS 4.x

Theme tokens in `app/globals.css` using `@theme`:

```css
@import 'tailwindcss';

@theme {
  --color-primary: oklch(0.65 0.25 265);
  --color-background-dark: oklch(0.12 0.02 285);
}
```

Custom utilities use `@utility` (NOT `@layer utilities`):

```css
@utility glass {
  backdrop-filter: blur(12px);
  background-color: oklch(0.15 0.02 285 / 0.7);
}
```

**Renamed utilities (v3 -> v4):**

| Old (v3) | New (v4) |
|---|---|
| `flex-shrink-0` | `shrink-0` |
| `outline-none` | `outline-hidden` |
| `shadow-sm` | `shadow-xs` |
| `blur-sm` | `blur-xs` |
| `backdrop-blur-sm` | `backdrop-blur-xs` |

No `tailwind.config.ts` exists -- all config is CSS-first via `@theme` in `globals.css`.

### 3.4 React 19 Patterns

- Refs as props (no `forwardRef`)
- Let React Compiler handle memoization (minimal `useMemo`/`useCallback`)
- `use()` for async params in Next.js server components
- `reactCompiler: true` in `next.config.ts`

### 3.5 useEffect Dependency Rules

**Exclude Zustand actions from deps** (stable references, but selector may return new ref):

```tsx
const setTyping = useMessageStore((s) => s.setTyping);

useEffect(() => {
  setTyping(channelId, username);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [channelId, username]); // Exclude setTyping
```

**Exclude DOM nodes from deps** (capture in closure):

```tsx
useEffect(() => {
  if (!scrollElement) return;
  const handleScroll = () => { /* ... */ };
  scrollElement.addEventListener('scroll', handleScroll);
  return () => scrollElement.removeEventListener('scroll', handleScroll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Empty deps -- scrollElement captured in closure
```

**NEVER set state during render** (always wrap in useEffect):

```tsx
// WRONG -- infinite loop
if (someCondition) setState(value);

// CORRECT
useEffect(() => {
  if (someCondition) setState(value);
}, [someCondition]);
```

### 3.6 proxy.ts (NOT middleware.ts)

Next.js 16 deprecated `middleware.ts`. Use `proxy.ts` for:
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- Auth session refresh
- GPC/DNT signal detection

### 3.7 Supabase Client Patterns

```tsx
// Client-side (browser)
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();

// Server-side (server components, API routes)
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();
```

Service role key (`SUPABASE_SERVICE_ROLE_KEY`) is server-only -- never expose to the client.

---

## 4. UI Component Library

All components import from `@/components/ui`. Every component uses `motion/react` for animations and follows WCAG 2.1 AA accessibility standards.

### Glass

```tsx
import { Glass, GlassCard, GlassPanel } from "@/components/ui";

<Glass variant="medium" border="light">Content</Glass>
<GlassCard variant="strong">Card content</GlassCard>
<GlassPanel border="medium">Panel content</GlassPanel>
```

| Prop | Values | Default |
|---|---|---|
| `variant` | `"light"` \| `"medium"` \| `"strong"` | `"medium"` |
| `border` | `"none"` \| `"light"` \| `"medium"` \| `"strong"` | `"light"` |

### Button

```tsx
<Button variant="primary" size="md" loading={false}>Click me</Button>
```

| Prop | Values | Default |
|---|---|---|
| `variant` | `"primary"` \| `"secondary"` \| `"danger"` \| `"ghost"` | `"primary"` |
| `size` | `"sm"` \| `"md"` \| `"lg"` | `"md"` |
| `loading` | boolean | `false` |

### Input / Textarea

```tsx
<Input label="Email" type="email" error="Invalid" helperText="Help text" />
<Textarea label="Message" rows={4} />
```

| Prop | Type |
|---|---|
| `label` | string |
| `error` | string |
| `helperText` | string |
| `leftIcon` / `rightIcon` | ReactNode |

### Avatar / AvatarGroup

```tsx
<Avatar src="/img.jpg" fallback="JD" status="online" size="md" />
<AvatarGroup max={3}><Avatar /><Avatar /><Avatar /></AvatarGroup>
```

| Prop | Values |
|---|---|
| `status` | `"online"` \| `"offline"` \| `"busy"` \| `"away"` |
| `size` | `"xs"` \| `"sm"` \| `"md"` \| `"lg"` \| `"xl"` |

### Badge / NotificationBadge

```tsx
<Badge variant="success" pulse>Online</Badge>
<NotificationBadge count={5} max={99} />
```

| Prop | Values |
|---|---|
| `variant` | `"default"` \| `"primary"` \| `"secondary"` \| `"success"` \| `"warning"` \| `"danger"` \| `"outline-solid"` |
| `pulse` | boolean |

### Card

```tsx
<Card tilt hoverable>
  <CardHeader><CardTitle>Title</CardTitle><CardDescription>Desc</CardDescription></CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

| Prop | Values | Default |
|---|---|---|
| `tilt` | boolean | `true` |
| `hoverable` | boolean | `false` |

### Modal

```tsx
<Modal isOpen={open} onClose={close} title="Title" size="md" footer={<Button>Save</Button>}>
  Content
</Modal>
```

| Prop | Values | Default |
|---|---|---|
| `size` | `"sm"` \| `"md"` \| `"lg"` \| `"xl"` \| `"full"` | `"md"` |
| `closeOnOverlay` | boolean | `true` |
| `closeOnEscape` | boolean | `true` |

### Toast

```tsx
import { toast, ToastContainer } from "@/components/ui";

// In layout: <ToastContainer />
toast.success("Done!", "Operation completed");
toast.error("Error!", "Something went wrong");
toast.warning("Warning!", "Be careful");
toast.info("Info", "Did you know?");
```

### Toggle / ToggleGroup

```tsx
<Toggle label="Enable" checked={checked} onChange={(e) => setChecked(e.target.checked)} size="md" />
```

### Tooltip

```tsx
<Tooltip content="Help text" position="top" delay={500}>
  <Button>Hover me</Button>
</Tooltip>
```

### Dropdown

```tsx
<Dropdown items={items} value={value} onSelect={setValue} searchable placeholder="Select..." />
```

Keyboard: `↓↑` navigate, `Enter` select, `Escape` close, `Home/End` jump.

---

## 5. Design System

### Theme

- **Dark mode default** with liquid glass morphism
- OKLCH color system for wider gamut
- Primary: blue-400 (`oklch(0.68 0.20 250)`)

### Color Palette

```css
@theme {
  /* Primary - Electric Blue */
  --color-primary-400: oklch(0.68 0.20 250);
  --color-primary-500: oklch(0.60 0.25 250);
  --color-primary-600: oklch(0.52 0.25 250);

  /* Surfaces (Dark Theme) */
  --color-surface-0: oklch(0.12 0.02 250);   /* Darkest */
  --color-surface-1: oklch(0.15 0.02 250);
  --color-surface-2: oklch(0.18 0.02 250);
  --color-surface-3: oklch(0.21 0.02 250);   /* Lightest */

  /* Semantic */
  --color-success: oklch(0.72 0.20 145);
  --color-warning: oklch(0.80 0.18 85);
  --color-error: oklch(0.65 0.25 25);
}
```

### Glass Variants

| Variant | Use Case |
|---|---|
| `light` | Subtle background sections |
| `medium` | Default panels, sidebars |
| `strong` | Cards, modals, elevated surfaces |
| `interactive` | Hoverable/clickable containers |

### Animation Patterns

```tsx
import { fadeIn, slideUp, scaleIn, staggerContainer } from "@/lib/utils/animations";

<motion.div variants={fadeIn} initial="initial" animate="animate">Content</motion.div>
```

Only animate `transform` and `opacity` (GPU-accelerated). Custom scrollbars: `scrollbar-thin` or `scrollbar-hide`.

---

## 6. File Structure

```
app/
├── (auth)/                    # Auth route group (login, signup, onboarding)
├── (main)/                    # Main app route group (auth-guarded)
│   ├── layout.tsx             # Server component wrapper + client layout
│   ├── servers/[serverId]/[channelId]/page.tsx  # Channel view
│   ├── friends/page.tsx       # Friends list
│   ├── dms/[userId]/page.tsx  # Direct messages
│   ├── family/                # Parent dashboard (6 sub-routes)
│   └── admin/                 # Platform admin panel
├── api/                       # API routes (daily, performance, permissions, reports, account, search)
├── auth/                      # Auth callbacks, password reset
├── cookie-policy/             # Public legal page
├── privacy-policy/            # Public legal page
├── terms-of-service/          # Public legal page
├── globals.css                # Tailwind 4 @theme config
└── page.tsx                   # Landing page

components/
├── ui/                        # Base components (glass, button, input, avatar, badge, card, modal, toast, toggle, tooltip, dropdown)
├── chat/                      # Message list, input, reactions, emoji picker, typing indicator, report dialog, file preview
├── navigation/                # Server list (72px), channel list (240px), user panel, portal overlay
├── voice/                     # Voice channel, participant tile, controls, screen share
├── family/                    # Teen badge, monitoring controls, transparency log
├── server/                    # Create/settings modals, permission grid, role editor
├── settings/                  # Settings modal with 8+ tabs
├── landing/                   # Hero 3D scene, features, comparison, social proof, footer
├── login/                     # Login form, world formation animation
├── consent/                   # GDPR consent banner, settings
└── pwa/                       # Service worker registration

store/                         # 18 Zustand stores
├── auth.store.ts              # Auth lifecycle, session, lockout, password reset
├── server.store.ts            # Server/channel selection, server CRUD
├── message.store.ts           # Messages, reactions, typing, realtime subscriptions
├── ui.store.ts                # Sidebar states, theme, mobile
├── presence.store.ts          # Online status, typing indicators, Supabase Presence
├── family.store.ts            # Family monitoring (1,112 lines)
├── friends.store.ts           # Friend requests, friendships
├── dm.store.ts                # Direct messages
├── member.store.ts            # Server member lists
├── voice.store.ts             # Voice channel state
├── consent.store.ts           # Privacy consent preferences
├── performance.store.ts       # Performance metrics
├── favorites.store.ts         # Channel favorites
└── (others)                   # points, theme, server-management, onboarding, parent-dashboard

lib/
├── supabase/                  # client.ts, server.ts, queries.ts, storage.ts
├── types/                     # TypeScript type definitions (server, message, family, report, etc.)
├── hooks/                     # use-daily-call, use-session-timeout, use-idle-detection, etc.
├── utils/                     # animations, cn, password-validation, rate-limiter, webgl
├── performance/               # monitoring, resource-tracking, bundle-analyzer
├── themes/                    # Default themes, validator, storage
├── encryption.ts              # E2E crypto (exists, not yet integrated into message pipeline)
└── privacy.ts                 # Secure storage, key management

supabase/migrations/           # 16 migration files
proxy.ts                       # Security headers, auth refresh, GPC/DNT detection
```

**Scale:** 25+ routes, 100+ components, 18 Zustand stores, 30+ library utilities, 30+ database tables, 40+ RLS policies, 16 migrations, 6 API routes.

---

## 7. Database Schema Overview

### Core Tables

| Table | Purpose |
|---|---|
| `profiles` | User profiles (username, display_name, avatar, bio, role, status) |
| `user_settings` | Per-user settings (theme, notifications, privacy) |
| `servers` | Server metadata (name, icon, owner, description) |
| `server_members` | Membership (server_id, user_id, role, joined_at) |
| `server_roles` | Custom roles with bitfield permissions |
| `role_members` | Role assignments |
| `server_settings` | Per-server configuration |
| `channel_categories` | Channel groupings |
| `channels` | Text/voice/announcement channels |
| `channel_permission_overrides` | Per-channel role overrides |
| `messages` | Chat messages (content, user_id, channel_id, edited_at, deleted_at) |
| `message_attachments` | File attachments metadata |
| `message_reactions` | Emoji reactions |
| `direct_messages` | DM messages |
| `friendships` | Confirmed friend pairs |
| `friend_requests` | Pending requests |
| `blocked_users` | Block list |
| `voice_sessions` | Voice call metadata (start, end, channel) |
| `voice_participants` | Call participants |
| `family_accounts` | Parent-teen relationships |
| `family_members` | Family group members |
| `family_activity_log` | Transparent parent action log |
| `parental_consent` | COPPA consent records |
| `reports` | Content reports (CSAM, harassment, etc.) |
| `points_transactions` | Engagement points |
| `user_achievements` | Unlocked achievements |
| `easter_eggs` / `user_easter_eggs` | Discovery system |
| `user_themes` | Custom themes |
| `user_login_streaks` | Login streaks |
| `shop_purchases` | Points shop |
| `channel_favorites` | Favorited channels |

### Key Relationships

```
profiles ←→ server_members ←→ servers ←→ channels ←→ messages
profiles ←→ family_accounts ←→ family_members
profiles ←→ friendships / friend_requests / blocked_users
```

### Security

- **RLS enabled on ALL tables** with comprehensive SELECT/INSERT/UPDATE/DELETE policies
- **Realtime enabled for:** messages, direct_messages, voice_sessions, voice_participants, friend_requests, family_activity_log
- **Triggers:** auto-timestamps, member count updates, default role creation, user settings creation

---

## 8. Environment Variables

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous key (RLS enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only** | Admin operations (account deletion, etc.) |
| `NEXT_PUBLIC_DAILY_API_KEY` | Public | Daily.co voice/video API key |

**Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.** It bypasses RLS.

---

## 9. Layout Architecture

```
┌─────────┬──────────────┬────────────────────────┐
│ Server  │ Channel List │   Main Content Area    │
│  List   │   + User     │                        │
│  72px   │   Panel      │       Flexible         │
│         │   240px      │                        │
└─────────┴──────────────┴────────────────────────┘
```

- **Server list (72px):** Vertical icon sidebar, scrollable
- **Channel list (240px):** Channels grouped by category + user panel at bottom
- **Main content (flexible):** Chat view, friends, DMs, family dashboard, settings
- **Mobile:** Collapses to single column with slide-over sidebars

### Route Structure

```
/                          Landing page
/login                     Login form
/signup                    Multi-step signup
/channels                  Redirects to /friends
/servers/[id]/[channelId]  Channel view
/friends                   Friends list
/dms/[userId]              Direct messages
/family/dashboard          Parent dashboard
/family/messages           Monitored messages
/family/servers            Teen's servers
/family/friends            Teen's friends
/family/flags              Content flags
/cookie-policy             Public legal page
/privacy-policy            Public legal page
/terms-of-service          Public legal page
```

---

## 10. Development Workflow

```bash
pnpm dev          # Start dev server (Turbopack, http://localhost:3000)
pnpm build        # Production build
pnpm lint         # Biome linting
pnpm format       # Biome formatting
pnpm typecheck    # TypeScript check
```

### Dev Mode Authentication

The app has dev mode enabled (`lib/utils/dev-mode.ts`). Users can login with any credentials -- no validation. Data stored in localStorage.

### Performance Targets

| Metric | Target |
|---|---|
| Initial Bundle | < 120KB gzipped |
| First Contentful Paint | < 0.8s |
| Time to Interactive | < 1.5s |
| RAM (idle) | < 50MB |
| RAM (active) | < 100MB |
| CPU (idle) | < 2% |
| Animation FPS | 60fps |
| Lighthouse Performance | > 95 |

---

## 11. DO NOT / DO Rules

### DO NOT

- Use `middleware.ts` (deprecated -- use `proxy.ts`)
- Import from `framer-motion` (use `motion/react`)
- Update state during render (use `useEffect`)
- Nest `<button>` inside `<button>` (hydration error)
- Put DOM nodes in useEffect dependency arrays
- Put Zustand actions in useEffect dependency arrays
- Destructure Zustand stores without selectors
- Use `tailwind.config.ts` (deleted -- use `@theme` in globals.css)
- Use `@layer utilities` (use `@utility` directive)
- Use `flex-shrink-0` / `outline-none` / `shadow-sm` / `blur-sm` (v3 names)
- Commit `--amend` without explicit request
- Add features beyond what's requested
- Create documentation files unless explicitly asked

### DO

- Use `motion/react` for all animations
- Wrap state updates in `useEffect`
- Use `role="button"` + `tabIndex` + `onKeyDown` for non-button clickables
- Use OKLCH colors
- Always use Zustand selectors: `useStore((s) => s.value)`
- Exclude unstable refs from useEffect deps
- Only animate `transform` and `opacity`
- Delete unused code completely (no backwards-compat hacks)
- Prefer editing existing files over creating new ones
