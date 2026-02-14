# Bedrock Chat - Privacy-First Discord Alternative
## Product Requirements Document (PRD) - February 2026

---

## Executive Summary

Bedrock Chat is a privacy-first, high-performance communication platform designed as a Discord alternative. Built with February 2026 best practices, it prioritizes user privacy, regulatory compliance (GDPR, CCPA/CPRA, ISO 27701), and exceptional performance while delivering a visually stunning 2026 design aesthetic.

**Core Philosophy:** Privacy is not a feature—it's the foundation. Zero telemetry, zero tracking, transparent data practices.

---

## Technical Stack (February 2026)

### Core Framework
| Technology | Version | Notes |
|------------|---------|-------|
| Next.js | 16.1.x | Turbopack default, `proxy.ts` (NOT middleware.ts), Cache Components |
| React | 19.2.x | Activity API, useEffectEvent, View Transitions, refs as props |
| TypeScript | 5.7.x | Strict mode, satisfies operator, const type parameters |
| Tailwind CSS | 4.1.x | CSS-first config, @theme directive, OKLCH colors |

### State & Data
| Technology | Version | Notes |
|------------|---------|-------|
| Zustand | 5.0.x | useSyncExternalStore, slices pattern |
| TanStack Virtual | 3.13.x | `useFlushSync: false` for React 19 compatibility |
| TanStack Query | 5.x | Server state management (when backend ready) |

### Animation & UI
| Technology | Version | Notes |
|------------|---------|-------|
| Motion | 12.34.x | Import from `motion/react` (NOT framer-motion) |
| Radix UI | Latest | Accessible primitives |

### Development
| Tool | Purpose |
|------|---------|
| Turbopack | Build tool (default in Next.js 16) |
| Biome | Linting + Formatting (replaces ESLint + Prettier) |
| pnpm | Package manager |

---

## Privacy & Compliance Architecture

### Regulatory Compliance Checklist

#### GDPR (EU)
- [ ] Explicit opt-in consent before data collection
- [ ] Right to access, rectify, erase personal data
- [ ] Data portability (downloadable data packages)
- [ ] 72-hour breach notification capability
- [ ] Privacy by design & default
- [ ] Data Protection Impact Assessments (DPIA)

#### CCPA/CPRA (California)
- [ ] "Do Not Sell or Share My Personal Information" link
- [ ] "Limit the Use of My Sensitive Personal Information" link
- [ ] Honor Global Privacy Control (GPC) signals
- [ ] Visible opt-out confirmation (mandatory 2026)
- [ ] 45-day DSAR response capability
- [ ] Annual privacy policy updates

#### ISO 27701 Alignment
- [ ] Privacy Information Management System (PIMS)
- [ ] Risk assessment documentation
- [ ] Data encryption at rest and in transit
- [ ] Access control policies

### Privacy-First Implementation

```typescript
// lib/privacy/consent-manager.ts
interface ConsentState {
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  timestamp: string;
  version: string;
  gpcSignal: boolean;
}

// Detect and honor GPC signals (required 2026)
const gpcEnabled = navigator.globalPrivacyControl === true;
```

### Data Minimization Principles
1. **Collect only what's necessary** - No behavioral tracking, no device fingerprinting
2. **Local-first storage** - Prefer localStorage/IndexedDB over server storage
3. **Ephemeral by default** - Messages can be auto-deleted
4. **User controls everything** - Granular privacy settings

---

## Architecture Decisions

### Why proxy.ts (Not middleware.ts)

```typescript
// proxy.ts (Next.js 16 standard)
// middleware.ts is DEPRECATED and will be removed

export function proxy(request: Request) {
  // Node.js runtime (NOT Edge)
  // Full Node.js APIs available
  // Better security, predictable behavior
  
  const url = new URL(request.url);
  
  // GPC signal detection
  const gpcHeader = request.headers.get('Sec-GPC');
  if (gpcHeader === '1') {
    // Honor Global Privacy Control
  }
  
  return Response.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### Why Turbopack (Default in Next.js 16)

- **5x faster** full builds
- **100x faster** incremental builds
- **Native bundler** - No Webpack configuration needed
- **File system caching** - Persistent across sessions

### Why CSS-First Tailwind (v4)

```css
/* app/globals.css - NO tailwind.config.js needed */
@import "tailwindcss";

