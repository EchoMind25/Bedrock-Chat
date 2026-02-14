# Bedrock Chat - Product Requirements Document
**Version:** 1.0  
**Last Updated:** February 13, 2026  
**Status:** MVP Development Phase

---

## EXECUTIVE SUMMARY

Bedrock Chat is a privacy-first Discord alternative targeting families with teens. Built in response to Discord's controversial ID verification and facial recognition requirements, Bedrock Chat offers transparent Family Account monitoring without platform data harvesting.

### Core Differentiators
- **Privacy-First:** No government IDs, no facial scans, no hidden surveillance
- **Family Safety:** Transparent monitoring (4 levels) that builds trust
- **Gamer-Optimized:** <50MB RAM, <2% CPU idle - no gaming performance impact
- **Voice Ethics:** Metadata only (timestamps, participants) - NO audio recordings

### Success Metrics
- 1,000 users on self-hosted infrastructure within 6 months
- <50MB RAM usage (idle), <2% CPU usage (idle)
- WCAG 2.1 AA accessibility compliance
- COPPA, GDPR, CCPA full compliance

---

## TECHNICAL STACK

### Core Technologies (February 2026)
- **Frontend:** Next.js 16.1 with Turbopack, React 19.2
- **Styling:** Tailwind CSS 4.1 (CSS-first @theme directive)
- **Animation:** Motion 12.34.0 (NOT Framer Motion - deprecated)
- **3D Graphics:** Three.js, @react-three/fiber, @react-three/drei
- **State:** Zustand with persist middleware
- **Backend (Temporary):** Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Voice/Video (Temporary):** Daily.co WebRTC
- **Deployment:** Vercel (temporary), self-hosted target

### Critical Constraints
- **NO middleware.ts** - Use proxy.ts (Next.js 16 deprecation)
- **NO localStorage in useEffect** without proper guards
- **NO circular state dependencies** (prevents React error 185)
- **NO setState in render cycles** (prevents infinite loops)

---

## FEATURE REQUIREMENTS

## 1. LANDING PAGE ✅ HIGH PRIORITY

### 1.1 3D Hero Scene
**Status:** Implemented but needs verification  
**File:** `components/landing/hero-3d-scene.tsx`

**Requirements:**
- [ ] Colorful 3D liquid-like spheres/circles floating in space
- [ ] Space particle background (stars, nebula effects)
- [ ] Mouse tracking for parallax camera movement
- [ ] Progressive enhancement (3D → 2.5D → 2D based on device capability)
- [ ] Performance tier detection (high/medium/low)
- [ ] Lazy loading with `next/dynamic` ssr: false
- [ ] Respects `prefers-reduced-motion`
- [ ] Fallback for non-WebGL devices
- [ ] Mobile optimizations (reduced particles, simplified geometry)

**Technical Specs:**
- Three.js canvas with `@react-three/fiber`
- `MeshTransmissionMaterial` for liquid glass effect
- Multiple `Float` components for organic movement
- Mouse position → camera position lerp (smooth following)
- Particle count: 1500 (desktop), 800 (mobile)
- Target: <3s LCP, 60fps animation

**Acceptance Criteria:**
- User sees animated 3D scene on desktop
- Mouse movement creates parallax depth
- Fallback renders on mobile/low-end devices
- No console errors
- Lighthouse Performance >90

---

### 1.2 Landing Page Sections
**Status:** Needs implementation verification

**Requirements:**
- [ ] Hero section with 3D background
- [ ] "No government ID required" badge
- [ ] Value proposition headline
- [ ] Feature highlights (E2E encryption, COPPA compliant, <50MB RAM)
- [ ] Trust signals section
- [ ] Comparison table (vs Discord, Telegram)
- [ ] Social proof / testimonials (placeholder)
- [ ] CTA buttons: "Start Your Private Server", "Learn More"
- [ ] Footer with privacy policy, terms, contact

**Acceptance Criteria:**
- All sections render correctly
- Responsive on 375px - 1920px
- WCAG 2.1 AA contrast ratios
- Smooth scroll behavior
- CTA buttons navigate to auth flow

---

## 2. AUTHENTICATION & ONBOARDING ⚠️ CRITICAL

### 2.1 Login/Signup Flow
**Status:** Needs verification  
**Files:** `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`

**Requirements:**
- [ ] Login page with email/password or magic link
- [ ] Signup page with email verification
- [ ] OAuth options: Google, GitHub (privacy-conscious consent)
- [ ] Password strength validation
- [ ] Rate limiting (prevent brute force)
- [ ] Session management with Supabase Auth
- [ ] CSRF protection

