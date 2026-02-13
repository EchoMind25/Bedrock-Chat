# Bedrock Chat - Development Guide for Claude

This document provides context for AI assistants (Claude) working on this codebase.

---

## Project Overview

**Bedrock Chat** is a privacy-first, Discord-like communication platform built with cutting-edge 2026 web technologies.

### Tech Stack
- **Next.js 16.1.x** with Turbopack
- **React 19.2.x** (Activity API, refs as props)
- **TypeScript 5.7.x** (strict mode)
- **Tailwind CSS 4.1.x** (CSS-first config)
- **Motion 12.x** (NOT framer-motion)
- **Zustand 5.x** (state management)

---

## Current Implementation Status

### ✅ Phase 1: Foundation (COMPLETE)
- Design system with Glass morphism components
- UI component library (Button, Input, Avatar, Badge, Card, Modal, Toast, etc.)
- Animation utilities with spring physics
- OKLCH color system

### ✅ Phase 2: Auth & Navigation (COMPLETE)
- Landing page with hero, features, comparison table
- Login/Signup flows with form validation
- Dev mode for easy testing (bypass validation)
- **Main application layout (Discord-style 3-column)**

### 🚧 Phase 3: Core Chat (IN PROGRESS)
- ❌ Message list with virtual scrolling
- ❌ Message input with rich features
- ❌ Real-time mock updates

---

## Main Layout Implementation (Phase 2.3)

### Architecture

**3-Column Discord-Style Layout:**
```
┌─────────┬──────────────┬────────────────────────┐
│ Server  │ Channel List │   Main Content Area    │
│  List   │   + User     │                        │
│  72px   │   Panel      │       Flexible         │
│         │   240px      │                        │
└─────────┴──────────────┴────────────────────────┘
```

### File Structure

```
app/
├── (main)/                          # Main app route group
│   ├── layout.tsx                   # 3-column layout with auth guard
│   ├── page.tsx                     # Redirects to current server/channel
│   ├── servers/[serverId]/[channelId]/
│   │   └── page.tsx                 # Channel view
│   ├── friends/page.tsx             # Friends placeholder
│   └── dms/[userId]/page.tsx        # DMs placeholder

components/navigation/
├── server-list/
│   ├── server-list.tsx              # 72px vertical sidebar
│   └── server-button.tsx            # Server icon buttons
├── channel-list/
│   ├── channel-list.tsx             # 240px channel sidebar
│   ├── channel-category.tsx         # Collapsible categories
│   └── channel-item.tsx             # Individual channel items
└── user-panel/
    └── user-panel.tsx               # User controls at bottom

lib/
├── types/
│   ├── server.ts                    # Server, Channel, Category types
│   └── message.ts                   # Message types
└── mocks/
    ├── servers.ts                   # Mock server/channel data
    └── messages.ts                  # Mock message data

store/
├── server.store.ts                  # Server/channel selection state
└── ui.store.ts                      # UI state (collapsed, theme, etc.)
```

---

## Critical Patterns & Fixes

### 🐛 Bug Fix #1: State Updates During Render

**Problem:** Calling Zustand setters during component render causes infinite loops.

**❌ WRONG:**
```tsx
export default function Page({ params }) {
  const { id } = use(params);
  const { setState } = useStore();

  // ❌ This runs on every render!
  if (id) {
    setState(id);
  }
}
```

**✅ CORRECT:**
```tsx
export default function Page({ params }) {
  const { id } = use(params);
  const { setState } = useStore();

  // ✅ Wrapped in useEffect
  useEffect(() => {
    if (id) {
      setState(id);
    }
  }, [id, setState]);
}
```

**Files Fixed:**
- `app/(main)/servers/[serverId]/[channelId]/page.tsx`

---

### 🐛 Bug Fix #2: Nested Buttons (Hydration Error)

**Problem:** HTML doesn't allow `<button>` inside `<button>`. Causes hydration errors.

**❌ WRONG:**
```tsx
<motion.button>
  Channel content
  <button onClick={...}>Settings</button>  {/* ❌ Nested! */}
</motion.button>
```

**✅ CORRECT:**
```tsx
<motion.button>
  Channel content
  <div
    role="button"
    tabIndex={0}
    onClick={(e) => { e.stopPropagation(); }}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
      }
    }}
  >
    Settings icon
  </div>
</motion.button>
```

**Files Fixed:**
- `components/navigation/channel-list/channel-item.tsx`

---

### ⚡ Performance Optimization