@theme {
  /* Design Tokens as CSS Variables */
  --font-display: "Geist", system-ui;
  --font-mono: "JetBrains Mono", monospace;
  
  /* OKLCH Colors for wider gamut */
  --color-primary-500: oklch(0.65 0.25 250);
  --color-primary-600: oklch(0.55 0.28 250);
  
  /* Glass Morphism Variables */
  --glass-bg: oklch(0.15 0.02 250 / 0.75);
  --glass-border: oklch(0.25 0.02 250 / 0.3);
  --glass-blur: 24px;
  
  /* Spacing Scale */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
}
```

### Why Motion (Not Framer Motion)

```typescript
// CORRECT: Motion 12.x import
import { motion, AnimatePresence } from "motion/react";

// WRONG: Old framer-motion import (deprecated)
// import { motion } from "framer-motion";

const springConfig = {
  type: "spring",
  stiffness: 260,
  damping: 20,
  mass: 1,
};
```

### Why Zustand 5 Patterns

```typescript
// store/auth.store.ts
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isAuthenticated: false,
        login: async (credentials) => {
          // Implementation
        },
        logout: () => set({ user: null, isAuthenticated: false }),
      }),
      { name: 'bedrock-auth' }
    ),
    { name: 'AuthStore' }
  )
);

// Usage with shallow comparison (prevents unnecessary re-renders)
const { user, isAuthenticated } = useAuthStore(
  useShallow((state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }))
);
```

---

## Project Structure

```
bedrock-chat/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (main)/
│   │   ├── servers/
│   │   │   └── [serverId]/
│   │   │       └── [channelId]/
│   │   │           └── page.tsx
│   │   ├── friends/
│   │   │   └── page.tsx
│   │   ├── dms/
│   │   │   └── [userId]/
│   │   │       └── page.tsx
│   │   ├── family/
│   │   │   └── dashboard/
│   │   │       └── page.tsx
│   │   └── layout.tsx
│   ├── globals.css          # Tailwind 4 with @theme
│   ├── layout.tsx
│   ├── page.tsx              # Landing page
│   └── not-found.tsx
├── components/
│   ├── ui/                   # Base components
│   │   ├── glass/
│   │   ├── button/
│   │   ├── input/
│   │   ├── avatar/
│   │   ├── modal/
│   │   └── toast/
│   ├── chat/                 # Chat-specific
│   │   ├── message-list/
│   │   ├── message-input/
│   │   ├── channel-header/
│   │   └── typing-indicator/
│   ├── navigation/           # Navigation
│   │   ├── server-list/
│   │   ├── channel-list/
│   │   └── user-panel/
│   ├── family/               # Family accounts
│   │   ├── teen-badge/
│   │   ├── parent-dashboard/
│   │   └── monitoring-controls/
│   └── voice/                # Voice/Video UI
│       ├── voice-channel/
│       └── participant-tile/
├── lib/
│   ├── hooks/
│   │   ├── use-realtime-messages.ts
│   │   ├── use-virtual-scroll.ts
│   │   └── use-reduced-motion.ts
│   ├── utils/
│   │   ├── animations.ts
│   │   ├── cn.ts             # Class name utility
│   │   └── privacy.ts
│   ├── types/
│   │   ├── user.ts
│   │   ├── server.ts
│   │   ├── message.ts
│   │   └── family.ts
│   └── mocks/
│       ├── users.ts
│       ├── servers.ts
│       └── messages.ts
├── store/
│   ├── auth.store.ts
│   ├── server.store.ts
│   ├── message.store.ts
│   ├── settings.store.ts
│   └── family.store.ts
├── proxy.ts                  # NOT middleware.ts
├── package.json
├── tsconfig.json
└── biome.json                # Replaces .eslintrc + .prettierrc
```

---

## Design System

### Glass Morphism 2026

```typescript
// components/ui/glass/glass.tsx
'use client';