**Acceptance Criteria:**
- User can create account with email
- Email verification required before access
- Sessions persist across browser restarts
- Secure cookie handling (httpOnly, secure, sameSite)
- No auth bypass vulnerabilities

---

### 2.2 Immersive Onboarding Experience ⭐ SIGNATURE FEATURE
**Status:** Needs implementation  
**File:** `app/(auth)/onboarding/page.tsx`

**Requirements:**
- [ ] **World Formation Animation** on first login/signup
  - [ ] Stage 1 (0-2s): Fade from black, particles coalesce into logo
  - [ ] Stage 2 (2-5s): Environment materializes (ground → structures → lighting)
  - [ ] Stage 3 (5-7s): Portal activates, auth options slide in
- [ ] **Portal Transition Logic** (Game Elevator Pattern)
  - [ ] Portal animation acts as loading screen for next route
  - [ ] Assets preload during portal animation (async)
  - [ ] Transition duration = minimum loading time
  - [ ] If loading completes before transition, wait for transition to finish
  - [ ] "Skip" button allows bypass → standard loading spinner
- [ ] Profile setup: Avatar upload, display name, status
- [ ] Server preference: Create new or join existing
- [ ] Privacy consent (GDPR/CCPA)

**Technical Implementation:**
````typescript
// Portal transition with loading logic
async function portalTransition(nextRoute: string) {
  const transitionDuration = 2000; // 2s minimum
  const startTime = Date.now();
  
  // Start portal animation
  setPortalAnimating(true);
  
  // Preload next route assets in parallel
  const loadPromise = preloadRoute(nextRoute);
  
  // Wait for BOTH transition AND loading
  await Promise.all([
    loadPromise,
    new Promise(resolve => setTimeout(resolve, transitionDuration))
  ]);
  
  const elapsed = Date.now() - startTime;
  if (elapsed < transitionDuration) {
    // Ensure minimum transition time for smooth experience
    await new Promise(resolve => setTimeout(resolve, transitionDuration - elapsed));
  }
  
  setPortalAnimating(false);
  router.push(nextRoute);
}
````

**Acceptance Criteria:**
- World formation plays on first login (skippable)
- Portal transition feels seamless (no loading flash)
- Assets preload during animation
- "Skip" works and shows standard loading
- No jank or stuttering
- Works on mobile (touch-friendly)

---

### 2.3 Portal Navigation System ⭐ SIGNATURE FEATURE
**Status:** Partially implemented  
**File:** `components/navigation/portal-overlay.tsx`

**Requirements:**
- [ ] **Sidebar:** Traditional server list (icons, labels on hover)
- [ ] **Portal Overlay:** Click server → immersive environment transition
- [ ] **Server Environments:** Each server has unique visual theme
- [ ] **Smooth Transitions:** Physics-based easing with Motion 12.34.0
- [ ] **Escape Key:** Close portal, return to previous context
- [ ] **Performance:** Portal animation <300ms, no jank

**Navigation Flow:**
````
User clicks server icon
  ↓
Portal overlay opens (0-300ms animation)
  ↓
Server environment loads (preload during animation)
  ↓
Portal fades to reveal server content
  ↓
User is in server (can navigate channels)
  ↓
Click sidebar or press Escape
  ↓
Portal transition back to previous state
````

**Anti-Pattern to Avoid (React Error 185):**
````typescript
// ❌ NEVER DO THIS - Causes infinite loop
function PortalOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  
  // BAD: Sets state every render
  if (someCondition) {
    setIsOpen(true); // ← Infinite loop!
  }
  
  return ...;
}

// ✅ CORRECT - Use useEffect with proper deps
function PortalOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    if (someCondition) {
      setIsOpen(true);
    }
  }, [someCondition]); // ← Only runs when someCondition changes
  
  return ...;
}
````

**Acceptance Criteria:**
- Portal opens on server click
- Environment transitions smoothly
- No React error 185 (infinite loop)
- Escape key closes portal
- Previous state restored on close

---

## 3. MAIN APPLICATION LAYOUT 🏗️ CRITICAL

### 3.1 Three-Column Discord-Style Layout
**Status:** Implemented (needs verification)  
**File:** `app/(main)/layout.tsx`

**Requirements:**
- [ ] **Left Column (72px):** Server list, scrollable
- [ ] **Middle Column (240px):** Channel list + user panel
- [ ] **Right Column (Flexible):** Main content area
- [ ] Responsive: Collapse to single column on mobile (<768px)
- [ ] Smooth transitions between states
- [ ] Persistent across route changes

