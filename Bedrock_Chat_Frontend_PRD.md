# Bedrock Chat Frontend PRD
## Product Requirements Document v1.0

**Project:** Bedrock Chat - Privacy-First Communication Platform  
**Version:** Frontend Development Phase  
**Date:** February 11, 2026  
**Author:** Braxton, Bedrock AI Systems  
**Development Partner:** Claude Opus 4.5 (Note: Current model is 4.5, not 4.6)  
**Timeline:** 8-12 weeks frontend development, backend integration TBD

---

## Executive Summary

Bedrock Chat will redefine real-time communication with a **breathtaking, performant, privacy-first** interface that makes Discord look outdated. We're building the first chat platform that feels **alive** while being lighter on system resources than a text editor.

**Core Promise:** "More beautiful than Discord. Faster than Discord. Respects your privacy unlike Discord."

### Success Criteria
- [ ] User reaction: "Holy shit, this is gorgeous"
- [ ] Performance: <50MB RAM, <2% CPU idle, <5% CPU active
- [ ] Gamers don't notice it's running (no FPS drop)
- [ ] Parents choose us over Discord for their teens
- [ ] Privacy advocates call it "the gold standard"

---

## 1. Product Vision

### 1.1 The Problem

**Discord's Fatal Flaws:**
- Government ID + facial recognition requirement (privacy violation)
- Bland, corporate UI (hasn't evolved since 2015)
- Resource-heavy (200-400MB RAM, noticeable CPU usage)
- Zero privacy (messages scanned, data sold for AI training)
- No parental controls (all-or-nothing moderation)

**Our Solution:**
- Privacy-first architecture (E2E encryption, no government IDs)
- **2026 design language** (liquid glass, depth, motion)
- Feather-light performance (optimized React 19 + Rust WASM)
- Parent-empowered safety (family accounts with transparency)
- AI-powered features (Claude Opus 4.5 moderation, summaries)

### 1.2 Target Audiences

| Audience | Pain Point | Our Solution | Priority |
|----------|-----------|--------------|----------|
| **Gamers** | Discord's resource usage hurts FPS | <50MB RAM, no GPU usage | P0 |
| **Parents** | Can't monitor teens without government ID | Family accounts with dashboard | P0 |
| **Privacy advocates** | Discord scans messages, trains AI on data | E2E encryption, open source | P0 |
| **Content creators** | Bland UI, no customization | Vibrant themes, liquid glass effects | P1 |
| **Gen Z/Alpha** | Discord feels old, corporate | Modern, alive, responsive design | P1 |

---

## 2. Design Philosophy: 2026 Aesthetic

### 2.1 Core Principles

**"Liquid Glass + Depth + Life"**

1. **Liquid Glass Morphism**
   - Translucent surfaces with gaussian blur
   - Light refraction effects
   - Depth through layering and shadows
   - Dynamic color tinting based on content

2. **Micro-Animations Everywhere**
   - Every interaction feels responsive
   - Subtle 3D transforms on hover/click
   - Smooth spring physics (not linear easing)
   - Parallax scrolling in message lists

3. **Vibrant, Not Gaudy**
   - Rich color palette (not Discord's washed-out blues)
   - Gradient accents (not flat colors)
   - Dark mode that pops (not pure black)
   - Light mode that doesn't blind

4. **Performance-First**
   - CSS transforms (GPU-accelerated)
   - No unnecessary re-renders
   - Virtual scrolling for messages
   - Lazy-load everything

### 2.2 Visual Language

**Color System:**
```
Primary: Electric Blue (#0080FF) → Cyan (#00D4FF) gradient
Secondary: Purple (#8B5CF6) → Pink (#EC4899) gradient
Success: Emerald (#10B981)
Warning: Amber (#F59E0B)
Danger: Rose (#EF4444)
Neutral Dark: Slate-900 (#0F172A) with 85% opacity (glass effect)
Neutral Light: Slate-100 (#F1F5F9) with 90% opacity
```

**Typography:**
```
Headings: Inter Variable (600-700 weight)
Body: Inter Variable (400-500 weight)
Monospace: JetBrains Mono (code blocks, technical info)
```

**Spacing Scale:**
```
4px (xs), 8px (sm), 12px (md), 16px (lg), 24px (xl), 32px (2xl), 48px (3xl)
```

**Border Radius:**
```
Small elements: 8px
Cards/panels: 16px
Modals: 24px
Full containers: 32px
```

### 2.3 Liquid Glass Implementation

**CSS Architecture:**
```css
.glass-surface {
  background: rgba(15, 23, 42, 0.75); /* slate-900 at 75% */
  backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.glass-highlight {
  position: relative;
  overflow: hidden;
}

.glass-highlight::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 70%
  );
  pointer-events: none;
  transform: translate(var(--mouse-x), var(--mouse-y));
  transition: transform 0.3s ease;
}
```

**3D Hover Effects:**
```css
.interactive-card {
  transform-style: preserve-3d;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.interactive-card:hover {
  transform: 
    perspective(1000px)
    rotateX(var(--rotate-x, 0deg))
    rotateY(var(--rotate-y, 0deg))
    translateZ(12px);
}
```

### 2.4 Animation Principles

**Spring Physics (Framer Motion):**
- **Stiffness:** 260 (snappy but not jarring)
- **Damping:** 20 (smooth settle)
- **Mass:** 1 (natural weight)

**Use Cases:**
- Message send: Scale + opacity spring
- Server select: 3D flip + scale
- Modal open: Scale from center + blur reveal
- Notification: Slide from edge + spring bounce
- Typing indicator: Smooth wave animation

---

## 3. Feature Specifications

### 3.1 Core Features (Frontend-Only Phase)

#### 3.1.1 Authentication (Mock)
**Pages:**
- Landing page (hero + features)
- Sign up flow
- Login page
- Account type selection (Standard vs Family)
- Teen account creation (parent-managed)

**Mock Behavior:**
- Store user in localStorage
- Generate fake JWT token
- Simulate email verification
- No actual backend calls

**UI Highlights:**
- Animated gradient background (CSS only)
- Liquid glass login card
- Smooth transitions between steps
- Floating particle effects

#### 3.1.2 Server/Channel Navigation

**Left Sidebar: Server List**
- Vertical icon list (Discord-style but prettier)
- **3D flip animation** on hover
- **Glow effect** for active server
- Smooth scroll with momentum
- Add server button (pulsing glow)
- Direct messages at top (always visible)

**Middle Sidebar: Channel List**
- Collapsible categories
- **Parallax effect** when scrolling
- Channel icons with **subtle rotation on hover**
- Unread indicators (animated pulse)
- Voice channel status (live waveform visualization)
- Right-click context menu (glass morphism dropdown)

**Design Innovation:**
- Server icons cast **soft shadows** on hover
- Active channel has **animated gradient border**
- Categories expand with **spring physics**
- Voice channels show **real-time activity visualization** (mock data)

#### 3.1.3 Message View

**Main Chat Area:**
- Virtual scrolling (render only visible messages)
- **Parallax background** (subtle depth on scroll)
- Message bubbles with **glass effect**
- Hover reveals **3D depth** (translateZ)
- Reactions with **bounce animation**
- Reply threads with **indent + connecting line**

**Message Components:**
- Avatar with **gradient ring** for online status
- Username with **role color gradients**
- Timestamp (relative time, e.g., "2m ago")
- Edit indicator (subtle badge)
- Attachment previews (image/video/file)
- Code blocks with **syntax highlighting**
- Link previews (rich embeds)

**Typing Indicator:**
- **Liquid bubble animation** (CSS only)
- Shows user avatars
- Smooth fade in/out

**Scroll-to-Bottom Button:**
- **Floating glass button**
- Unread count badge
- Smooth scroll with easing

#### 3.1.4 Message Input

**Composer:**
- **Glass-morphic input box**
- Auto-expanding textarea
- **Emoji picker** (grid with search)
- **GIF picker** (Tenor API or mock)
- **File upload** (drag-drop or click)
- **Markdown preview** toggle
- **Voice record button** (mock)

**Send Animation:**
- Message **scales + fades in** to chat
- Input box **spring bounce** on send
- Success checkmark (brief flash)

#### 3.1.5 User Profile

**Profile Modal:**
- **Liquid glass card** with backdrop blur
- **3D avatar** with depth layers
- Animated banner (gradient or image)
- User info (username, tag, joined date)
- Custom status (emoji + text)
- Badges (roles, achievements)
- **"Send Message" button** (glass with gradient)
- **"Add Friend" button**

**Profile Customization:**
- Theme color picker (gradients)
- Banner upload
- About me (markdown support)
- Pronouns field
- Links (socials)

#### 3.1.6 Settings

**Settings Panel:**
- **Slide-in from right** animation
- **Tabbed navigation** (glass pills)
- Sections:
  - **Account:** Username, email, password, 2FA
  - **Privacy:** Message read receipts, friend requests
  - **Appearance:** Theme, font size, animations toggle
  - **Notifications:** Per-channel settings
  - **Voice & Video:** Device selection, quality
  - **Keybinds:** Customizable shortcuts
  - **Language:** i18n support (future)

**Design Highlights:**
- Toggle switches with **liquid fill animation**
- Sliders with **gradient tracks**
- Dropdowns with **glass morphism**
- Save button **pulses** when changes pending

#### 3.1.7 Voice/Video UI (Mock)

**Voice Channel View:**
- **Grid layout** for participants
- **Animated waveforms** for speaking users
- **3D video tiles** (rotate on hover)
- **Controls bar** (glass bottom overlay)
  - Mute/unmute (animated icon morph)
  - Deafen (ear icon)
  - Settings (gear)
  - Disconnect (red glass button)

**Screen Share:**
- **Floating control panel**
- **Minimize to corner** (draggable)
- **Quality selector**

**Mock Behavior:**
- Simulate participants joining/leaving
- Random waveform animations
- Fake video stream (gradient placeholders)

#### 3.1.8 Search

**Global Search:**
- **Command palette** (Cmd+K / Ctrl+K)
- **Instant results** (mock data)
- **Fuzzy matching**
- Categories: Messages, Users, Servers, Channels
- **Glass modal** with search input
- **Keyboard navigation** (up/down arrows)
- **Recent searches** (localStorage)

**Design:**
- Results appear with **staggered fade-in**
- Highlights match text
- Icons for each result type
- "Jump to" action on click

#### 3.1.9 Notifications

**Toast Notifications:**
- **Slide from top-right**
- **Glass card** with icon
- Auto-dismiss (4 seconds)
- **Swipe to dismiss** gesture
- Types:
  - New message (blue)
  - Friend request (green)
  - Mention (yellow)
  - System (gray)

**Notification Center:**
- **Slide-in panel** from right
- List of all notifications
- Mark as read/unread
- Clear all button
- Filter by type

#### 3.1.10 Friends & DMs

**Friends List:**
- **Tab system:** All, Online, Pending, Blocked
- **Search bar** (filter by username)
- **User cards** (glass with avatar)
- **Action buttons:** Message, Call, Remove
- **Pending requests:** Accept/Decline buttons

**Direct Messages:**
- **Conversation list** (left panel)
- **Last message preview**
- **Unread badge** (animated count)
- **Pin conversations** (stays at top)
- **Archive** (hide without deleting)

#### 3.1.11 Server Management (Admin View)

**Server Settings:**
- **Overview:** Name, icon, banner, description
- **Roles:** Create/edit with color picker
- **Channels:** Create, reorder, permissions
- **Moderation:** Bans, kicks, warnings
- **Integrations:** Bots, webhooks (mock)
- **Audit Log:** Recent actions (mock data)

**Channel Settings:**
- **General:** Name, description, topic
- **Permissions:** Role overrides
- **Invites:** Generate/manage links
- **Webhooks:** Create for integrations

---

### 3.2 Privacy-First Features (UI Only, Backend Later)

#### 3.2.1 E2E Encryption Indicators

**Visual Cues:**
- **Green lock icon** in DM header
- **"Encrypted" badge** on messages
- **Key fingerprint viewer** (modal)
- **"Verify contact" flow** (mock)

**Settings:**
- **Enable/disable E2E** toggle (always on in real app)
- **Backup encryption keys** button
- **Reset keys** (with warning modal)

#### 3.2.2 Family Accounts

**Parent Dashboard:**
- **Overview panel:** Activity summary
- **Monitoring controls:**
  - Level selector (Minimal → Restricted)
  - Server approval queue
  - Friend request approvals
  - Screen time limits
  - Content filters

**Teen Account Indicators:**
- **"Parent-Managed Account" badge** in profile
- **Transparency log:** "Parent viewed messages on [date]"
- **Request privacy upgrade** button (sends notification to parent)

**Parent View:**
- **Message history viewer** (90-day retention)
- **Call logs** (timestamps, duration)
- **Server membership list**
- **AI content flags** (mock alerts)

#### 3.2.3 Data Controls

**Privacy Center:**
- **Download my data** button (generates JSON export)
- **Delete account** (confirmation flow)
- **Data retention settings**
- **Third-party access** (none, but show empty state)

---

### 3.3 AI-Powered Features (Mock UI)

#### 3.3.1 Smart Moderation

**Content Flags:**
- **Toxic message warning** (yellow overlay)
- **"Report to moderator" button**
- **AI confidence score** (e.g., "87% likely spam")

**Moderation Queue:**
- **Admin panel** with flagged content
- **Review/Approve/Delete** actions
- **False positive reporting**

#### 3.3.2 Message Summaries

**"Catch Up" Feature:**
- **Button in channel header:** "Summarize last 100 messages"
- **Glass modal** with AI-generated summary
- **Key points** (bullet list)
- **Jump to message** links

#### 3.3.3 Smart Search

**AI-Enhanced Search:**
- **Semantic search** (mock: "Find when we discussed vacation")
- **Answer questions** (mock: "What did Sarah say about the meeting?")
- **Related results**

#### 3.3.4 Translation

**Real-Time Translation:**
- **Globe icon** on messages
- **Hover to translate**
- **Language auto-detection**
- **Supported languages:** 20+ (mock)

---

## 4. Technical Architecture

### 4.1 Tech Stack

**Core:**
- **Framework:** Next.js 15 (App Router)
- **React:** 19 (with Compiler)
- **TypeScript:** 5.7+
- **Styling:** Tailwind CSS 4 + CSS Modules for complex animations
- **Animations:** Framer Motion 12
- **State:** Zustand (lightweight, <1KB)
- **Deployment:** Vercel (Edge Runtime)

**Performance:**
- **Virtual Scrolling:** TanStack Virtual
- **Image Optimization:** Next.js Image component
- **Code Splitting:** Dynamic imports for routes
- **Bundle Analysis:** @next/bundle-analyzer

**Development:**
- **Mock Data:** Faker.js for realistic data
- **API Mocking:** MSW (Mock Service Worker)
- **Testing:** Vitest + Testing Library
- **Linting:** ESLint + Prettier

### 4.2 Folder Structure

```
bedrock-chat/
├── app/                        # Next.js App Router
│   ├── (auth)/                # Auth routes (login, signup)
│   │   ├── login/
│   │   ├── signup/
│   │   └── layout.tsx
│   ├── (main)/                # Main app routes
│   │   ├── servers/
│   │   │   └── [serverId]/
│   │   │       └── [channelId]/
│   │   ├── dms/
│   │   │   └── [userId]/
│   │   ├── friends/
│   │   └── layout.tsx
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Landing page
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── Glass/            # Glass morphism components
│   │   └── Animated/         # Animated wrappers
│   ├── chat/                 # Chat-specific components
│   │   ├── MessageList/
│   │   ├── MessageInput/
│   │   ├── Message/
│   │   └── TypingIndicator/
│   ├── navigation/
│   │   ├── ServerList/
│   │   ├── ChannelList/
│   │   └── UserPanel/
│   └── modals/
│       ├── UserProfile/
│       ├── ServerSettings/
│       └── CreateChannel/
├── lib/
│   ├── hooks/                # Custom React hooks
│   ├── utils/                # Utility functions
│   ├── constants/            # App constants
│   └── types/                # TypeScript types
├── mocks/                    # Mock data & handlers
│   ├── data/
│   │   ├── users.ts
│   │   ├── servers.ts
│   │   ├── channels.ts
│   │   └── messages.ts
│   └── handlers.ts           # MSW handlers
├── store/                    # Zustand stores
│   ├── authStore.ts
│   ├── serverStore.ts
│   ├── messageStore.ts
│   └── uiStore.ts
├── styles/
│   ├── globals.css           # Global styles + Tailwind
│   └── animations.css        # Complex CSS animations
└── public/
    ├── images/
    ├── icons/
    └── sounds/               # Notification sounds
```

### 4.3 Component Architecture

**Base Glass Component:**
```tsx
// components/ui/Glass/Glass.tsx
interface GlassProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'subtle';
  interactive?: boolean;
  className?: string;
}

export function Glass({ children, variant = 'default', interactive, className }: GlassProps) {
  return (
    <div
      className={cn(
        'glass-surface',
        variant === 'elevated' && 'glass-elevated',
        variant === 'subtle' && 'glass-subtle',
        interactive && 'glass-interactive',
        className
      )}
    >
      {children}
    </div>
  );
}
```

**Animated Message Component:**
```tsx
// components/chat/Message/Message.tsx
interface MessageProps {
  id: string;
  author: User;
  content: string;
  timestamp: Date;
  isOwn: boolean;
  reactions?: Reaction[];
}

export function Message({ author, content, timestamp, isOwn, reactions }: MessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="message-container"
    >
      <Glass variant="subtle" interactive>
        <Avatar user={author} />
        <div className="message-content">
          <div className="message-header">
            <span className="username">{author.username}</span>
            <span className="timestamp">{formatRelativeTime(timestamp)}</span>
          </div>
          <div className="message-text">{content}</div>
          {reactions && <ReactionBar reactions={reactions} />}
        </div>
      </Glass>
    </motion.div>
  );
}
```

### 4.4 State Management

**Auth Store:**
```typescript
interface AuthState {
  user: User | null;
  accountType: 'standard' | 'parent' | 'teen' | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (userData: SignupData) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accountType: null,
  isAuthenticated: false,
  login: async (email, password) => {
    // Mock login - store in localStorage
    const mockUser = generateMockUser(email);
    localStorage.setItem('bedrock_user', JSON.stringify(mockUser));
    set({ user: mockUser, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('bedrock_user');
    set({ user: null, isAuthenticated: false });
  },
  signup: async (userData) => {
    // Mock signup
    const mockUser = generateMockUser(userData.email);
    localStorage.setItem('bedrock_user', JSON.stringify(mockUser));
    set({ user: mockUser, isAuthenticated: true });
  },
}));
```

**Message Store:**
```typescript
interface MessageState {
  messages: Record<string, Message[]>; // Key: channelId
  sendMessage: (channelId: string, content: string) => void;
  loadMessages: (channelId: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: {},
  sendMessage: (channelId, content) => {
    const newMessage = {
      id: generateId(),
      content,
      author: get().currentUser,
      timestamp: new Date(),
      reactions: [],
    };
    set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: [...(state.messages[channelId] || []), newMessage],
      },
    }));
  },
  loadMessages: (channelId) => {
    // Load from localStorage or generate mock
    const mockMessages = generateMockMessages(channelId);
    set((state) => ({
      messages: { ...state.messages, [channelId]: mockMessages },
    }));
  },
  addReaction: (messageId, emoji) => {
    // Add reaction to message
    set((state) => {
      const updatedMessages = { ...state.messages };
      Object.keys(updatedMessages).forEach((channelId) => {
        updatedMessages[channelId] = updatedMessages[channelId].map((msg) =>
          msg.id === messageId
            ? { ...msg, reactions: [...msg.reactions, { emoji, userId: 'current-user' }] }
            : msg
        );
      });
      return { messages: updatedMessages };
    });
  },
}));
```

### 4.5 Performance Optimization

**Bundle Size Targets:**
- **Initial JS:** <150KB gzipped
- **First Paint:** <1 second
- **Interactive:** <2 seconds
- **Total bundle:** <500KB (all routes loaded)

**Optimization Strategies:**

1. **Code Splitting:**
```typescript
// Lazy load heavy components
const UserProfile = dynamic(() => import('@/components/modals/UserProfile'), {
  loading: () => <Skeleton />,
});

const ServerSettings = dynamic(() => import('@/components/modals/ServerSettings'));
```

2. **Virtual Scrolling:**
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function MessageList({ messages }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Average message height
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="message-list">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <Message message={messages[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

3. **Image Optimization:**
```tsx
import Image from 'next/image';

<Image
  src={user.avatar}
  alt={user.username}
  width={40}
  height={40}
  className="rounded-full"
  loading="lazy"
  quality={85}
/>
```

4. **Animation Performance:**
```css
/* Use GPU-accelerated properties only */
.optimized-animation {
  will-change: transform, opacity;
  transform: translateZ(0); /* Force GPU layer */
}

/* Avoid animating: */
/* - width/height (causes reflow) */
/* - top/left (use transform instead) */
/* - background (use opacity on pseudo-element instead) */
```

5. **React 19 Optimizations:**
```tsx
// Use React 19's automatic batching
import { startTransition } from 'react';

function handleSearch(query: string) {
  startTransition(() => {
    // Low-priority update
    setSearchResults(searchMessages(query));
  });
}

// Use React Compiler for automatic memoization
// No need for useMemo/useCallback in most cases
```

### 4.6 Resource Usage Targets

**Measurable Goals:**

| Metric | Target | Measurement |
|--------|--------|-------------|
| **RAM (Idle)** | <50MB | Chrome Task Manager |
| **RAM (Active)** | <100MB | Chrome Task Manager |
| **CPU (Idle)** | <2% | Chrome Task Manager |
| **CPU (Active)** | <5% | Chrome Task Manager |
| **GPU Usage** | 0% (except animations) | Chrome DevTools Performance |
| **Initial Load** | <1s on 3G | Lighthouse |
| **Bundle Size** | <150KB initial | webpack-bundle-analyzer |
| **FPS (Animations)** | 60fps constant | Chrome DevTools Performance |

**Testing Methodology:**
1. Open in Chrome/Edge
2. Navigate to 5-10 servers with active channels
3. Send 50 messages
4. Scroll through 1000+ message history
5. Monitor Task Manager for 5 minutes
6. Compare to Discord baseline (200-400MB RAM)

---

## 5. Mock Data Strategy

### 5.1 Data Generation

**Faker.js Integration:**
```typescript
import { faker } from '@faker-js/faker';

export function generateMockUser(): User {
  return {
    id: faker.string.uuid(),
    username: faker.internet.userName(),
    discriminator: faker.string.numeric(4),
    avatar: faker.image.avatar(),
    status: faker.helpers.arrayElement(['online', 'idle', 'dnd', 'offline']),
    customStatus: faker.helpers.maybe(() => ({
      emoji: faker.internet.emoji(),
      text: faker.lorem.sentence(5),
    })),
    createdAt: faker.date.past({ years: 2 }),
  };
}

export function generateMockServer(): Server {
  return {
    id: faker.string.uuid(),
    name: faker.company.name(),
    icon: faker.image.url({ width: 128, height: 128 }),
    banner: faker.image.url({ width: 960, height: 540 }),
    memberCount: faker.number.int({ min: 10, max: 10000 }),
    categories: Array.from({ length: 3 }, () => ({
      id: faker.string.uuid(),
      name: faker.word.noun(),
      channels: Array.from({ length: 5 }, generateMockChannel),
    })),
  };
}

export function generateMockMessage(): Message {
  return {
    id: faker.string.uuid(),
    content: faker.lorem.paragraph(),
    author: generateMockUser(),
    timestamp: faker.date.recent(),
    reactions: faker.helpers.maybe(() =>
      Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
        emoji: faker.internet.emoji(),
        count: faker.number.int({ min: 1, max: 20 }),
        userIds: [],
      }))
    ),
    attachments: faker.helpers.maybe(() => [
      {
        id: faker.string.uuid(),
        filename: faker.system.fileName(),
        url: faker.image.url(),
        size: faker.number.int({ min: 1000, max: 5000000 }),
      },
    ]),
  };
}
```

### 5.2 LocalStorage Persistence

**Data Schema:**
```typescript
interface LocalStorageData {
  user: User;
  servers: Server[];
  friends: User[];
  directMessages: DirectMessage[];
  settings: UserSettings;
}

// Save to localStorage
function saveToLocalStorage(key: string, data: any) {
  localStorage.setItem(`bedrock_${key}`, JSON.stringify(data));
}

// Load from localStorage with fallback to mock
function loadFromLocalStorage<T>(key: string, generateMock: () => T): T {
  const stored = localStorage.getItem(`bedrock_${key}`);
  if (stored) {
    return JSON.parse(stored);
  }
  const mock = generateMock();
  saveToLocalStorage(key, mock);
  return mock;
}
```

### 5.3 Mock Service Worker (MSW)

**API Handlers:**
```typescript
// mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Auth
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json();
    return HttpResponse.json({
      user: generateMockUser(),
      token: 'mock-jwt-token',
    });
  }),

  // Messages
  http.get('/api/channels/:channelId/messages', ({ params }) => {
    const messages = Array.from({ length: 50 }, generateMockMessage);
    return HttpResponse.json({ messages });
  }),

  http.post('/api/channels/:channelId/messages', async ({ request, params }) => {
    const { content } = await request.json();
    const message = {
      ...generateMockMessage(),
      content,
      timestamp: new Date(),
    };
    return HttpResponse.json({ message });
  }),

  // Servers
  http.get('/api/servers', () => {
    const servers = Array.from({ length: 5 }, generateMockServer);
    return HttpResponse.json({ servers });
  }),
];
```

---

## 6. Backend Integration Readiness

### 6.1 API Abstraction Layer

**Service Pattern:**
```typescript
// lib/api/messages.ts
export class MessageService {
  async getMessages(channelId: string): Promise<Message[]> {
    // During development: return mock data
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      return generateMockMessages(channelId);
    }
    
    // Production: call real API
    const response = await fetch(`/api/channels/${channelId}/messages`);
    return response.json();
  }

  async sendMessage(channelId: string, content: string): Promise<Message> {
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      return {
        ...generateMockMessage(),
        content,
        timestamp: new Date(),
      };
    }

    const response = await fetch(`/api/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    return response.json();
  }
}

export const messageService = new MessageService();
```

### 6.2 WebSocket Integration Points

**WebSocket Hook (Stub):**
```typescript
// lib/hooks/useWebSocket.ts
export function useWebSocket(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      // Mock: simulate real-time updates with random messages
      const interval = setInterval(() => {
        if (Math.random() > 0.7) {
          setMessages((prev) => [...prev, generateMockMessage()]);
        }
      }, 5000);
      return () => clearInterval(interval);
    }

    // Production: connect to WebSocket
    const ws = new WebSocket(`wss://api.bedrockchat.com/channels/${channelId}`);
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prev) => [...prev, message]);
    };

    return () => ws.close();
  }, [channelId]);

  return { messages };
}
```

### 6.3 Encryption Hooks (Stub)

**E2E Encryption Interface:**
```typescript
// lib/hooks/useEncryption.ts
export function useEncryption() {
  async function encryptMessage(content: string, recipientPublicKey: string): Promise<string> {
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      // Mock: just return the content (not actually encrypted)
      return content;
    }

    // Production: use Signal Protocol
    const encrypted = await signalProtocol.encrypt(content, recipientPublicKey);
    return encrypted;
  }

  async function decryptMessage(encrypted: string, senderPublicKey: string): Promise<string> {
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      return encrypted; // Mock: already plain text
    }

    const decrypted = await signalProtocol.decrypt(encrypted, senderPublicKey);
    return decrypted;
  }

  return { encryptMessage, decryptMessage };
}
```

### 6.4 Environment Configuration

```env
# .env.local (development)
NEXT_PUBLIC_USE_MOCKS=true
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000