import { type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils/cn';

type GlassVariant = 'default' | 'elevated' | 'subtle' | 'interactive';

interface GlassProps extends HTMLMotionProps<'div'> {
  variant?: GlassVariant;
  children: ReactNode;
}

const variantStyles: Record<GlassVariant, string> = {
  default: 'bg-(--glass-bg) backdrop-blur-(--glass-blur) border border-(--glass-border)',
  elevated: 'bg-(--glass-bg) backdrop-blur-(--glass-blur) border border-(--glass-border) shadow-2xl shadow-primary-500/10',
  subtle: 'bg-(--glass-bg)/60 backdrop-blur-md border border-(--glass-border)/50',
  interactive: 'bg-(--glass-bg) backdrop-blur-(--glass-blur) border border-(--glass-border) hover:border-primary-500/50 transition-colors',
};

export function Glass({ variant = 'default', className, children, ...props }: GlassProps) {
  return (
    <motion.div
      className={cn(
        'rounded-2xl',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
```

### Animation Utilities

```typescript
// lib/utils/animations.ts
import type { Variants, Transition } from 'motion/react';

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 20,
  mass: 1,
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: springTransition,
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: springTransition,
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

// GPU-accelerated only (transform, opacity)
export const slideInFromRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: springTransition,
  },
};
```

### Color Palette (OKLCH)

```css
@theme {
  /* Primary - Electric Blue */
  --color-primary-50: oklch(0.97 0.02 250);
  --color-primary-100: oklch(0.93 0.05 250);
  --color-primary-200: oklch(0.86 0.10 250);
  --color-primary-300: oklch(0.77 0.15 250);
  --color-primary-400: oklch(0.68 0.20 250);
  --color-primary-500: oklch(0.60 0.25 250);
  --color-primary-600: oklch(0.52 0.25 250);
  --color-primary-700: oklch(0.44 0.22 250);
  --color-primary-800: oklch(0.37 0.18 250);
  --color-primary-900: oklch(0.30 0.14 250);
  
  /* Accent - Vibrant Purple-Pink Gradient */
  --color-accent-start: oklch(0.65 0.28 300);
  --color-accent-end: oklch(0.70 0.25 350);
  
  /* Semantic */
  --color-success: oklch(0.72 0.20 145);
  --color-warning: oklch(0.80 0.18 85);
  --color-error: oklch(0.65 0.25 25);
  
  /* Surfaces (Dark Theme) */
  --color-surface-0: oklch(0.12 0.02 250);   /* Darkest */
  --color-surface-1: oklch(0.15 0.02 250);
  --color-surface-2: oklch(0.18 0.02 250);
  --color-surface-3: oklch(0.21 0.02 250);   /* Lightest */
}
```

---

## Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial Bundle | < 120KB gzipped | `next build --analyze` |
| First Contentful Paint | < 0.8s | Lighthouse |
| Time to Interactive | < 1.5s | Lighthouse |
| RAM Usage (Idle) | < 50MB | Chrome Task Manager |
| RAM Usage (Active) | < 100MB | Chrome Task Manager |
| CPU Idle | < 2% | Chrome DevTools |
| Animation FPS | 60fps | Chrome DevTools Performance |
| Message List (1000+ items) | 60fps scroll | TanStack Virtual |

### Performance Patterns

```typescript
// Virtual scrolling with React 19 compatibility
import { useVirtualizer } from '@tanstack/react-virtual';

const rowVirtualizer = useVirtualizer({
  count: messages.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 80,
  overscan: 5,
  // CRITICAL: Disable flushSync for React 19 compatibility
  useFlushSync: false,
});
```

---

## Family Accounts System

### Monitoring Levels

| Level | Name | Parent Can See | Requires Approval |
|-------|------|----------------|-------------------|
| 1 | Minimal | Server list, friend list | - |
| 2 | Moderate | + Messages, DMs (manual view) | - |
| 3 | Supervised | + AI-flagged content alerts | Server joins, friend requests |
| 4 | Restricted | + Screen time limits | All activity, whitelist only |

### Transparency Requirements

**Critical:** All monitoring is transparent to the teen.

```typescript
interface TransparencyLog {
  id: string;
  parentId: string;
  teenId: string;
  action: 'viewed_messages' | 'changed_level' | 'viewed_friends' | 'approved_server';
  details: string;
  timestamp: Date;
}

// Teen ALWAYS sees when parent accesses their data
// This is displayed in teen's settings under "Parent Activity"
```

---

## Security Considerations

### Client-Side Security

```typescript
// proxy.ts - Security headers
export function proxy(request: Request) {
  const response = Response.next();
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );
  
  return response;
}
```

### Data Storage (Mock Phase)

```typescript
// All sensitive data encrypted before localStorage
// In production: Use WebCrypto API with user-derived keys

const STORAGE_KEY = 'bedrock_';

export const secureStorage = {
  set: (key: string, value: unknown) => {
    // In production: encrypt with user key
    localStorage.setItem(`${STORAGE_KEY}${key}`, JSON.stringify(value));
  },
  get: <T>(key: string): T | null => {
    const item = localStorage.getItem(`${STORAGE_KEY}${key}`);
    return item ? JSON.parse(item) : null;
  },
  remove: (key: string) => {
    localStorage.removeItem(`${STORAGE_KEY}${key}`);
  },
  clear: () => {
    Object.keys(localStorage)
      .filter(k => k.startsWith(STORAGE_KEY))
      .forEach(k => localStorage.removeItem(k));
  },
};
```

---

## Development Timeline

### Phase 1: Foundation (Week 1-2)
- Project setup with Next.js 16, Tailwind 4
- Design system (Glass components, animations)
- UI component library

### Phase 2: Auth & Navigation (Week 3-4)
- Landing page
- Login/Signup flows
- Main layout (Server list, Channel list)

### Phase 3: Core Chat (Week 5-6)
- Message list with virtual scrolling
- Message input with rich features
- Real-time mock updates

### Phase 4: Social Features (Week 7-8)
- Friends list
- Direct messages
- User profiles

### Phase 5: Advanced Features (Week 9-10)
- Family accounts system
- Voice/Video UI (mock)
- Server management

### Phase 6: Polish (Week 11-12)
- Performance optimization
- Accessibility audit
- Error states & loading states

---

## Success Criteria

### Technical
- [ ] Lighthouse Performance > 95
- [ ] Lighthouse Accessibility > 95
- [ ] Bundle size < 120KB gzipped
- [ ] 60fps animations consistently
- [ ] WCAG 2.1 AA compliant

### Privacy
- [ ] GDPR compliant
- [ ] CCPA/CPRA compliant
- [ ] GPC signals honored
- [ ] Zero third-party trackers
- [ ] All data deletable by user

### User Experience
- [ ] < 3 clicks to send first message
- [ ] Family account setup < 5 minutes
- [ ] All states handled (loading, error, empty)
- [ ] Mobile responsive (375px - 1920px)

---

## Appendix: Package.json

```json
{
  "name": "bedrock-chat",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "biome check .",
    "format": "biome format --write .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^16.1.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "motion": "^12.34.0",
    "zustand": "^5.0.11",
    "@tanstack/react-virtual": "^3.13.18",
    "@faker-js/faker": "^9.0.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^3.0.0"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "@tailwindcss/vite": "^4.1.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.1.0",
    "typescript": "^5.7.0"
  }
}
```

---

*Document Version: 2.0.0*
*Last Updated: February 11, 2026*
*Tech Stack Verified: February 2026*