**Layout Structure:**
````tsx

  {/* Server List - 72px */}
  
  
  {/* Channel List + User Panel - 240px */}
  
    
    
  
  
  {/* Main Content - Flexible */}
  
    {children}
  

````

**Acceptance Criteria:**
- Layout renders on all routes under `(main)`
- Server/channel navigation works
- Responsive on mobile
- No layout shift (CLS < 0.1)

---

## 4. SERVER MANAGEMENT 🔧

### 4.1 Server Creation
**Status:** Implemented (needs verification)  
**File:** `components/server/create-server-modal.tsx`

**Requirements:**
- [ ] Modal with server creation form
- [ ] Server name input (validation)
- [ ] Server icon upload (optional)
- [ ] Server description textarea
- [ ] Privacy settings: Public/Private
- [ ] Create button triggers server creation
- [ ] Loading state during creation
- [ ] Success → Navigate to new server
- [ ] Error handling with toast notifications

**Acceptance Criteria:**
- User can create server
- Server appears in server list
- Navigation to new server works
- Validation prevents invalid input

---

### 4.2 Server Settings
**Status:** Partially implemented  
**File:** `components/server/server-settings-modal/`

**Requirements:**
- [ ] **Overview Tab:** Name, icon, description, delete server
- [ ] **Roles Tab:** Create/edit roles, permission management
- [ ] **Channels Tab:** Channel organization, categories
- [ ] **Invites Tab:** Generate invites, expiry settings
- [ ] **Moderation Tab:** Automod, ban list, audit log

**Acceptance Criteria:**
- All tabs functional
- Settings persist to database
- Permission changes apply immediately
- Audit log tracks all actions

---

### 4.3 Channel Management
**Status:** Needs verification

**Requirements:**
- [ ] Create text/voice channels
- [ ] Channel categories
- [ ] Drag-and-drop reordering
- [ ] Channel permissions (override server roles)
- [ ] Delete channel (with confirmation)

---

## 5. FAMILY ACCOUNT SYSTEM 👨‍👩‍👧‍👦 CRITICAL

### 5.1 Monitoring Levels
**Status:** Implemented (needs verification)  
**File:** `store/family.store.ts`

**Requirements:**
- [ ] **Minimal:** Server list, friend list only
- [ ] **Moderate:** + Message frequency, channel topics
- [ ] **Balanced:** + Actual message content (parent has decryption key)
- [ ] **Restricted:** + Real-time alerts, keyword monitoring

**Transparency:**
- [ ] Teen sees current monitoring level in Settings → Family
- [ ] Teen sees transparency log (parent actions)
- [ ] Parent actions logged with timestamps

**Acceptance Criteria:**
- Parent can set/change monitoring level
- Teen UI reflects current level
- Data access matches level permissions
- Transparency log accurate

---

### 5.2 Parent Dashboard
**Status:** Implemented (needs verification)  
**File:** `app/(main)/family/dashboard/page.tsx`

**Requirements:**
- [ ] **Overview:** Teen account summary, recent activity
- [ ] **Servers:** List of teen's servers, join requests
- [ ] **Friends:** Teen's friend list, pending requests
- [ ] **Messages:** Monitored messages (Balanced/Restricted only)
- [ ] **Flags:** AI-flagged content alerts (Supervised/Restricted)
- [ ] **Settings:** Change monitoring level, export data

**Separate Visual Identity:**
- [ ] Light mode default (parents expect this)
- [ ] Clean, professional design (NOT cyberpunk)
- [ ] Larger text, simplified navigation
- [ ] Calm color palette (trust/safety)

**Acceptance Criteria:**
- Parent dashboard loads without errors
- All tabs functional
- Data export works (PDF)
- Monitoring level changes propagate to teen UI

---

## 6. CHAT SYSTEM 💬

### 6.1 Message List
**Status:** Implemented (needs verification)  
**File:** `components/chat/message-list.tsx`

**Requirements:**
- [ ] Virtual scrolling (TanStack Virtual, React 19 compatible)
- [ ] Message grouping (same author within 5 min)
- [ ] Auto-scroll to bottom on new messages
- [ ] Typing indicators
- [ ] Emoji reactions
- [ ] Message editing/deletion
- [ ] Skeleton loading states
- [ ] Empty state handling

**CRITICAL - Prevent React Error 185:**
````typescript
// ❌ WRONG - Infinite loop
function MessageList({ messages }) {
  const [scrolled, setScrolled] = useState(false);
  
  // BAD: Runs on every render
  setScrolled(messages.length > 0); // ← Infinite loop!
  
  return ...;
}