# .env.production
NEXT_PUBLIC_USE_MOCKS=false
NEXT_PUBLIC_API_URL=https://api.bedrockchat.com
NEXT_PUBLIC_WS_URL=wss://api.bedrockchat.com
```

---

## 7. Design Deliverables

### 7.1 Pages/Routes

**Public Pages:**
1. **Landing Page** (`/`)
   - Hero section (animated gradient background)
   - Feature showcase (privacy, performance, AI)
   - Comparison table (vs Discord)
   - CTA buttons (Try Now, Learn More)

2. **Login** (`/login`)
   - Glass card with logo
   - Email/password inputs
   - "Forgot password" link
   - "Sign up" link
   - Social login buttons (mock)

3. **Sign Up** (`/signup`)
   - Multi-step wizard
   - Account type selection (Standard vs Family)
   - Email verification (mock)
   - Welcome screen

**Authenticated Pages:**
1. **Main App** (`/app`)
   - Server list sidebar
   - Channel list sidebar
   - Message view
   - User panel (bottom)

2. **Server View** (`/app/servers/[serverId]`)
   - Channel-specific messages
   - Channel header (topic, members)

3. **DM View** (`/app/dms/[userId]`)
   - 1-on-1 conversation
   - Call buttons (voice/video)

4. **Friends** (`/app/friends`)
   - Friends list (tabs: All, Online, Pending, Blocked)
   - Add friend form

5. **Settings** (`/app/settings`)
   - Slide-in panel with tabs
   - Account, Privacy, Appearance, etc.

6. **Parent Dashboard** (`/app/family/dashboard`)
   - Teen activity overview
   - Monitoring controls
   - Message viewer (if enabled)

### 7.2 Modals

1. **User Profile Modal**
   - Avatar, banner, username
   - Custom status
   - Badges
   - Actions (Message, Add Friend)

2. **Server Settings Modal**
   - Tabs (Overview, Roles, Channels, etc.)
   - Complex forms with validation

3. **Create Server Modal**
   - Template selection (Gaming, Study, etc.)
   - Name, icon upload
   - Initial channels

4. **Create Channel Modal**
   - Name, type (text/voice), category
   - Permissions (basic)

5. **Image Preview Modal**
   - Full-screen image viewer
   - Download button
   - Navigate between images

6. **Invite Modal**
   - Generate invite link
   - Expiry settings
   - Max uses

### 7.3 Component Library

**UI Components (Storybook):**
- Button (variants: primary, secondary, danger, ghost)
- Input (text, password, textarea)
- Select dropdown
- Toggle switch
- Slider
- Avatar (with status indicator)
- Badge
- Card (glass variants)
- Modal
- Toast notification
- Tooltip
- Context menu
- Emoji picker
- Color picker

**Chat Components:**
- Message
- MessageList (with virtual scrolling)
- MessageInput (with emoji/GIF pickers)
- TypingIndicator
- ReactionBar
- ThreadPreview

**Navigation Components:**
- ServerIcon (with tooltip)
- ChannelItem (with unread badge)
- UserPanel (with status selector)

---

## 8. Development Phases

### Phase 1: Foundation (Week 1-2)

**Goals:**
- Next.js project setup
- Design system implementation
- Component library (Storybook)
- Mock data generation

**Deliverables:**
- [ ] Project scaffolding (Next.js 15 + TypeScript)
- [ ] Tailwind config with custom theme
- [ ] Glass morphism base components
- [ ] Animation utilities (Framer Motion)
- [ ] 20+ UI components in Storybook
- [ ] Mock data generators (Faker.js)

### Phase 2: Authentication & Navigation (Week 3-4)

**Goals:**
- Landing page
- Auth flows (login, signup)
- Main layout with sidebars
- Server/channel navigation

**Deliverables:**
- [ ] Landing page (hero + features)
- [ ] Login/signup pages
- [ ] Account type selection (Standard vs Family)
- [ ] Server list sidebar (mock servers)
- [ ] Channel list sidebar (mock channels)
- [ ] User panel (status selector)
- [ ] LocalStorage persistence

### Phase 3: Core Chat (Week 5-6)

**Goals:**
- Message view with virtual scrolling
- Message input with rich features
- Real-time mock updates
- Search functionality

**Deliverables:**
- [ ] MessageList with virtual scrolling
- [ ] Message component (with glass effects)
- [ ] Typing indicator (animated)
- [ ] MessageInput (emoji, GIF, file upload)
- [ ] Reactions (add/remove)
- [ ] Reply threads
- [ ] Global search (Cmd+K)
- [ ] Mock WebSocket (random messages)

### Phase 4: Social Features (Week 7-8)

**Goals:**
- Friends list
- Direct messages
- User profiles
- Notifications

**Deliverables:**
- [ ] Friends list (with tabs)
- [ ] Add friend flow
- [ ] DM conversations
- [ ] User profile modal
- [ ] Toast notifications
- [ ] Notification center
- [ ] Unread badges

### Phase 5: Advanced Features (Week 9-10)

**Goals:**
- Server management
- Voice/video UI (mock)
- Settings panel
- Family accounts

**Deliverables:**
- [ ] Server settings modal
- [ ] Channel creation/editing
- [ ] Role management (UI only)
- [ ] Voice channel UI (mock video tiles)
- [ ] Settings panel (all tabs)
- [ ] Parent dashboard
- [ ] Teen account indicators

### Phase 6: Polish & Optimization (Week 11-12)

**Goals:**
- Performance tuning
- Accessibility
- Error states
- Loading states

**Deliverables:**
- [ ] Bundle size <150KB
- [ ] 60fps animations verified
- [ ] RAM <50MB idle
- [ ] Keyboard navigation (A11y)
- [ ] Screen reader support
- [ ] Error boundaries
- [ ] Skeleton loaders
- [ ] Empty states
- [ ] 404/500 pages

---

## 9. Success Metrics

### 9.1 Performance Benchmarks

**Critical Metrics:**
| Metric | Target | How to Measure |
|--------|--------|----------------|
| First Contentful Paint | <0.8s | Lighthouse |
| Largest Contentful Paint | <1.5s | Lighthouse |
| Time to Interactive | <2s | Lighthouse |
| Cumulative Layout Shift | <0.1 | Lighthouse |
| RAM (idle) | <50MB | Chrome Task Manager |
| RAM (active use) | <100MB | Chrome Task Manager |
| CPU (idle) | <2% | Chrome Task Manager |
| CPU (scrolling) | <5% | Chrome Task Manager |
| Bundle size (initial) | <150KB gzipped | webpack-bundle-analyzer |
| Animation FPS | 60fps | Chrome DevTools Performance |

### 9.2 User Experience Goals

**Qualitative:**
- [ ] "This is the most beautiful chat app I've ever seen"
- [ ] "I can't believe how smooth this is"
- [ ] "Finally, a Discord alternative that respects privacy"
- [ ] "My parents actually like that they can monitor me"
- [ ] "I can play games with this open and not lose FPS"

**Quantitative:**
- [ ] 90%+ positive feedback in alpha testing
- [ ] <1% of users report performance issues
- [ ] 95%+ of parents approve of Family Accounts
- [ ] 80%+ of gamers prefer it over Discord (beta survey)

---

## 10. Non-Goals (Out of Scope for Frontend Phase)

**What We're NOT Building Yet:**
- ❌ Real backend API
- ❌ Actual WebSocket implementation
- ❌ Real E2E encryption
- ❌ Video/voice calling (real)
- ❌ Screen sharing
- ❌ File upload to storage
- ❌ Bot integrations
- ❌ Payment/billing
- ❌ Mobile apps (native)
- ❌ Desktop app (Electron)

**These come in Backend Integration Phase (after frontend is complete)**

---

## 11. Open Questions

**To Resolve Before Development:**
1. Should we build PWA for mobile during frontend phase? (Recommend: Yes, it's free)
2. Do we want dark mode AND light mode, or dark-only for now? (Recommend: Both, toggle in settings)
3. Should voice channels show mock waveforms, or just static UI? (Recommend: Mock waveforms - more impressive)
4. How much mock data should we generate? (Recommend: 5 servers, 50 channels, 1000 messages total)
5. Should we implement real-time mock updates (random messages)? (Recommend: Yes, makes it feel alive)

---

## 12. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Performance targets not met** | Medium | High | Profile early and often, optimize as you build |
| **Animations cause jank on low-end devices** | Medium | Medium | Provide "reduced motion" mode in settings |
| **Bundle size exceeds 150KB** | Low | Medium | Code splitting, dynamic imports, tree shaking |
| **Glass effects look bad on light mode** | Low | Low | Test both themes frequently |
| **Too much complexity** | Medium | High | Follow YAGNI - build what's in PRD, nothing more |
| **Scope creep** | High | High | Strict adherence to PRD, no "just one more feature" |

---

## 13. Definition of Done

**Frontend Phase is Complete When:**
- [ ] All Phase 1-6 deliverables checked off
- [ ] Performance metrics met (RAM <50MB, CPU <2%, etc.)
- [ ] All pages/modals designed and implemented
- [ ] Mock data flows through all features
- [ ] LocalStorage persistence works
- [ ] Deployed to Vercel (preview URL)
- [ ] Tested on Chrome, Firefox, Safari, Edge
- [ ] Tested on Windows, Mac, Linux
- [ ] Mobile responsive (PWA ready)
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] No console errors
- [ ] Storybook documentation complete
- [ ] Code review completed
- [ ] Partner review completed
- [ ] User testing (5-10 people) completed

**Then, and only then, do we start backend integration.**

---

## Appendix A: Design Inspiration

**Reference Apps (Steal the Best Ideas):**
- **Linear:** Command palette, keyboard shortcuts, polish
- **Raycast:** Glass morphism, smooth animations
- **Arc Browser:** Vertical navigation, vibrant colors
- **Notion:** Clean information hierarchy
- **Superhuman:** Email composer with keyboard-first design
- **Stripe Dashboard:** Data visualization, professional feel

**Not Discord. We're inspired by Discord's functionality, but our design is 100% original.**

---

## Appendix B: Keyboard Shortcuts

**Essential Shortcuts to Implement:**
- `Cmd/Ctrl + K` - Search (global command palette)
- `Cmd/Ctrl + /` - Toggle shortcuts help
- `Esc` - Close modal/cancel action
- `Cmd/Ctrl + Enter` - Send message
- `Arrow Up` - Edit last message
- `Arrow Down` - Navigate channels
- `Alt + Arrow Up/Down` - Navigate servers
- `Cmd/Ctrl + Shift + M` - Mute/unmute
- `Cmd/Ctrl + Shift + D` - Deafen
- `Cmd/Ctrl + I` - Toggle inbox/notifications
- `@` - Mention user (autocomplete)
- `:` - Emoji picker (autocomplete)
- `/` - Slash commands (future)

---

## Appendix C: Color Palette (Extended)

**Dark Theme (Primary):**
```css
--bg-primary: #0F172A;      /* slate-900 */
--bg-secondary: #1E293B;    /* slate-800 */
--bg-tertiary: #334155;     /* slate-700 */
--text-primary: #F1F5F9;    /* slate-100 */
--text-secondary: #CBD5E1;  /* slate-300 */
--text-muted: #64748B;      /* slate-500 */
--border: rgba(255, 255, 255, 0.1);
--glass-bg: rgba(15, 23, 42, 0.75);
--glass-border: rgba(255, 255, 255, 0.1);
```

**Light Theme (Secondary):**
```css
--bg-primary: #FFFFFF;
--bg-secondary: #F8FAFC;    /* slate-50 */
--bg-tertiary: #F1F5F9;     /* slate-100 */
--text-primary: #0F172A;    /* slate-900 */
--text-secondary: #475569;  /* slate-600 */
--text-muted: #94A3B8;      /* slate-400 */
--border: rgba(0, 0, 0, 0.1);
--glass-bg: rgba(255, 255, 255, 0.75);
--glass-border: rgba(0, 0, 0, 0.1);
```

**Semantic Colors (Both Themes):**
```css
--primary: linear-gradient(135deg, #0080FF 0%, #00D4FF 100%);
--secondary: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);
--success: #10B981;
--warning: #F59E0B;
--danger: #EF4444;
--info: #3B82F6;
```

---

## Appendix D: Animation Library

**Pre-built Animation Variants (Framer Motion):**
```typescript
export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideInFromRight: {
    initial: { x: 300, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 300, opacity: 0 },
  },
  scaleIn: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
  },
  bounce: {
    animate: {
      y: [0, -10, 0],
      transition: { repeat: Infinity, duration: 1.5 },
    },
  },
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      transition: { repeat: Infinity, duration: 2 },
    },
  },
};

// Usage:
<motion.div variants={animations.fadeIn} initial="initial" animate="animate" exit="exit">
  Content
</motion.div>
```

---

**END OF PRD**

*This document is the single source of truth for Bedrock Chat frontend development. Any changes require PRD update and stakeholder approval.*

**Next Steps:**
1. Review and approve PRD
2. Set up Next.js project
3. Begin Phase 1 (Foundation)
4. Weekly check-ins on progress vs. timeline

**Questions? Contact:** Braxton, Bedrock AI Systems