**Problem:** Expensive computations running on every render.

**✅ Solution: Use `useMemo`**
```tsx
// Memoize channel grouping
const channelsByCategory = useMemo(() => {
  const grouped = currentServer.channels.reduce(...);
  // Sort channels
  return grouped;
}, [currentServer.channels]);
```

**Files Optimized:**
- `components/navigation/channel-list/channel-list.tsx`

---

### 🐛 Bug Fix #3: React Error #185 - Infinite Re-render Loop (CRITICAL)

**Problem:** Multiple components had unstable dependencies in useEffect arrays causing infinite render loops.

#### Issue 3.1: DOM Nodes in useEffect Dependencies

**File:** `components/chat/scroll-to-bottom.tsx`

**❌ WRONG:**
```tsx
useEffect(() => {
  if (!scrollElement) return;

  const handleScroll = () => {
    setShowButton(distanceFromBottom > 200);
  };

  scrollElement.addEventListener('scroll', handleScroll);
  return () => scrollElement.removeEventListener('scroll', handleScroll);
}, [scrollElement]); // ❌ DOM node creates new reference on every parent render
```

**✅ CORRECT:**
```tsx
useEffect(() => {
  if (!scrollElement) return;

  const handleScroll = () => {
    setShowButton(distanceFromBottom > 200);
  };

  scrollElement.addEventListener('scroll', handleScroll);
  return () => scrollElement.removeEventListener('scroll', handleScroll);
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Empty deps - scrollElement captured in closure, effect only runs on mount
```

**Why it caused infinite loops:**
1. Parent re-renders → new scrollElement ref (even if same DOM element)
2. useEffect sees "new" dependency → runs effect
3. Effect calls `setShowButton()` → state update
4. Parent re-renders → back to step 1

---

#### Issue 3.2: Zustand Actions in useEffect Dependencies

**Files:**
- `components/chat/message-input.tsx`
- `app/(main)/servers/[serverId]/[channelId]/page.tsx`

**❌ WRONG:**
```tsx
const setTyping = useMessageStore((s) => s.setTyping);

useEffect(() => {
  if (content.length > 0) {
    setTyping(channelId, username);
  }
}, [content, channelId, setTyping, username]); // ❌ Store action can get new refs
```

**✅ CORRECT:**
```tsx
const setTyping = useMessageStore((s) => s.setTyping);

useEffect(() => {
  if (content.length > 0) {
    setTyping(channelId, username);
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [content, channelId, username]); // Zustand actions are stable, exclude them
```

**Why it caused infinite loops:**
1. Store updates (unrelated) → component re-renders
2. Zustand selector returns "new" function reference
3. useEffect sees changed dependency → runs
4. Calls `setTyping()` → updates store
5. Back to step 1

---

#### Issue 3.3: Destructuring Zustand Store (Anti-pattern)

**Files:**
- `components/chat/message.tsx` (fixed)
- `components/chat/reaction-bar.tsx` (fixed)

**❌ WRONG:**
```tsx
// Subscribes to ENTIRE store, not specific values
const { addReaction, editMessage, deleteMessage } = useMessageStore();
```

**✅ CORRECT:**
```tsx
// Subscribes only to specific functions
const addReaction = useMessageStore((state) => state.addReaction);
const editMessage = useMessageStore((state) => state.editMessage);
const deleteMessage = useMessageStore((state) => state.deleteMessage);
```

**Why it caused problems:**
- Destructuring without selector subscribes to ALL store changes
- Every message/reaction/typing update → component re-renders
- Creates new function references → can trigger dependent effects
- Massive performance hit + infinite loop potential

---

### 📦 Zustand Store Patterns

**✅ CORRECT Store Selection:**
```tsx
// Select specific values with arrow function
const currentServer = useServerStore((state) => state.getCurrentServer());
const currentChannelId = useServerStore((state) => state.currentChannelId);
const addReaction = useMessageStore((state) => state.addReaction);
```

**❌ AVOID:**
```tsx
// This subscribes to ENTIRE store
const { getCurrentServer, currentChannelId } = useServerStore();
const currentServer = getCurrentServer();

// This also subscribes to entire store
const store = useMessageStore();
store.addReaction(...);
```

**CRITICAL RULE:** Always use selector functions `(state) => state.value` to subscribe to specific values only.

---

## Key Design Patterns

### 1. React 19 Best Practices
- ✅ Use refs as props (no `forwardRef`)
- ✅ Let React Compiler handle optimizations
- ✅ Use `use()` for async params in Next.js
- ✅ Minimal `useMemo`/`useCallback` (only when needed)