// ✅ CORRECT
function MessageList({ messages }) {
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    setScrolled(messages.length > 0);
  }, [messages.length]); // ← Only when messages.length changes
  
  return ...;
}
````

**Acceptance Criteria:**
- Messages render in virtual scroller
- Smooth scrolling (60fps)
- No React error 185
- Typing indicators work
- Reactions display correctly

---

### 6.2 Message Input
**Status:** Needs verification  
**File:** `components/chat/message-input.tsx`

**Requirements:**
- [ ] Rich text editor (basic formatting)
- [ ] Emoji picker
- [ ] File upload (drag-and-drop)
- [ ] @ mentions (autocomplete)
- [ ] Typing indicator broadcast
- [ ] Character limit (2000)
- [ ] Send on Enter, newline on Shift+Enter

**Acceptance Criteria:**
- User can type and send messages
- Emoji picker works
- File uploads successful
- @ mentions work

---

## 7. VOICE/VIDEO SYSTEM 🎙️

### 7.1 Voice Channel UI
**Status:** Implemented (needs verification)  
**File:** `components/voice/voice-channel.tsx`

**Requirements:**
- [ ] Voice channel list in sidebar
- [ ] Click to join voice channel
- [ ] Participant tiles with avatars
- [ ] Mute/unmute, deafen/undeafen controls
- [ ] Screen share button (future)
- [ ] Disconnect button
- [ ] Voice settings (input/output device selection)

**Privacy Requirement (Gamer Code):**
- [ ] **NO audio recording** - Only metadata stored
- [ ] Metadata: Call start/end timestamps, participant list, duration
- [ ] No audio files on server
- [ ] Transparency: Teen/parent see voice call logs (metadata only)

**Acceptance Criteria:**
- User can join/leave voice channels
- Controls functional
- Only metadata logged
- No audio recordings anywhere

---

## 8. POINTS & ENGAGEMENT 🎮

### 8.1 Points System
**Status:** Implemented (needs verification)  
**File:** `lib/points-system.ts`

**Requirements:**
- [ ] Points earned: Messages (1pt), voice calls (5pt/10min), server creation (50pt)
- [ ] Daily cap: 500 points (prevent grinding)
- [ ] Anti-gaming: No points for spam (<2s between messages)
- [ ] Points display in user panel
- [ ] Points history log

**Acceptance Criteria:**
- Points awarded correctly
- Anti-gaming prevents exploitation
- Daily cap enforced

---

### 8.2 Easter Eggs
**Status:** Needs implementation  
**File:** `lib/easter-eggs.ts`

**Requirements:**
- [ ] Hidden interactions (click logo 7 times, konami code, etc.)
- [ ] Seasonal events (holiday themes)
- [ ] Achievement chains
- [ ] Hints system (gradual reveals)
- [ ] One-time rewards per user

---

### 8.3 Server Discovery
**Status:** Needs implementation

**Requirements:**
- [ ] Browse servers by category
- [ ] Search with filters
- [ ] Preview server before joining
- [ ] Join button (instant or request)

---

## 9. THEME SYSTEM 🎨

### 9.1 Server Themes
**Status:** Implemented (needs verification)  
**File:** `lib/themes/`

**Requirements:**
- [ ] Default themes: Neon Street, Industrial Zone, Organic Garden, Abstract Void
- [ ] Custom theme editor (500 points to unlock)
- [ ] Color picker with accessibility validation (4.5:1 contrast)
- [ ] Theme preview (split-screen)
- [ ] User can override server theme

**Acceptance Criteria:**
- Server owners can set theme
- Theme applies to all server members
- Users can override with personal preference
- All themes WCAG AA compliant

---

### 9.2 Profile Themes
**Status:** Needs implementation

**Requirements:**
- [ ] Personal theme for profile card
- [ ] Custom avatar border
- [ ] Status effects (Online/Away/DND glow)
- [ ] Unlockable with points

---

## 10. PERFORMANCE & OPTIMIZATION ⚡ CRITICAL

### 10.1 Resource Usage Targets
**Status:** Monitoring implemented (needs verification)  
**File:** `lib/performance/`

**Requirements:**
- [ ] **RAM Idle:** <50MB
- [ ] **RAM Active:** <150MB
- [ ] **CPU Idle:** <2%
- [ ] **CPU Active (messaging):** <10%
- [ ] **Initial Bundle:** <100KB gzipped
- [ ] **Each Route:** <50KB additional
- [ ] **LCP:** <2.5s
- [ ] **FID:** <100ms
- [ ] **CLS:** <0.1

**Idle Detection:**
- [ ] Detect 30s of no mouse/keyboard activity
- [ ] Pause non-essential animations
- [ ] Reduce WebSocket polling frequency
- [ ] Reactivate on any input

**Acceptance Criteria:**
- Lighthouse Performance >90
- Resource usage within targets
- Idle detection works
- No memory leaks

---

## 11. PRIVACY & COMPLIANCE 🔒 CRITICAL

### 11.1 Encryption
**Status:** Implemented (needs verification)  
**File:** `lib/encryption.ts`

**Requirements:**
- [ ] E2E encryption for messages (AES-GCM)
- [ ] Key exchange (ECDH)
- [ ] Password-derived keys (PBKDF2)
- [ ] Encrypted localStorage
- [ ] Private keys in IndexedDB
- [ ] Secure cleanup on logout

**Acceptance Criteria:**
- All messages encrypted
- Server cannot decrypt
- Keys managed securely

---

### 11.2 Compliance UI ⚠️ MISSING (HIGH PRIORITY)
**Status:** NOT IMPLEMENTED

**Requirements:**
- [ ] **GDPR Consent Banner**
  - [ ] Granular controls (analytics, marketing, functional)
  - [ ] Reject all / Accept all buttons
  - [ ] Consent stored in localStorage
  - [ ] Re-prompt if policy changes
- [ ] **CCPA Links in Footer**
  - [ ] "Do Not Sell or Share My Personal Information"
  - [ ] "Limit the Use of My Sensitive Personal Information"
  - [ ] Links to privacy settings page
- [ ] **Data Export Page**
  - [ ] User can request data export (DSAR)
  - [ ] Export includes: Messages, servers, friends, settings
  - [ ] Format: JSON download
  - [ ] Confirmation email
- [ ] **Privacy Policy Page**
  - [ ] Clear explanation of data collection
  - [ ] Retention policies
  - [ ] Third-party services (Daily.co, Supabase)
  - [ ] Contact information

**Acceptance Criteria:**
- GDPR consent banner shows on first visit
- User can change consent preferences
- CCPA links present in footer
- Data export works
- Privacy policy complete

---

## 12. ERROR HANDLING & ACCESSIBILITY ♿

### 12.1 Error Boundaries
**Status:** Partial implementation

**Requirements:**
- [ ] Global error boundary (`app/error.tsx`)
- [ ] Route-specific error boundaries
- [ ] Loading states (`app/**/loading.tsx`)
- [ ] 404 catch-all page
- [ ] Network error handling
- [ ] Graceful degradation

---

### 12.2 Accessibility
**Status:** Extensive implementation (needs verification)

**Requirements:**
- [ ] Keyboard navigation (100% coverage)
- [ ] ARIA labels on all interactive elements
- [ ] Focus indicators
- [ ] Skip links
- [ ] Color contrast validation (WCAG AA)
- [ ] Screen reader support
- [ ] Reduced motion respect

**Acceptance Criteria:**
- Lighthouse Accessibility >95
- Tab navigation works everywhere
- Screen reader announces content correctly
- All themes pass contrast checks

---

## 13. DATABASE SCHEMA 💾

### 13.1 Supabase Tables
**Status:** Needs migration file

**Required Tables:**
- [ ] users (id, username, avatar_url, status, points, created_at)
- [ ] family_accounts (parent_id, teen_id, monitoring_level)
- [ ] servers (id, name, icon_url, owner_id, theme)
- [ ] channels (id, server_id, name, type)
- [ ] messages (id, channel_id, user_id, content_encrypted, created_at)
- [ ] voice_calls (id, channel_id, started_at, ended_at, participants)
- [ ] server_members (server_id, user_id, role, joined_at)
- [ ] points_transactions (user_id, amount, reason, created_at)
- [ ] easter_eggs (code, points_reward, discovered_by)

**RLS Policies:**
- [ ] Users can read messages in servers they're members of
- [ ] Users can insert their own messages
- [ ] Parents can read teen messages (if monitoring level permits)
- [ ] Voice call metadata readable by participants

**Realtime:**
- [ ] Enable realtime for messages table
- [ ] Enable realtime for voice_calls table

---

## ANTI-PATTERNS TO AVOID (CRITICAL)

### React Error 185: Maximum Update Depth Exceeded

**Common Causes:**
````typescript
// ❌ setState in render
function Component() {
  const [state, setState] = useState(0);
  setState(1); // ← Infinite loop!
  return {state};
}