### 2. Motion 12.x (NOT framer-motion)
```tsx
// ✅ CORRECT
import { motion, AnimatePresence } from "motion/react";

// ❌ WRONG (deprecated)
import { motion } from "framer-motion";
```

### 3. Spring Physics Animations
Standard spring configuration:
```tsx
const springConfig = {
  type: "spring",
  stiffness: 260,
  damping: 20,
  mass: 1,
};
```

### 4. OKLCH Colors
```css
/* Use OKLCH for wider color gamut */
background-color: oklch(0.15 0.02 250 / 0.7);
border-color: oklch(0.25 0.02 285 / 0.5);
```

### 5. Custom Scrollbars
```tsx
<div className="scrollbar-thin">
  {/* Content */}
</div>

<div className="scrollbar-hide">
  {/* Hidden scrollbar */}
</div>
```

---

## State Management

### Server Store (`store/server.store.ts`)
```tsx
interface ServerState {
  currentServerId: string | null;
  currentChannelId: string | null;
  servers: Server[];
  setCurrentServer: (id: string) => void;
  setCurrentChannel: (id: string) => void;
  getCurrentServer: () => Server | undefined;
  getCurrentChannel: () => Channel | undefined;
}
```

**Features:**
- Persisted to localStorage (`bedrock-server`)
- Auto-selects first channel when switching servers
- Provides helper methods for current selections

### UI Store (`store/ui.store.ts`)
```tsx
interface UIState {
  isServerListCollapsed: boolean;
  isChannelListCollapsed: boolean;
  isMobile: boolean;
  theme: "dark" | "light";
  // ... toggles and setters
}
```

**Features:**
- Persisted to localStorage (`bedrock-ui`)
- Manages sidebar states
- Mobile responsiveness flags

---

## Routing & Navigation

### Route Structure
```
/ (landing page)
/login
/signup
/channels (redirects to main app)
/servers/[serverId]/[channelId]  ← Main chat view
/friends
/dms/[userId]
```

### Navigation Flow
1. User logs in → redirected to `/channels`
2. `/channels` → redirects to `/servers/server-1/channel-1`
3. Server selection → Updates URL and Zustand store
4. Channel selection → Updates URL and Zustand store
5. State persisted to localStorage

---

## Mock Data

### Servers (5 total)
- **Home** (special, no channels)
- **Bedrock Community** (full channel structure)
- **Tech Enthusiasts** (empty)
- **Gaming Hub** (empty)
- **Art & Design** (empty)

### Channels in Bedrock Community
**INFORMATION:**
- #welcome (text)
- #rules (announcement)

**TEXT CHANNELS:**
- #general (text)
- #random (text)
- #tech-talk (text)

**VOICE CHANNELS:**
- General Voice
- Gaming

---

## Development Workflow

### Starting Dev Server
```bash
pnpm dev
```
Server runs at: http://localhost:3000

### Dev Mode Authentication
The app has dev mode enabled. Users can:
- Login with any credentials (no validation)
- Data stored in localStorage
- Perfect for testing UI flows

### Hot Module Replacement
- Turbopack provides instant updates
- State persists across HMR
- No manual refresh needed

---

## Common Tasks

### Adding a New Channel
1. Add to `lib/mocks/servers.ts`:
```tsx
{
  id: "channel-new",
  name: "new-channel",
  type: "text",
  serverId: "server-1",
  categoryId: "cat-2",
  position: 3,
}
```

### Adding a New Server
1. Add to `lib/mocks/servers.ts`:
```tsx
{
  id: "server-new",
  name: "New Server",
  icon: "🆕",
  ownerId: "user-1",
  memberCount: 100,
  categories: [],
  channels: [],
  createdAt: new Date(),
}
```

### Creating a New Page
1. Add route in `app/(main)/your-route/page.tsx`
2. Use the main layout automatically
3. Follow the pattern from existing pages

---

## Important Constraints

### DO NOT
- ❌ Use `middleware.ts` (deprecated, use `proxy.ts`)
- ❌ Import from `framer-motion` (use `motion/react`)
- ❌ Update state during render (use `useEffect`)
- ❌ Nest buttons inside buttons
- ❌ Put DOM nodes in useEffect dependency arrays
- ❌ Put Zustand actions in useEffect dependency arrays
- ❌ Destructure Zustand stores without selectors
- ❌ Use `git commit --amend` without explicit user request
- ❌ Add features beyond what's requested
- ❌ Create documentation files unless explicitly asked
- ❌ Use emojis unless user requests them