// ❌ setState in useEffect without deps
function Component() {
  const [state, setState] = useState(0);
  useEffect(() => {
    setState(state + 1); // ← Infinite loop!
  }); // Missing dependency array
  return {state};
}

// ❌ Circular store dependencies
const useStore = create((set, get) => ({
  value: 0,
  update: () => {
    const current = get().value;
    set({ value: current + 1 });
    get().update(); // ← Infinite loop!
  }
}));
````

**Prevention Checklist:**
- [ ] No setState outside useEffect/event handlers
- [ ] All useEffect have dependency arrays
- [ ] No circular store updates
- [ ] Cleanup functions in useEffect
- [ ] Debounce/throttle frequent updates
- [ ] Conditional renders don't trigger state changes

---

## DEPLOYMENT

### Current: Vercel (Temporary)
- [ ] Deploy to vercel.com
- [ ] Custom domain (bedrock-chat.com)
- [ ] Environment variables configured
- [ ] Preview deployments on PR

### Target: Self-Hosted
- [ ] Custom server hardware ready
- [ ] PostgreSQL database
- [ ] Redis for caching
- [ ] Node.js API server
- [ ] MinIO for file storage
- [ ] Self-hosted voice/video (replace Daily.co)

---

## SUCCESS CRITERIA

### Technical
- [ ] Lighthouse Performance >90
- [ ] Lighthouse Accessibility >95
- [ ] Bundle size <120KB gzipped
- [ ] 60fps animations
- [ ] WCAG 2.1 AA compliant

### Privacy
- [ ] GDPR compliant
- [ ] CCPA compliant
- [ ] GPC signals honored
- [ ] Zero third-party trackers
- [ ] All data deletable

### User Experience
- [ ] <3 clicks to send first message
- [ ] Family setup <5 minutes
- [ ] All states handled (loading, error, empty)
- [ ] Mobile responsive (375px - 1920px)

---

## TIMELINE

### Phase 1: Core Features (Current)
- Landing page with 3D hero
- Authentication & onboarding
- Main app layout
- Chat system
- Server management basics

### Phase 2: Family Features
- Family account creation
- Parent dashboard
- Monitoring levels
- Transparency logs

### Phase 3: Engagement
- Points system
- Easter eggs
- Server discovery
- Themes

### Phase 4: Compliance & Polish
- GDPR/CCPA consent UI
- Data export
- Privacy policy
- Performance optimization
- Accessibility audit

### Phase 5: Self-Hosted Migration
- Backend infrastructure
- Data migration
- Voice/video self-hosting

---

**Document Maintained By:** Braxton  
**Last Review:** February 13, 2026  
**Next Review:** After MVP launch
````

---

# **Feature Audit & Implementation Prompt (for Opus Plan Mode)**
````
You are auditing Bedrock Chat features and planning remaining implementation work. This is a PLAN MODE task - you will NOT implement code immediately. Instead, you will:

1. Check if each feature in PRD.md exists
2. Verify if it's visible/accessible on the site
3. Skip if complete
4. Plan implementation for missing features
5. Generate implementation.md with remaining work

## CRITICAL ANTI-PATTERN AWARENESS

**React Error 185: Maximum Update Depth Exceeded**

This error has caused 5+ hours of debugging. You MUST prevent it in all planned implementations.

### Common Causes:
````typescript
// ❌ NEVER: setState in render
function Bad() {
  const [count, setCount] = useState(0);
  setCount(count + 1); // ← Infinite loop!
  return {count};
}

// ❌ NEVER: setState in useEffect without deps
function Bad() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(count + 1); // ← Infinite loop!
  }); // Missing []
  return {count};
}

// ❌ NEVER: Circular store updates
const store = create((set, get) => ({
  value: 0,
  update: () => {
    set({ value: get().value + 1 });
    get().update(); // ← Infinite loop!
  }
}));

// ❌ NEVER: Prop changes trigger parent re-render
function Parent() {
  const [state, setState] = useState(0);
  return ; // If Child calls onChange in render
}
function Child({ onChange }) {
  onChange(Math.random()); // ← Infinite loop!
  return Child;
}
````

### Prevention Rules:
✅ Always use useEffect for side effects  
✅ Always provide dependency arrays  
✅ Never call setState outside event handlers/useEffect  
✅ Debounce/throttle frequent updates  
✅ Add cleanup functions to useEffect  
✅ Avoid circular store dependencies  
✅ Use refs for values that don't trigger re-renders  

---