### DO
- ✅ Use `motion/react` for animations
- ✅ Wrap state updates in `useEffect`
- ✅ Use `role="button"` for non-button clickable elements
- ✅ Add `tabIndex` and keyboard handlers for accessibility
- ✅ Use OKLCH colors for wider gamut
- ✅ Always use Zustand selectors: `useStore((s) => s.value)`
- ✅ Exclude unstable refs from useEffect deps (DOM nodes, store actions)
- ✅ Prefer simple solutions over abstractions
- ✅ Only add error handling at system boundaries
- ✅ Delete unused code completely (no backwards-compatibility hacks)

---

## Next Steps (Phase 3)

### 3.1 Message List
- [ ] Virtual scrolling with TanStack Virtual
- [ ] Message components (text, images, reactions)
- [ ] Infinite scroll (load more)
- [ ] Message grouping by user/time
- [ ] Jump to message

### 3.2 Message Input
- [ ] Rich text input
- [ ] Emoji picker
- [ ] File upload UI
- [ ] Mention/autocomplete
- [ ] Command palette (/)

### 3.3 Real-time Features
- [ ] Mock real-time message updates
- [ ] Typing indicators
- [ ] Presence indicators
- [ ] Optimistic updates
- [ ] Read receipts

---

## Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Initial Bundle | < 120KB gzipped | ✅ |
| First Contentful Paint | < 0.8s | ✅ |
| Time to Interactive | < 1.5s | ✅ |
| Animation FPS | 60fps | ✅ |
| Lighthouse Performance | > 95 | 🔄 |

---

## Troubleshooting

### Issue: React Error #185 - Infinite re-renders
**Causes:**
1. State updates during render (not in useEffect)
2. DOM nodes in useEffect dependency arrays
3. Zustand actions in useEffect dependency arrays
4. Destructuring Zustand without selectors

**Fixes:**
1. Wrap state updates in `useEffect`
2. Use empty deps `[]` for DOM event listeners (capture in closure)
3. Exclude Zustand actions from deps with eslint-disable comment
4. Always use selectors: `useStore((s) => s.value)`

**How to diagnose:**
- Open React DevTools Profiler
- Watch for component rendering 100+ times/second
- Check Console for "Maximum update depth exceeded"
- Look for unstable dependencies in useEffect hooks

### Issue: Hydration mismatch
**Cause:** Nested buttons or server/client mismatch
**Fix:** Use `div` with `role="button"` or ensure consistent rendering

### Issue: Store not updating
**Cause:** Not selecting state correctly
**Fix:** Use selector: `useStore((state) => state.value)`

### Issue: Animations janky
**Cause:** Animating non-GPU properties
**Fix:** Only animate `transform` and `opacity`

---

## Testing Checklist

Before committing major features:
- [ ] Server selection updates URL and UI
- [ ] Channel selection updates URL and UI
- [ ] Category collapse/expand works
- [ ] Hover states smooth (60fps)
- [ ] User panel expands/collapses
- [ ] Auth guard redirects properly
- [ ] State persists on refresh
- [ ] No console errors
- [ ] No hydration mismatches
- [ ] Lighthouse score > 95

---

## Questions for User

When uncertain about:
- **Feature scope:** Ask if additional features are needed
- **Design decisions:** Ask about preferred approach
- **Breaking changes:** Confirm before proceeding
- **Destructive operations:** Always ask first (git push, delete, etc.)

---

## Resources

- **PRD:** `/workspaces/Bedrock-Chat/Bedrock_Chat_Frontend_PRD.md`
- **Components Guide:** `/workspaces/Bedrock-Chat/COMPONENTS.md`
- **Layout Summary:** `/workspaces/Bedrock-Chat/MAIN_LAYOUT_SUMMARY.md`
- **Dev Mode Guide:** `/workspaces/Bedrock-Chat/AUTH_DEV_MODE.md`

---

**Last Updated:** 2026-02-13
**Phase:** 3.1 In Progress - Chat System with Critical Bug Fixes
**Next:** Complete Message List + Real-time Features

**Recent Critical Fixes (2026-02-13):**
- Fixed React Error #185 infinite loop in chat system
- Resolved DOM node dependencies in useEffect
- Fixed Zustand action dependencies causing cascade loops
- Implemented proper Zustand selector patterns throughout chat