## AUDIT METHODOLOGY

For EACH feature in PRD.md, follow this process:

### Step 1: Check File Existence
````bash
# Does the component/page exist?
ls -la [file-path-from-prd]

# Example:
ls -la components/landing/hero-3d-scene.tsx
````

**Result:**
- ✅ File exists → Proceed to Step 2
- ❌ File missing → Mark as "NOT IMPLEMENTED" → Add to implementation.md

### Step 2: Check Implementation Quality
````bash
# View the file
cat [file-path]

# Check for:
# - Is component complete? (not a stub)
# - Does it follow anti-pattern rules?
# - Are dependencies imported?
# - Is TypeScript strict?
````

**Quality Checklist:**
- [ ] Component is complete (not TODO/placeholder)
- [ ] No setState in render
- [ ] All useEffect have dependency arrays
- [ ] No circular dependencies
- [ ] TypeScript strict mode compliant
- [ ] Proper error handling

**Result:**
- ✅ Complete & quality → Proceed to Step 3
- ⚠️ Partial/buggy → Mark as "NEEDS REFACTOR" → Add to implementation.md
- ❌ Stub only → Mark as "NOT IMPLEMENTED" → Add to implementation.md

### Step 3: Check Visibility/Accessibility
````bash
# Is it imported and used?
grep -r "[component-name]" app/ components/

# Example:
grep -r "Hero3DScene" app/ components/
````

**Visibility Checklist:**
- [ ] Component is imported in parent
- [ ] Component is rendered (not commented out)
- [ ] Route is accessible (no auth blocking incorrectly)
- [ ] No console errors when accessing
- [ ] Visually renders on page

**Result:**
- ✅ Visible & accessible → Mark as "✅ COMPLETE" → Skip implementation
- ⚠️ Exists but not accessible → Mark as "NEEDS INTEGRATION" → Add to implementation.md
- ❌ Not visible → Mark as "NOT IMPLEMENTED" → Add to implementation.md

### Step 4: Document Findings

For each feature, record:
````markdown
## [Feature Name]
**Status:** [✅ COMPLETE | ⚠️ PARTIAL | ❌ NOT IMPLEMENTED]
**File:** [path]
**Issues:** [list any problems found]
**Action:** [SKIP | REFACTOR | IMPLEMENT]
````

---

## PORTAL TRANSITION LOGIC (CRITICAL)

**Game Elevator Pattern:** The portal transition acts as the loading screen.

### Requirements:
````typescript
// Portal transition with loading logic (Game Elevator Pattern)
async function portalTransition(nextRoute: string, skipAnimation = false) {
  const TRANSITION_MIN_DURATION = 2000; // 2s minimum
  const startTime = Date.now();
  
  if (skipAnimation) {
    // User skipped → Standard loading
    setLoadingState(true);
    await preloadRoute(nextRoute);
    setLoadingState(false);
    router.push(nextRoute);
    return;
  }
  
  // Start portal animation immediately
  setPortalAnimating(true);
  
  // Preload route assets in parallel with animation
  const loadPromise = preloadRoute(nextRoute);
  
  // Wait for BOTH animation AND loading to complete
  await Promise.all([
    loadPromise,
    new Promise(resolve => setTimeout(resolve, TRANSITION_MIN_DURATION))
  ]);
  
  // If loading finished early, still wait for animation
  const elapsed = Date.now() - startTime;
  if (elapsed < TRANSITION_MIN_DURATION) {
    await new Promise(resolve => 
      setTimeout(resolve, TRANSITION_MIN_DURATION - elapsed)
    );
  }
  
  // Animation complete, route loaded, navigate
  setPortalAnimating(false);
  router.push(nextRoute);
}

// Preload route assets
async function preloadRoute(route: string) {
  // Preload critical resources
  const promises = [
    // Prefetch Next.js route
    router.prefetch(route),
    
    // Preload images
    preloadImages(route),
    
    // Warm up API calls
    prefetchData(route),
  ];
  
  await Promise.allSettled(promises);
}
````

### When Portal Transition Occurs:
- [ ] After login/signup → Main app
- [ ] Clicking server icon → Server environment
- [ ] Switching servers → New server environment
- [ ] First-time onboarding → Profile setup

### Skip Button Behavior:
- [ ] Shows "Skip" button during animation
- [ ] On skip: Cancel portal, show standard loading spinner
- [ ] Standard loading: Simple spinner, fast route change
- [ ] User preference persisted (always skip or always animate)

### Anti-Patterns to Avoid:
````typescript
// ❌ WRONG: Loading state in render
function PortalTransition() {
  const [loading, setLoading] = useState(false);
  
  // BAD: Triggers on every render
  if (shouldLoad) {
    setLoading(true); // ← Infinite loop!
  }
  
  return ...;
}

// ✅ CORRECT: Loading in async function
function PortalTransition() {
  const [loading, setLoading] = useState(false);
  
  const handleTransition = async () => {
    setLoading(true);
    await portalTransition(route);
    setLoading(false);
  };
  
  return ...;
}
````

---

## OUTPUT: implementation.md

Generate a comprehensive implementation plan:
````markdown
# Bedrock Chat - Implementation Plan
**Generated:** [Date]
**Total Features Audited:** [Number]
**Complete:** [Number] ✅
**Partial:** [Number] ⚠️
**Missing:** [Number] ❌

---

## AUDIT SUMMARY

### ✅ Complete Features (Skip Implementation)
1. [Feature] - [File path] - [Notes]
2. ...

### ⚠️ Partial Features (Needs Refactor)
1. [Feature] - [File path]
   - Issue: [Description]
   - Fix: [What needs to be done]
   - Estimated effort: [Hours]
   - Priority: [HIGH/MEDIUM/LOW]

### ❌ Missing Features (Needs Implementation)
1. [Feature] - [Expected file path]
   - Description: [What it should do]
   - Dependencies: [What else is needed]
   - Estimated effort: [Hours]
   - Priority: [HIGH/MEDIUM/LOW]

---

## IMPLEMENTATION PHASES

### Phase 1: Critical Fixes (Est. [X] hours)
**Goal:** Fix breaking issues, complete core flows

#### 1.1 [Feature Name]
**Status:** ⚠️ PARTIAL  
**File:** [path]  
**Issue:** [Description]

**Implementation Plan:**
```typescript
// Pseudocode/outline of fix
1. [Step 1]
2. [Step 2]
3. [Step 3]
```

**Anti-Pattern Prevention:**
- [ ] No setState in render
- [ ] Proper useEffect deps
- [ ] No circular updates
- [ ] Cleanup functions added

**Acceptance Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]

**Testing:**
- [ ] Manual test: [Steps]
- [ ] Edge case: [Scenario]

---

#### 1.2 [Next Feature]
...

### Phase 2: Feature Completion (Est. [X] hours)
**Goal:** Implement missing MVP features

#### 2.1 [Feature Name]
**Status:** ❌ NOT IMPLEMENTED  
**File:** [path to create]  
**Description:** [What it should do]

**Implementation Plan:**
```typescript
// Component structure
function FeatureName() {
  // State management
  const [state, setState] = useState(initial);
  
  // Effects with proper deps
  useEffect(() => {
    // Side effect
  }, [dep1, dep2]);
  
  // Event handlers (NOT in render)
  const handleEvent = () => {
    setState(newValue);
  };
  
  return (
    // JSX
  );
}
```

**Dependencies:**
- [ ] [Dependency 1]
- [ ] [Dependency 2]

**Anti-Pattern Prevention:**
- [ ] No setState in render
- [ ] All useEffect have deps
- [ ] Debounced updates
- [ ] Proper cleanup

**Acceptance Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]

---

### Phase 3: Polish & Compliance (Est. [X] hours)
**Goal:** GDPR/CCPA compliance, accessibility, performance

#### 3.1 GDPR Consent Banner
**Status:** ❌ NOT IMPLEMENTED  
**Priority:** 🔴 CRITICAL

[Implementation plan...]

---

## CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION

### 🔴 BLOCKER Issues
1. **[Issue Name]**
   - Impact: [What breaks]
   - Cause: [Why it breaks]
   - Fix: [How to fix]
   - Effort: [Hours]

### 🟡 HIGH PRIORITY Issues
1. **[Issue Name]**
   - Impact: [What's affected]
   - Fix: [Solution]
   - Effort: [Hours]

---

## ESTIMATED TIMELINE

**Phase 1 (Critical):** [X] hours → [Y] days  
**Phase 2 (Features):** [X] hours → [Y] days  
**Phase 3 (Polish):** [X] hours → [Y] days  
**Total:** [X] hours → [Y] days

---

## NEXT STEPS

1. Review this implementation plan
2. Prioritize phases based on business needs
3. Begin Phase 1 (Critical Fixes)
4. Test thoroughly after each phase
5. Update this document as features complete

---

**Plan Generated By:** Claude Opus 4.6  
**Review Status:** Pending human approval  
**Implementation Status:** Not started
````
