# Bedrock Chat - Comprehensive Testing Procedures

**Date:** 2026-02-16
**Version:** 1.0
**Platform:** Vercel (Frontend), Supabase (Backend), Daily.co (Voice)

---

## Table of Contents

1. [Pre-Testing Checklist](#pre-testing-checklist)
2. [Section 1: Authentication](#section-1-authentication)
3. [Section 2: Privacy & Legal](#section-2-privacy--legal)
4. [Section 3: Core Messaging](#section-3-core-messaging)
5. [Section 4: Server Management](#section-4-server-management)
6. [Section 5: Voice Chat](#section-5-voice-chat)
7. [Section 6: Family Accounts](#section-6-family-accounts)
8. [Section 7: Settings](#section-7-settings)
9. [Section 8: Friends & DMs](#section-8-friends--dms)
10. [Section 9: Security Testing](#section-9-security-testing)
11. [Section 10: Performance](#section-10-performance)
12. [Section 11: Browser Compatibility](#section-11-browser-compatibility)
13. [Section 12: Accessibility](#section-12-accessibility)
14. [Final Pre-Launch Checklist](#final-pre-launch-checklist)

---

## Pre-Testing Checklist

Before beginning any test session, confirm the following:

- [ ] Latest code is deployed to the Vercel preview or production environment
- [ ] Supabase dashboard is accessible at https://supabase.com/dashboard
- [ ] Supabase project status shows "Active" (not paused)
- [ ] At least three test accounts have been created:
  - Standard user account (e.g., `testuser@bedrockchat.test`)
  - Parent account (e.g., `testparent@bedrockchat.test`)
  - Teen account linked to the parent (e.g., `testteen@bedrockchat.test`)
- [ ] Browser DevTools are ready (Console, Network, Application tabs)
- [ ] Browser cache and localStorage have been cleared for a fresh start
- [ ] A second browser or incognito window is available for multi-user tests
- [ ] Daily.co dashboard is accessible for voice channel diagnostics
- [ ] Screen recording or screenshot tool is available for documenting failures

---

## Section 1: Authentication

### Test 1.1: User Signup

**Purpose:** Verify that new users can create accounts with the correct account types (standard, parent, teen).

**Prerequisites:**
- Fresh browser session with no existing Bedrock Chat data in localStorage
- Access to a test email inbox (or Supabase Auth dashboard to confirm user creation)

**Steps:**
1. Navigate to the signup page (`/signup`).
2. Enter a valid email address, username, and password (minimum 8 characters).
3. Select account type: "Standard".
4. Click the "Sign Up" button.
5. Repeat steps 1-4 for "Parent" account type.
6. Repeat steps 1-4 for "Teen" account type. When selecting "Teen," an additional field for "Parent Email" should appear. Enter the parent account's email.

**Expected Results:**
- The signup form validates all fields before submission.
- Password requirements are displayed and enforced.
- For teen accounts, the parent email field is required and validated.
- After submission, the user is either redirected to a verification page or logged in (depending on email confirmation settings).
- The user record appears in Supabase Auth dashboard with the correct role metadata.

**Troubleshooting:**
- If signup fails silently, check the browser Console for error messages and the Network tab for failed API calls to Supabase.
- If the teen account does not show the parent email field, verify the signup form component is correctly reading the account type state.
- If the user is not created in Supabase, check that the Supabase project URL and anon key are correctly configured in environment variables.

---

### Test 1.2: Email Verification

**Purpose:** Confirm that the email verification flow works end-to-end.

**Prerequisites:**
- A newly signed-up account that has not yet been verified
- Access to the email inbox for that account (or Supabase dashboard to manually confirm)

**Steps:**
1. After signing up, check the email inbox for a verification email from Bedrock Chat.
2. Open the email and click the verification link.
3. Observe where the browser redirects after clicking.
4. Attempt to log in with the verified account.

**Expected Results:**
- A verification email arrives within 60 seconds of signup.
- The verification link redirects to the Bedrock Chat app (e.g., `/login` or `/channels`).
- The user's `email_confirmed_at` field in Supabase is populated.
- Login succeeds after verification.

**Troubleshooting:**
- If no email arrives, check the Supabase Auth settings to confirm email confirmations are enabled and the SMTP provider is configured.
- If the link redirects to the wrong URL, verify the "Site URL" and "Redirect URLs" in Supabase Auth settings.
- Check the spam/junk folder if the email is not in the primary inbox.

---

### Test 1.3: Login

**Purpose:** Verify login works with valid credentials and fails gracefully with invalid ones.

**Prerequisites:**
- A verified user account

**Steps:**
1. Navigate to `/login`.
2. Enter valid email and password. Click "Log In."
3. Observe the redirect and UI state.
4. Log out.
5. Navigate to `/login` again.
6. Enter a valid email but incorrect password. Click "Log In."
7. Enter a nonexistent email with any password. Click "Log In."

**Expected Results:**
- Valid credentials: User is redirected to `/channels` (or the main app). The user panel in the sidebar shows the logged-in username and avatar.
- Invalid password: An error message displays (e.g., "Invalid login credentials"). No redirect occurs.
- Nonexistent email: The same generic error message displays (to avoid user enumeration).
- The login button shows a loading state during the authentication request.

**Troubleshooting:**
- If login succeeds but the user is not redirected, check the auth store's login handler for the redirect logic.
- If no error message appears on failure, check that the login form catches and displays Supabase auth errors.
- If the page hangs, check for the auth timeout handling (see Test 1.7).

---

### Test 1.4: Remember Me

**Purpose:** Verify that the "Remember Me" option controls session persistence correctly.

**Prerequisites:**
- A verified user account

**Steps:**
1. Navigate to `/login`.
2. Check the "Remember Me" checkbox. Log in.
3. Open DevTools > Application > Local Storage. Confirm the auth token is stored in localStorage.
4. Close the browser completely. Reopen and navigate to the app. Confirm you are still logged in.
5. Log out.
6. Navigate to `/login`.
7. Uncheck the "Remember Me" checkbox. Log in.
8. Open DevTools > Application > Session Storage. Confirm the auth token is stored in sessionStorage (not localStorage).
9. Close the browser completely. Reopen and navigate to the app. Confirm you are redirected to the login page.

**Expected Results:**
- With "Remember Me" checked: Token persists in localStorage. Session survives browser close.
- With "Remember Me" unchecked: Token is in sessionStorage only. Session ends when the browser closes.

**Troubleshooting:**
- If the session persists even without "Remember Me," check that the auth store is correctly choosing between localStorage and sessionStorage based on the checkbox state.
- If the token is not found in either storage, verify the Supabase client configuration for session persistence.

---

### Test 1.5: Logout

**Purpose:** Confirm that logging out clears all authentication state.

**Prerequisites:**
- A logged-in user session

**Steps:**
1. While logged in, note the contents of localStorage and sessionStorage in DevTools.
2. Click the logout button in the user panel.
3. Observe the redirect.
4. Check localStorage and sessionStorage again.
5. Attempt to navigate directly to `/channels`.

**Expected Results:**
- After logout, the user is redirected to the landing page (`/`) or login page (`/login`).
- All Supabase auth tokens are removed from both localStorage and sessionStorage.
- The `bedrock-auth` key in localStorage is cleared or removed.
- Navigating to `/channels` directly redirects back to login (auth guard).

**Troubleshooting:**
- If tokens remain after logout, verify the logout handler calls `supabase.auth.signOut()` and also clears local stores.
- If the user can still access `/channels` after logout, check the auth guard in the main layout.

---

### Test 1.6: Auth State Persistence

**Purpose:** Verify that a logged-in user remains authenticated after a page refresh.

**Prerequisites:**
- A logged-in user with "Remember Me" enabled

**Steps:**
1. Log in with "Remember Me" checked.
2. Navigate to a specific channel (e.g., `/servers/server-1/channel-1`).
3. Press F5 or Cmd+R to refresh the page.
4. Observe the behavior during and after the refresh.

**Expected Results:**
- The page reloads and the user remains logged in.
- The app restores to the same channel view without redirecting to login.
- There is no visible flash of the login page before the app loads.
- The auth store rehydrates from localStorage correctly.

**Troubleshooting:**
- If the user is briefly shown the login page before redirecting back, this indicates the auth guard runs before the store rehydrates. Check the auth trust/timeout mechanism.
- If the user is fully logged out after refresh, verify that the Supabase session refresh is working and the token has not expired.

---

### Test 1.7: Auth Timeout Handling

**Purpose:** Verify that the app handles slow authentication gracefully with a 15-second timeout.

**Prerequisites:**
- A logged-in user account
- DevTools Network tab open with throttling capability

**Steps:**
1. Open DevTools > Network tab.
2. Enable "Slow 3G" throttling or block requests to the Supabase auth endpoint.
3. Refresh the page.
4. Observe the app behavior over the next 15 seconds.
5. After 15 seconds, note what the app displays.

**Expected Results:**
- The app shows a loading state while attempting to verify the auth session.
- If auth verification does not complete within 15 seconds, the app proceeds with the locally cached auth state (trusted auth).
- The user is not abruptly logged out or shown an error during slow network conditions.
- If no cached auth state exists and the timeout fires, the user is redirected to login.

**Troubleshooting:**
- If the app hangs indefinitely, verify the auth timeout is implemented in the auth store (look for a `setTimeout` or `Promise.race` pattern).
- If the app immediately redirects to login without waiting, check that the persisted auth trust is being read before the timeout fires.

---

## Section 2: Privacy & Legal

### Test 2.1: Privacy Policy Page

**Purpose:** Confirm the privacy policy is accessible to all visitors, including unauthenticated users.

**Prerequisites:**
- Logged-out state (clear all auth data)

**Steps:**
1. Open a fresh browser session (no cookies/localStorage).
2. Navigate directly to `/privacy-policy`.
3. Read through the page content.
4. Click the browser back button.

**Expected Results:**
- The page loads without requiring authentication.
- The privacy policy content is fully rendered and readable.
- No auth guard redirects the user to login.
- The page includes sections on data collection, data usage, data sharing, user rights, and contact information.
- Navigation back works correctly.

**Troubleshooting:**
- If the page redirects to login, verify that `/privacy-policy` is outside the `(main)` route group that has the auth guard.
- If the page is blank, check that the page component exists at the correct route path.

---

### Test 2.2: Terms of Service Page

**Purpose:** Confirm the terms of service are accessible to all visitors.

**Prerequisites:**
- Logged-out state

**Steps:**
1. Open a fresh browser session.
2. Navigate directly to `/terms-of-service`.
3. Scroll through the entire page.

**Expected Results:**
- The page loads without requiring authentication.
- The terms of service content is fully rendered.
- All sections are present and formatted correctly.

**Troubleshooting:**
- Same as Test 2.1. Verify the route is outside the auth-guarded layout.

---

### Test 2.3: Consent Banner

**Purpose:** Verify the consent banner appears on first visit and behaves correctly.

**Prerequisites:**
- Clear all cookies and localStorage for the site

**Steps:**
1. Clear all site data in DevTools > Application > Clear site data.
2. Navigate to the app landing page (`/`).
3. Observe the bottom of the screen for a consent banner.
4. Read the banner text.
5. Click "Accept" or "Customize" if available.
6. Refresh the page.

**Expected Results:**
- On first visit, a consent banner appears at the bottom (or top) of the page.
- The banner explains what data is collected and offers accept/decline/customize options.
- After accepting or declining, the banner does not appear on subsequent page loads.
- The consent choice is stored in localStorage (check for a consent-related key).

**Troubleshooting:**
- If the banner does not appear, check that localStorage has been fully cleared, including any consent-related keys.
- If the banner reappears after every refresh, verify that the consent state is being persisted to localStorage correctly.

---

### Test 2.4: Consent Preferences Save

**Purpose:** Verify that consent preferences are stored and respected.

**Prerequisites:**
- First visit or cleared localStorage

**Steps:**
1. When the consent banner appears, click "Customize" (or equivalent).
2. Toggle individual consent categories (e.g., analytics, marketing) off.
3. Save preferences.
4. Open DevTools > Application > localStorage. Find the consent key.
5. Refresh the page.
6. Navigate to privacy settings (if available) and verify the saved preferences are reflected.

**Expected Results:**
- Custom preferences are saved to localStorage as a JSON object.
- The preferences persist across page refreshes.
- If a privacy settings page exists, it shows the saved consent choices.
- Declining analytics consent means no analytics scripts load (verify in Network tab).

**Troubleshooting:**
- If preferences reset on refresh, check the consent store or localStorage key for serialization issues.
- If analytics still load after declining, check that the consent state is checked before initializing any tracking.

---

### Test 2.5: Data Export

**Purpose:** Verify that users can export their data as a JSON file.

**Prerequisites:**
- A logged-in user account with some activity (messages, settings)

**Steps:**
1. Log in and navigate to the data export page (`/data-export` or via Settings).
2. Click the "Export My Data" button.
3. Wait for the export to generate.
4. Observe the file download.
5. Open the downloaded JSON file and inspect its contents.

**Expected Results:**
- A JSON file downloads to the user's device.
- The file contains the user's profile information, messages, settings, and any other stored data.
- No other users' data is included in the export.
- The file is well-formatted and readable.
- The export completes within a reasonable time (under 30 seconds for typical accounts).

**Troubleshooting:**
- If the download does not start, check the Network tab for failed API calls and the Console for errors.
- If the file is empty or contains minimal data, verify the data export API endpoint queries all relevant tables.
- If the file contains other users' data, this is a critical RLS (Row Level Security) failure -- escalate immediately.

---

### Test 2.6: CCPA Settings Page

**Purpose:** Verify the CCPA privacy settings page is accessible and functional.

**Prerequisites:**
- A logged-in user account

**Steps:**
1. Log in and navigate to `/privacy-settings` (or via Settings > Privacy).
2. Review the available privacy controls.
3. Toggle the "Do Not Sell My Personal Information" option (if present).
4. Save changes.
5. Refresh the page and verify the setting persisted.

**Expected Results:**
- The privacy settings page loads with clear options for data control.
- CCPA-related options (opt out of data sale, data deletion request) are present.
- Changes save successfully and persist across page refreshes.
- A confirmation message or toast appears after saving.

**Troubleshooting:**
- If the page does not load, verify the route exists and is within the auth-guarded layout.
- If settings do not persist, check that they are being saved to the database (not just local state).

---

### Test 2.7: No Analytics in Network Tab

**Purpose:** Confirm that no third-party analytics or tracking scripts are loaded.

**Prerequisites:**
- A fresh browser session

**Steps:**
1. Open DevTools > Network tab.
2. Clear the network log.
3. Navigate through multiple pages of the app (landing, login, main app, settings).
4. Filter the Network tab by "JS" and "XHR/Fetch."
5. Search for known analytics domains: `google-analytics.com`, `googletagmanager.com`, `facebook.net`, `segment.io`, `mixpanel.com`, `hotjar.com`, `amplitude.com`.

**Expected Results:**
- No requests are made to any third-party analytics or tracking domains.
- The only external requests should be to Supabase, Daily.co (for voice), and Vercel (for deployment assets).
- No tracking pixels or beacons are loaded.

**Troubleshooting:**
- If analytics requests are found, trace the source by checking the "Initiator" column in the Network tab to find which script is making the call.
- Check `_app.tsx`, `layout.tsx`, and `<head>` sections for injected tracking scripts.

---

### Test 2.8: GPC/DNT Headers Respected

**Purpose:** Verify the app respects Global Privacy Control (GPC) and Do Not Track (DNT) browser signals.

**Prerequisites:**
- A browser with GPC or DNT enabled (Firefox has built-in DNT support; GPC can be enabled via extensions)

**Steps:**
1. Enable GPC and/or DNT in your browser settings or via a browser extension.
2. Navigate to the app.
3. Open DevTools > Console.
4. Check if the app reads `navigator.globalPrivacyControl` or the `DNT` header.
5. Verify that consent defaults reflect the GPC/DNT signal (e.g., analytics disabled by default).

**Expected Results:**
- When GPC is enabled (`navigator.globalPrivacyControl === true`), the app treats it as an opt-out of data sharing.
- The consent banner, if shown, defaults to "declined" for non-essential data processing when GPC/DNT is active.
- No analytics or non-essential tracking activates when GPC/DNT is detected.

**Troubleshooting:**
- If GPC is not detected, check that the app reads `navigator.globalPrivacyControl` on page load.
- If DNT is not respected, verify that the server checks the `DNT` request header.

---

## Section 3: Core Messaging

### Test 3.1: Send a Message

**Purpose:** Verify that users can send text messages to a channel.

**Prerequisites:**
- Logged-in user with access to at least one text channel

**Steps:**
1. Navigate to a text channel (e.g., `#general` in Bedrock Community).
2. Click on the message input field at the bottom.
3. Type "Hello, this is a test message."
4. Press Enter or click the send button.
5. Observe the message list.

**Expected Results:**
- The message appears in the channel immediately (optimistic update).
- The message displays the correct username, avatar, and timestamp.
- The message input field is cleared after sending.
- The message list scrolls to the bottom to show the new message.
- The message persists after a page refresh (stored in Supabase).

**Troubleshooting:**
- If the message does not appear, check the Console for errors related to the Supabase insert operation.
- If the message appears but disappears on refresh, verify that the Supabase insert is succeeding (check the `messages` table in Supabase dashboard).
- If the input does not clear, check the message input component's submit handler for state reset.

---

### Test 3.2: Receive a Message (Real-time)

**Purpose:** Verify real-time message delivery via Supabase postgres_changes.

**Prerequisites:**
- Two browser windows open, both logged in as different users, both viewing the same channel

**Steps:**
1. In Window A, navigate to `#general`.
2. In Window B, navigate to `#general`.
3. In Window A, send a message: "Real-time test from User A."
4. Observe Window B.

**Expected Results:**
- The message from User A appears in Window B within 1-2 seconds without manual refresh.
- The message has the correct sender information.
- The message list in Window B scrolls to show the new message (if already at the bottom).

**Troubleshooting:**
- If the message does not appear in real-time, verify the Supabase Realtime subscription is active. Check the Console for WebSocket connection errors.
- Verify that the Supabase project has Realtime enabled for the `messages` table (Supabase dashboard > Database > Replication).
- If messages appear only after refresh, the subscription listener is not updating the local message store correctly.

---

### Test 3.3: Edit a Message

**Purpose:** Verify that users can edit their own messages.

**Prerequisites:**
- A logged-in user with at least one sent message in a channel

**Steps:**
1. Hover over a message you sent. Look for an edit button or icon.
2. Click the edit button (or right-click for a context menu).
3. The message text should become editable.
4. Change the text to "This message has been edited."
5. Press Enter or click Save.
6. Observe the updated message.

**Expected Results:**
- Only messages sent by the current user show the edit option.
- The message enters an editable state with the original text pre-filled.
- After saving, the message displays the updated text.
- An "(edited)" indicator appears next to the timestamp.
- The edit persists after a page refresh.

**Troubleshooting:**
- If the edit button does not appear, verify the component checks `message.userId === currentUser.id`.
- If the edit does not save, check for Supabase RLS policies on the `messages` table that allow UPDATE only for the message author.

---

### Test 3.4: Delete a Message

**Purpose:** Verify that users can delete their own messages.

**Prerequisites:**
- A logged-in user with at least one sent message in a channel

**Steps:**
1. Hover over a message you sent. Look for a delete button or trash icon.
2. Click the delete button.
3. If a confirmation dialog appears, confirm the deletion.
4. Observe the message list.

**Expected Results:**
- Only messages sent by the current user show the delete option (unless the user is a server admin/moderator).
- A confirmation prompt appears before deletion.
- After confirming, the message is removed from the list immediately (optimistic update).
- The deletion persists after a page refresh.
- Other users viewing the same channel see the message removed in real-time.

**Troubleshooting:**
- If the message is not removed for other users, check the Supabase Realtime subscription for DELETE events.
- If the delete fails silently, check RLS policies on the `messages` table.

---

### Test 3.5: Add/Remove Reactions

**Purpose:** Verify the reaction system works correctly.

**Prerequisites:**
- A channel with at least one message visible

**Steps:**
1. Hover over a message. Look for a reaction button (smiley face icon).
2. Click it to open the emoji/reaction picker.
3. Select an emoji (e.g., thumbs up).
4. Observe the reaction appear on the message.
5. Click the same reaction again to remove it.
6. In a second browser window (different user), add a reaction to the same message.
7. Observe the reaction count update in both windows.

**Expected Results:**
- Clicking a reaction adds it with a count of 1.
- The current user's reaction is highlighted or distinguished.
- Clicking the same reaction again removes it.
- Reactions from multiple users show aggregated counts (e.g., "thumbs up x 2").
- Reactions update in real-time across clients.

**Troubleshooting:**
- If reactions do not persist, check the `reactions` table in Supabase and its RLS policies.
- If reactions do not update in real-time, verify the Realtime subscription includes the `reactions` table.
- If clicking a reaction causes an infinite re-render, check for Zustand selector patterns (see Bug Fix #3 in CLAUDE.md).

---

### Test 3.6: Emoji Picker

**Purpose:** Verify the emoji picker component works correctly.

**Prerequisites:**
- Logged-in user viewing a text channel

**Steps:**
1. Click on the message input field.
2. Look for an emoji button (smiley face icon) near the input.
3. Click it to open the emoji picker.
4. Browse emoji categories (Smileys, Animals, Food, etc.).
5. Search for a specific emoji by typing in the picker's search field (e.g., "fire").
6. Click an emoji.
7. Observe the message input.

**Expected Results:**
- The emoji picker opens as a popover or modal.
- Emoji categories are browsable and scrollable.
- Search filters emojis in real-time as you type.
- Clicking an emoji inserts it into the message input at the cursor position.
- The picker closes after selecting an emoji (or stays open for multiple selections, depending on design).
- The emoji renders correctly in the message after sending.

**Troubleshooting:**
- If the picker does not open, check the component's toggle state and ensure no z-index issues are hiding it.
- If emojis do not insert into the input, verify the input component exposes a method or ref for inserting text at the cursor.

---

### Test 3.7: Typing Indicator

**Purpose:** Verify the typing indicator shows when other users are typing.

**Prerequisites:**
- Two browser windows open, both logged in as different users, both in the same channel

**Steps:**
1. In Window A, navigate to `#general`.
2. In Window B, navigate to `#general`.
3. In Window A, begin typing in the message input (do not send).
4. Observe the area below the message list in Window B.
5. Stop typing in Window A and wait 3 seconds.
6. Observe Window B again.

**Expected Results:**
- When User A starts typing, Window B shows a typing indicator (e.g., "User A is typing..." with an animated dots indicator).
- The typing indicator appears within 1 second of the first keystroke.
- After User A stops typing for approximately 2 seconds (debounce interval), the typing indicator disappears.
- Multiple users typing simultaneously shows all their names (e.g., "User A and User B are typing...").

**Troubleshooting:**
- If the indicator does not appear, verify the Supabase Presence broadcast is configured for typing events.
- If the indicator never disappears, check the debounce/timeout logic (should be ~2 seconds).
- If typing causes performance issues, check for infinite re-render loops in the message input component (see Bug Fix #3 in CLAUDE.md).

---

### Test 3.8: Virtual Scrolling with Many Messages

**Purpose:** Verify the message list performs well with a large number of messages.

**Prerequisites:**
- A channel with 500+ messages (seed via Supabase SQL or a script)

**Steps:**
1. Navigate to the channel with many messages.
2. Observe the initial load time.
3. Scroll up quickly through the messages.
4. Scroll back down to the bottom.
5. Open DevTools > Performance tab and record while scrolling.
6. Check the DOM element count in DevTools > Elements.

**Expected Results:**
- The channel loads within 2-3 seconds despite having 500+ messages.
- Scrolling is smooth at 60fps (check Performance recording for frame drops).
- The DOM contains only a subset of message elements at any time (virtual scrolling).
- Memory usage remains stable during scrolling (no memory leaks).
- Older messages load dynamically as the user scrolls up (infinite scroll).

**Troubleshooting:**
- If all messages render in the DOM at once, verify TanStack Virtual (or equivalent virtual scroller) is implemented.
- If scrolling is janky, check for non-GPU-accelerated CSS animations on message elements.
- If memory grows continuously, look for event listeners not being cleaned up on unmount.

---

### Test 3.9: Auto-scroll to Bottom on New Message

**Purpose:** Verify the message list auto-scrolls when a new message arrives (and the user is already at the bottom).

**Prerequisites:**
- Two browser windows, same channel

**Steps:**
1. In Window A, scroll to the bottom of the message list in `#general`.
2. In Window B, send a message.
3. Observe Window A -- it should auto-scroll to show the new message.
4. In Window A, scroll up by at least 200px (away from the bottom).
5. In Window B, send another message.
6. Observe Window A -- it should NOT auto-scroll. Instead, a "scroll to bottom" button should appear.
7. Click the "scroll to bottom" button.

**Expected Results:**
- When the user is at the bottom of the list, new messages automatically scroll into view.
- When the user has scrolled up (viewing older messages), new messages do NOT cause auto-scroll.
- A "scroll to bottom" button or indicator appears when new messages arrive while scrolled up.
- Clicking the button smoothly scrolls to the latest message.

**Troubleshooting:**
- If auto-scroll does not work, check the scroll-to-bottom component's distance threshold (should be ~200px from bottom).
- If the "scroll to bottom" button causes an infinite loop, see Bug Fix #3 in CLAUDE.md regarding DOM nodes in useEffect dependencies.

---

## Section 4: Server Management

### Test 4.1: Create a Server

**Purpose:** Verify users can create new servers.

**Prerequisites:**
- Logged-in user account

**Steps:**
1. In the server list sidebar, look for a "+" button or "Add Server" option.
2. Click it.
3. A creation dialog/modal should appear.
4. Enter a server name (e.g., "My Test Server").
5. Optionally add a description and select/upload an icon.
6. Click "Create."

**Expected Results:**
- The server creation modal opens with fields for name, description, and icon.
- After creation, the new server appears in the server list sidebar.
- The user is automatically navigated to the new server.
- A default "General" text channel is created within the server.
- The user is set as the server owner.

**Troubleshooting:**
- If the server does not appear in the sidebar, check that the server store is updated after creation.
- If the server is created in the database but not shown, verify the Zustand store re-fetches or subscribes to server list changes.

---

### Test 4.2: Create Channels (Text/Voice)

**Purpose:** Verify server owners/admins can create text and voice channels.

**Prerequisites:**
- A server where the logged-in user is the owner or has admin permissions

**Steps:**
1. Navigate to the server.
2. Look for a "+" icon next to a category header or a "Create Channel" option in server settings.
3. Click it.
4. Enter a channel name (e.g., "new-text-channel").
5. Select channel type: "Text."
6. Click "Create."
7. Repeat steps 2-6, but select "Voice" as the channel type.

**Expected Results:**
- Text channels appear in the channel list with a `#` prefix.
- Voice channels appear with a speaker/audio icon.
- The new channels are accessible and functional.
- Channel names are auto-formatted (lowercase, hyphens for spaces).

**Troubleshooting:**
- If channels do not appear, check the channel list component re-renders when the channel store updates.
- If creation fails, verify RLS policies allow the server owner to insert into the `channels` table.

---

### Test 4.3: Create Categories

**Purpose:** Verify that channel categories can be created and channels organized within them.

**Prerequisites:**
- A server where the logged-in user is the owner

**Steps:**
1. Navigate to the server's channel list.
2. Look for a "Create Category" option (may be in server settings or a context menu).
3. Create a category named "CUSTOM CATEGORY."
4. Drag or assign a channel to this category.

**Expected Results:**
- The new category appears in the channel list as a collapsible header.
- Channels can be organized under the category.
- The category name is displayed in uppercase (following Discord convention).
- The category can be collapsed/expanded by clicking the arrow.

**Troubleshooting:**
- If the category does not appear, verify it was inserted into the `categories` table and the channel list component reads from it.

---

### Test 4.4: Reorder Channels/Categories

**Purpose:** Verify drag-and-drop or manual reordering of channels and categories.

**Prerequisites:**
- A server with multiple categories and channels

**Steps:**
1. Attempt to drag a channel from one position to another within the same category.
2. Attempt to drag a channel from one category to another.
3. Attempt to reorder categories themselves.
4. Refresh the page and verify the order persists.

**Expected Results:**
- Channels can be reordered within a category via drag-and-drop.
- Channels can be moved between categories.
- Categories can be reordered.
- The new order persists after a page refresh (stored in the database via `position` fields).

**Troubleshooting:**
- If reordering does not persist, verify that position updates are saved to Supabase.
- If drag-and-drop is not implemented, check if a manual "Move Up/Down" option exists in channel settings.

---

### Test 4.5: Server Settings

**Purpose:** Verify server settings can be modified by the server owner.

**Prerequisites:**
- A server where the logged-in user is the owner

**Steps:**
1. Navigate to the server.
2. Click on the server name or a settings gear icon to open server settings.
3. Change the server name.
4. Change the server description.
5. Upload or change the server icon.
6. Save changes.
7. Verify the changes are reflected in the server list and channel list header.

**Expected Results:**
- The settings page/modal shows current server information.
- Changes save successfully with a confirmation toast/message.
- The server name updates in the sidebar and channel list header.
- The server icon updates in the server list sidebar.
- Changes persist after a page refresh.

**Troubleshooting:**
- If changes do not save, check the Network tab for failed API calls and verify RLS policies.
- If the icon upload fails, verify the Supabase Storage bucket exists and has the correct permissions.

---

### Test 4.6: Create Invite Link

**Purpose:** Verify that server owners can generate invite links.

**Prerequisites:**
- A server where the logged-in user is the owner

**Steps:**
1. Navigate to server settings or look for an "Invite People" button.
2. Click to generate an invite link.
3. Copy the link.
4. Verify the link format (e.g., `https://bedrockchat.com/invite/abc123`).

**Expected Results:**
- A unique invite link is generated.
- The link can be copied to the clipboard.
- Optional: expiration time and max uses can be configured.
- The invite is stored in the `invites` table in Supabase.

**Troubleshooting:**
- If the link is not generated, check the invite creation API endpoint and database table.

---

### Test 4.7: Join Server via Invite

**Purpose:** Verify that users can join a server using an invite link.

**Prerequisites:**
- An invite link from Test 4.6
- A second user account that is not already a member of the server

**Steps:**
1. Log in as the second user.
2. Navigate to the invite link in the browser.
3. Observe the invite page (should show server name and a "Join" button).
4. Click "Join."
5. Verify the server appears in the second user's server list.

**Expected Results:**
- The invite page shows the server name, icon, and member count.
- After joining, the server appears in the user's server list sidebar.
- The user is navigated to the server's default channel.
- The server's member count increases by 1.

**Troubleshooting:**
- If the invite page shows an error, verify the invite code is valid and not expired.
- If joining fails, check RLS policies on the `server_members` table.

---

### Test 4.8: Leave Server

**Purpose:** Verify that members can leave a server.

**Prerequisites:**
- A user who is a member of a server (but not the owner)

**Steps:**
1. Right-click the server icon in the sidebar, or open server settings.
2. Click "Leave Server."
3. Confirm the action in the dialog.
4. Observe the server list.

**Expected Results:**
- A confirmation dialog appears before leaving.
- After leaving, the server is removed from the user's server list.
- The user is navigated to another server or the home screen.
- The server's member count decreases by 1.
- The server owner cannot leave their own server (option should be hidden or disabled).

**Troubleshooting:**
- If the server still appears after leaving, verify the server list re-fetches after the leave operation.

---

### Test 4.9: Ban/Unban User

**Purpose:** Verify server admins can ban and unban users.

**Prerequisites:**
- A server where the logged-in user is the owner/admin
- A second user who is a member of the server

**Steps:**
1. Open the server's member list.
2. Find the target user.
3. Click on their name or a context menu.
4. Select "Ban User."
5. Optionally enter a reason.
6. Confirm the ban.
7. Verify the banned user can no longer access the server.
8. Navigate to the server's ban list.
9. Find the banned user and click "Unban."
10. Verify the user can rejoin the server.

**Expected Results:**
- Banning removes the user from the server immediately.
- The banned user cannot rejoin via invite links.
- The ban reason is recorded and visible in the ban list.
- Unbanning allows the user to rejoin (they must be re-invited).
- Only admins/owners see the ban option.

**Troubleshooting:**
- If the ban does not take effect, check the `bans` table and RLS policies.
- If the banned user can still see server content, verify the auth guard checks the ban list.

---

### Test 4.10: Delete Server

**Purpose:** Verify that server owners can delete their servers.

**Prerequisites:**
- A server where the logged-in user is the owner

**Steps:**
1. Open server settings.
2. Navigate to a "Danger Zone" or "Delete Server" section.
3. Click "Delete Server."
4. A confirmation dialog should appear, possibly requiring the server name to be typed.
5. Confirm the deletion.
6. Observe the server list.

**Expected Results:**
- A multi-step confirmation prevents accidental deletion.
- After deletion, the server is removed from all members' server lists.
- All channels, messages, and data associated with the server are deleted.
- The user is navigated to another server or the home screen.
- The deletion cascades through related tables in Supabase.

**Troubleshooting:**
- If the server persists, check that the delete operation cascades correctly (foreign key constraints with `ON DELETE CASCADE`).
- If other members still see the server, verify the Realtime subscription updates the server list.

---

## Section 5: Voice Chat

### Test 5.1: Join Voice Channel

**Purpose:** Verify users can join a voice channel using Daily.co integration.

**Prerequisites:**
- A server with a voice channel
- Microphone permissions available in the browser

**Steps:**
1. Navigate to a server with a voice channel.
2. Click on the voice channel name in the channel list.
3. If prompted, grant microphone permission.
4. Observe the voice channel UI.

**Expected Results:**
- Clicking a voice channel initiates a connection to the Daily.co room.
- A voice panel or overlay appears showing the connected state.
- The user's avatar/name appears in the voice channel's user list.
- Other users in the channel see the new participant join.
- A "Connected to Voice" indicator appears in the user panel at the bottom of the sidebar.

**Troubleshooting:**
- If the connection fails, check the Console for Daily.co SDK errors.
- Verify the Daily.co API key is configured in environment variables.
- If microphone permission is denied, the browser will show a blocked permission icon -- click it to allow.

---

### Test 5.2: Audio Working

**Purpose:** Confirm that audio transmission works between participants.

**Prerequisites:**
- Two users connected to the same voice channel
- Both have working microphones

**Steps:**
1. User A and User B both join the same voice channel.
2. User A speaks into their microphone.
3. User B listens for audio output.
4. User B speaks, and User A listens.

**Expected Results:**
- Audio is transmitted clearly between participants with minimal latency (<200ms).
- Voice activity indicators show which user is currently speaking.
- Audio quality is acceptable (no major distortion or echo).

**Troubleshooting:**
- If no audio is heard, verify the correct input/output devices are selected in voice settings.
- Check that the Daily.co room is configured to allow audio tracks.
- Test the microphone independently using the browser's built-in audio test or a site like `webcammictest.com`.

---

### Test 5.3: Mute/Unmute

**Purpose:** Verify mute/unmute functionality in voice channels.

**Prerequisites:**
- Connected to a voice channel

**Steps:**
1. While in a voice channel, locate the mute button (microphone icon).
2. Click to mute.
3. Speak into the microphone.
4. Observe that other participants cannot hear you.
5. Click the mute button again to unmute.
6. Speak and confirm others can hear you again.

**Expected Results:**
- The mute button toggles between muted and unmuted states with a clear visual indicator (e.g., red slash through the microphone icon).
- When muted, no audio is transmitted to other participants.
- The mute state is reflected in the voice channel's user list (muted icon next to the user's name).
- Keyboard shortcut for mute/unmute works if implemented.

**Troubleshooting:**
- If audio still transmits while muted, check that the Daily.co `setLocalAudio(false)` call is being made.
- If the mute state is not visible to others, verify the participant state is synced via Daily.co events.

---

### Test 5.4: Screen Sharing

**Purpose:** Verify screen sharing functionality in voice channels.

**Prerequisites:**
- Connected to a voice channel with at least one other participant

**Steps:**
1. While in a voice channel, locate the screen share button.
2. Click it.
3. Select which screen or application window to share from the browser dialog.
4. Confirm the share.
5. Observe the other participant's view -- they should see the shared screen.
6. Click the screen share button again to stop sharing.

**Expected Results:**
- The browser's native screen-sharing dialog appears when the button is clicked.
- The shared screen is visible to all participants in the voice channel.
- A visual indicator shows that screen sharing is active.
- Stopping the share removes the screen view for all participants.
- Only one user can share their screen at a time (or multiple, depending on Daily.co configuration).

**Troubleshooting:**
- If screen sharing is not available, verify Daily.co screen share is enabled in the room configuration.
- On macOS, Screen Recording permission must be granted in System Settings.
- If the shared screen appears as a black rectangle, this is often a hardware acceleration issue -- try disabling GPU acceleration in browser settings.

---

### Test 5.5: Leave Voice Channel

**Purpose:** Verify that users can cleanly disconnect from a voice channel.

**Prerequisites:**
- Connected to a voice channel

**Steps:**
1. While connected to a voice channel, locate the disconnect/leave button (phone with an X, or similar).
2. Click it.
3. Observe the UI state.

**Expected Results:**
- The user is disconnected from the Daily.co room.
- The voice panel or overlay closes.
- The user's avatar is removed from the voice channel's participant list.
- Other participants see the user leave.
- The "Connected to Voice" indicator in the user panel disappears.

**Troubleshooting:**
- If the user's avatar persists in the channel after leaving, check that the `daily.leave()` method is called and the participant list updates.
- If the voice UI does not close, verify the component unmounts or resets state on disconnect.

---

### Test 5.6: Reconnection on Disconnect

**Purpose:** Verify the app handles network interruptions gracefully during voice.

**Prerequisites:**
- Connected to a voice channel

**Steps:**
1. While in a voice channel, open DevTools > Network tab.
2. Toggle the browser to "Offline" mode for 5 seconds.
3. Toggle back to "Online."
4. Observe the voice connection state.

**Expected Results:**
- During the network interruption, a "Reconnecting..." indicator appears.
- After the network is restored, the voice connection re-establishes automatically.
- Audio resumes without requiring the user to manually rejoin.
- If reconnection fails after a timeout (e.g., 30 seconds), the user is disconnected with a notification.

**Troubleshooting:**
- If reconnection does not happen, check that Daily.co's automatic reconnection is enabled.
- If audio does not resume, the user may need to rejoin manually -- this should be indicated in the UI.

---

### Test 5.7: Noise Cancellation Toggle

**Purpose:** Verify the noise cancellation feature can be toggled on and off.

**Prerequisites:**
- Connected to a voice channel

**Steps:**
1. Navigate to voice settings (either in the voice panel or app settings).
2. Locate the "Noise Cancellation" toggle.
3. Enable it.
4. Speak while there is background noise (or play noise from another source).
5. Ask another participant if the background noise is reduced.
6. Disable noise cancellation.
7. Ask again if background noise is now audible.

**Expected Results:**
- The toggle saves the preference.
- When enabled, background noise is noticeably reduced for other participants.
- When disabled, all audio (including background noise) is transmitted.
- The setting persists across voice sessions.

**Troubleshooting:**
- If noise cancellation has no effect, verify Daily.co's noise cancellation processor is enabled (`daily.updateInputSettings({ audio: { processor: { type: 'noise-cancellation' } } })`).
- Check if the Daily.co plan supports noise cancellation (may be a paid feature).

---

### Test 5.8: Verify NO Audio Recording

**Purpose:** Confirm that the platform does not record or store any voice data, as per the privacy-first commitment.

**Prerequisites:**
- Completed a voice session with at least two participants

**Steps:**
1. Complete a voice chat session (join, talk, leave).
2. Open the Supabase dashboard.
3. Check all tables for any audio-related data (e.g., `recordings`, `audio_logs`, `voice_data`).
4. Check the Daily.co dashboard for recording settings.
5. Verify in Daily.co that recording is disabled for all rooms.

**Expected Results:**
- No tables in Supabase contain audio data or recording references.
- The Daily.co room configuration has `enable_recording: false`.
- No audio files are stored in Supabase Storage or any external storage.
- The Daily.co dashboard shows no recordings for any room.

**Troubleshooting:**
- If recordings are found in Daily.co, immediately disable recording in the room configuration and delete any stored recordings.
- This is a critical privacy violation if recordings exist -- escalate to the development team immediately.

---

## Section 6: Family Accounts

### Test 6.1: Create Parent Account

**Purpose:** Verify that users can create parent accounts with parental monitoring capabilities.

**Prerequisites:**
- Fresh browser session

**Steps:**
1. Navigate to `/signup`.
2. Select "Parent" as the account type.
3. Fill in all required fields (email, username, password).
4. Complete the signup process.
5. Verify the account in Supabase has the `role: 'parent'` metadata.

**Expected Results:**
- The signup flow includes a "Parent" account type option.
- After signup, the user's profile metadata includes `role: 'parent'`.
- The parent account has access to a parent dashboard (see Test 6.3).
- The parent can invite/link teen accounts.

**Troubleshooting:**
- If the role is not set, check the signup handler for user metadata insertion.
- Verify the `profiles` table has a `role` column.

---

### Test 6.2: Create Teen Account

**Purpose:** Verify teen account creation with mandatory parent linkage.

**Prerequisites:**
- An existing parent account

**Steps:**
1. Navigate to `/signup`.
2. Select "Teen" as the account type.
3. Fill in required fields.
4. Enter the parent's email address in the "Parent Email" field.
5. Complete the signup.
6. Check Supabase for the parent-teen relationship.

**Expected Results:**
- The teen account type requires a valid parent email.
- If the parent email does not match an existing parent account, an error is shown.
- After creation, a parent-teen relationship is established in the database.
- The teen account has `role: 'teen'` in their profile metadata.
- The parent receives a notification or can see the teen in their dashboard.

**Troubleshooting:**
- If the parent link fails, check the `family_relationships` table (or equivalent) in Supabase.
- If the parent email validation fails for a valid parent, check the lookup query.

---

### Test 6.3: Parent Dashboard

**Purpose:** Verify the parent dashboard loads with monitoring controls.

**Prerequisites:**
- Logged in as a parent account with at least one linked teen

**Steps:**
1. Log in as the parent.
2. Navigate to the parent dashboard (may be accessible from settings or a dedicated route).
3. Review the dashboard content.

**Expected Results:**
- The dashboard shows a list of linked teen accounts.
- Each teen entry shows their username, online status, and monitoring level.
- Activity summaries are available (e.g., servers joined, message counts).
- Quick action buttons allow changing monitoring settings.
- The dashboard loads within 3 seconds.

**Troubleshooting:**
- If the dashboard is blank, verify the parent-teen relationship exists in the database.
- If data does not load, check the API queries and RLS policies for parent access to teen data.

---

### Test 6.4: Change Monitoring Level

**Purpose:** Verify parents can adjust the monitoring level for their teen's account.

**Prerequisites:**
- Logged in as a parent with a linked teen

**Steps:**
1. Open the parent dashboard.
2. Select a teen account.
3. Find the monitoring level control (e.g., "Low," "Medium," "High").
4. Change the monitoring level from the current setting.
5. Save the change.
6. Verify the new level is reflected in the database.

**Expected Results:**
- Monitoring levels are clearly described (what each level includes).
- Changing the level saves successfully with a confirmation message.
- The change is logged in the transparency log (Test 6.5).
- The teen is notified of the monitoring level change.
- The new level takes effect immediately.

**Troubleshooting:**
- If the change does not save, check the RLS policies for the parent updating the teen's monitoring settings.

---

### Test 6.5: Transparency Log

**Purpose:** Verify that all parental monitoring actions are logged and visible to the teen.

**Prerequisites:**
- A parent who has performed monitoring actions (changed settings, viewed activity)
- Access to both the parent and teen accounts

**Steps:**
1. As the parent, perform several monitoring actions (change monitoring level, view activity).
2. As the teen, navigate to settings or a transparency/audit section.
3. Review the transparency log.

**Expected Results:**
- Every parental action is logged with a timestamp and description.
- The log is visible to the teen (cannot be hidden by the parent).
- Actions include: monitoring level changes, activity views, keyword alert additions.
- The log is read-only (cannot be edited or deleted by the parent).

**Troubleshooting:**
- If the log is empty, verify that monitoring actions trigger inserts into the transparency log table.
- If the teen cannot see the log, check the route and component for the transparency view.

---

### Test 6.6: Teen Monitoring Badge

**Purpose:** Verify that teens see a clear indicator that their account is being monitored.

**Prerequisites:**
- Logged in as a teen with an active parent monitor

**Steps:**
1. Log in as the teen account.
2. Look for a monitoring badge or icon in the UI (e.g., in the user panel, header, or settings).
3. Click on the badge for more details.

**Expected Results:**
- A visible, non-dismissable badge or indicator shows that the account is monitored.
- Clicking the badge shows who is monitoring (parent's username) and at what level.
- The badge is always visible somewhere in the app UI.
- The badge updates if the monitoring level changes.

**Troubleshooting:**
- If no badge appears, check the teen's profile for the `monitoring_level` field and the component that renders the badge.

---

### Test 6.7: Keyword Alerts

**Purpose:** Verify that parents receive alerts when configured keywords are detected in their teen's messages.

**Prerequisites:**
- A parent account with keyword alerts configured
- A teen account linked to the parent

**Steps:**
1. As the parent, navigate to monitoring settings.
2. Add keyword alerts (e.g., "drugs", "alcohol", "bully").
3. Save the keywords.
4. As the teen, send a message containing one of the keywords in a channel.
5. As the parent, check for an alert or notification.

**Expected Results:**
- Parents can add, edit, and remove keywords for monitoring.
- When the teen sends a message containing a keyword, an alert is generated.
- The alert includes the keyword matched, the channel, and a timestamp.
- The alert does NOT include the full message content (privacy balance).
- The keyword addition is logged in the transparency log.

**Troubleshooting:**
- If alerts do not fire, check the message processing pipeline for keyword matching logic.
- Verify the keyword matching is case-insensitive and handles partial matches appropriately.

---

### Test 6.8: Data Export for Parents

**Purpose:** Verify parents can export monitoring data and their teen's activity summary.

**Prerequisites:**
- A parent account with monitoring data

**Steps:**
1. As the parent, navigate to the data export section.
2. Select to export monitoring data or teen activity summary.
3. Click "Export."
4. Open the downloaded file.

**Expected Results:**
- The export includes monitoring configuration, alert history, and activity summaries.
- The export is in JSON format.
- No other family's data is included.
- Teen message content is NOT included (only metadata like counts and timestamps).

**Troubleshooting:**
- If the export is empty, verify the data export endpoint queries the correct parent-teen relationship tables.

---

## Section 7: Settings

### Test 7.1: Profile Settings

**Purpose:** Verify users can update their profile information.

**Prerequisites:**
- Logged-in user account

**Steps:**
1. Open the settings modal or page (click gear icon or navigate to settings).
2. Navigate to the "Profile" tab or section.
3. Change the username.
4. Change the bio/about me text.
5. Upload or change the avatar image.
6. Save changes.
7. Refresh the page and verify changes persisted.

**Expected Results:**
- All profile fields are editable.
- Username changes are validated (length, allowed characters, uniqueness).
- Bio text supports a reasonable character limit (e.g., 200 characters).
- Avatar upload accepts standard image formats (PNG, JPG, GIF).
- Changes are saved to Supabase and reflected immediately in the UI.
- The user panel in the sidebar updates with the new information.

**Troubleshooting:**
- If avatar upload fails, check the Supabase Storage bucket and CORS configuration.
- If username changes fail, check for unique constraint violations in the `profiles` table.

---

### Test 7.2: Theme Toggle

**Purpose:** Verify the dark/light theme toggle works correctly.

**Prerequisites:**
- Logged-in user

**Steps:**
1. Open settings.
2. Navigate to the "Appearance" section.
3. Toggle between dark and light themes.
4. Observe the entire app UI change.
5. Refresh the page and verify the theme persists.

**Expected Results:**
- The theme toggles instantly without a full page reload.
- All components respect the theme (backgrounds, text colors, borders, shadows).
- The glass morphism effects adapt correctly to both themes.
- The theme preference is stored in localStorage (`bedrock-ui` store).
- The theme persists across page refreshes and sessions.

**Troubleshooting:**
- If some components do not change, check for hardcoded color values instead of theme variables.
- If the theme resets on refresh, verify the UI store is persisted to localStorage.

---

### Test 7.3: Notification Settings

**Purpose:** Verify users can configure their notification preferences.

**Prerequisites:**
- Logged-in user

**Steps:**
1. Open settings.
2. Navigate to the "Notifications" section.
3. Toggle notification categories (e.g., message notifications, mention notifications, friend requests).
4. Adjust notification sound preferences.
5. Save changes.
6. Trigger a notification scenario (e.g., receive a message) and verify the setting is respected.

**Expected Results:**
- Notification categories can be individually toggled on/off.
- Sound preferences can be adjusted or muted.
- Settings are saved and persist across sessions.
- Disabled notifications do not trigger any visual or audio alerts.
- Enabled notifications work as expected.

**Troubleshooting:**
- If notifications still appear when disabled, check the notification handler for the settings check.
- If browser notifications are not working, verify the user has granted notification permissions.

---

### Test 7.4: Privacy Settings

**Purpose:** Verify users can control their privacy preferences.

**Prerequisites:**
- Logged-in user

**Steps:**
1. Open settings.
2. Navigate to the "Privacy" section.
3. Toggle "Show Online Status" off.
4. Toggle "Allow DMs from Non-Friends" off.
5. Save changes.
6. From a second account, check if the user appears online.
7. From a second account (non-friend), try sending a DM.

**Expected Results:**
- When "Show Online Status" is off, the user appears offline to others.
- When "Allow DMs from Non-Friends" is off, non-friends cannot initiate a DM.
- Settings are saved and enforced immediately.
- A non-friend attempting to DM receives an appropriate error message.

**Troubleshooting:**
- If the online status still shows, verify the presence system checks the privacy setting before broadcasting.
- If DMs are not blocked, check the DM creation endpoint for the privacy check.

---

### Test 7.5: Voice Settings

**Purpose:** Verify users can configure their audio devices for voice chat.

**Prerequisites:**
- Logged-in user with a microphone and speakers/headphones

**Steps:**
1. Open settings.
2. Navigate to the "Voice & Audio" section.
3. Select a microphone input device from the dropdown.
4. Select an output device from the dropdown.
5. Test the microphone (look for a visual indicator of audio input level).
6. Adjust input sensitivity.
7. Save changes.

**Expected Results:**
- Available input and output devices are listed in dropdowns.
- Selecting a device applies the change immediately (for test purposes).
- The microphone test shows a visual level meter responding to voice input.
- Input sensitivity adjustment changes the threshold for voice activation.
- Device preferences persist across sessions and voice calls.

**Troubleshooting:**
- If no devices appear, verify the browser has permission to enumerate media devices (`navigator.mediaDevices.enumerateDevices()`).
- If the test does not work, check that `getUserMedia` is called with the selected device ID.

---

## Section 8: Friends & DMs

### Test 8.1: Send Friend Request

**Purpose:** Verify users can send friend requests.

**Prerequisites:**
- Two user accounts that are not already friends

**Steps:**
1. Log in as User A.
2. Navigate to the Friends section.
3. Click "Add Friend."
4. Enter User B's username or tag.
5. Click "Send Friend Request."
6. Log in as User B and check for the incoming request.

**Expected Results:**
- The friend request is sent successfully with a confirmation message.
- User B sees the pending friend request in their Friends > Pending tab.
- The request shows User A's username and avatar.
- User A cannot send duplicate requests to the same user.
- A sent request appears in User A's "Pending" or "Sent" tab.

**Troubleshooting:**
- If the request does not appear, check the `friend_requests` table in Supabase.
- If sending fails, check for error handling in the friend request API and the Console for error messages.
- Verify RLS policies allow inserting into the friend requests table.

---

### Test 8.2: Accept/Decline Friend Request

**Purpose:** Verify users can accept or decline incoming friend requests.

**Prerequisites:**
- A pending friend request from Test 8.1

**Steps:**
1. Log in as User B (the request recipient).
2. Navigate to Friends > Pending.
3. Find User A's friend request.
4. Click "Accept."
5. Verify User A appears in the Friends list.
6. Repeat the test but click "Decline" instead.
7. Verify the declined request is removed and no friendship is created.

**Expected Results:**
- Accepting adds both users to each other's friend lists.
- Both users can see each other in their Friends tab.
- The pending request is removed after accepting or declining.
- Declining does not create a friendship.
- User A is notified when their request is accepted.

**Troubleshooting:**
- If the friendship is not created after accepting, check the friend request handler for the insert into the `friends` table.
- If the request persists after declining, verify the delete operation on the `friend_requests` table.

---

### Test 8.3: Remove Friend

**Purpose:** Verify users can remove existing friends.

**Prerequisites:**
- Two users who are currently friends

**Steps:**
1. Log in as User A.
2. Navigate to the Friends list.
3. Find User B.
4. Click "Remove Friend" (may be in a context menu or three-dot menu).
5. Confirm the action.
6. Verify User B is no longer in the Friends list.
7. Log in as User B and verify User A is also removed.

**Expected Results:**
- A confirmation dialog appears before removal.
- After removal, both users are removed from each other's friend lists.
- Existing DM conversations are preserved but the friend indicator is removed.
- The removed user can send a new friend request if desired.

**Troubleshooting:**
- If the friend persists in the other user's list, verify the removal deletes both sides of the friendship record.

---

### Test 8.4: Block User

**Purpose:** Verify the user blocking functionality.

**Prerequisites:**
- Two user accounts

**Steps:**
1. Log in as User A.
2. Navigate to User B's profile or find them in a member list.
3. Click "Block User."
4. Confirm the block.
5. Verify User B's messages are hidden in channels.
6. Verify User B cannot send DMs to User A.
7. Log in as User B and verify they cannot interact with User A.

**Expected Results:**
- Blocked users' messages are hidden in channel views (may show "[Blocked message]" placeholder).
- Blocked users cannot send DMs to the blocker.
- The blocked user is not notified that they have been blocked.
- The blocker can unblock the user from their settings or the user's profile.
- Friend relationship is severed upon blocking.

**Troubleshooting:**
- If messages still show, check the message rendering component for the block list filter.
- If DMs still go through, verify the DM creation endpoint checks the block list.

---

### Test 8.5: Send DM

**Purpose:** Verify direct messaging between users.

**Prerequisites:**
- Two users who are friends (or DMs from non-friends are allowed)

**Steps:**
1. Log in as User A.
2. Navigate to the DMs section or click User B's name to open a DM.
3. Type a message and send it.
4. Log in as User B and navigate to DMs.
5. Verify the message appears.
6. Reply as User B.
7. Verify the reply appears in real-time in User A's window.

**Expected Results:**
- DM conversations appear in the DMs section of the sidebar.
- Messages are delivered in real-time (Supabase Realtime).
- Both users see the conversation history.
- The conversation is private (not visible to others).
- DMs persist after page refresh.

**Troubleshooting:**
- If the DM does not appear, check the DM channel creation and the messages table.
- If real-time delivery fails, verify the Realtime subscription for the DM channel.

---

### Test 8.6: DM Unread Count

**Purpose:** Verify unread message counts for DM conversations.

**Prerequisites:**
- Two users with an existing DM conversation

**Steps:**
1. Log in as User A. Do not open the DM with User B.
2. As User B (from another window), send 3 messages to User A.
3. Observe User A's DM sidebar for unread indicators.
4. Note the unread count badge.
5. As User A, open the DM conversation with User B.
6. Verify the unread count is cleared.

**Expected Results:**
- An unread count badge appears next to User B's DM entry (showing "3").
- The unread count updates in real-time as new messages arrive.
- Opening the conversation clears the unread count.
- A global unread indicator may appear on the DMs icon in the server list sidebar.

**Troubleshooting:**
- If the unread count does not appear, check the unread tracking logic (may use `last_read_at` timestamps or a separate `unread_counts` table).
- If the count does not clear, verify the "mark as read" operation fires when the conversation is opened.

---

## Section 9: Security Testing

### Test 9.1: SQL Injection

**Purpose:** Verify the app is protected against SQL injection attacks.

**Prerequisites:**
- A logged-in user account

**Steps:**
1. Navigate to a text channel.
2. In the message input, type the following payloads one at a time and send:
   - `'; DROP TABLE messages; --`
   - `1' OR '1'='1`
   - `Robert'); DROP TABLE profiles;--`
3. Navigate to the search functionality (if available) and enter similar payloads.
4. Try the payloads in username, server name, and channel name fields.

**Expected Results:**
- All payloads are treated as plain text and displayed as-is in the message list.
- No database errors occur.
- No data is deleted or modified.
- The application continues to function normally after each attempt.
- Supabase's parameterized queries and RLS should prevent any SQL injection.

**Troubleshooting:**
- If any payload causes an error, check the Supabase logs for SQL errors. This indicates a raw SQL query may be used somewhere instead of the Supabase client's parameterized methods.
- If data is deleted or modified, this is a critical security vulnerability -- escalate immediately.

---

### Test 9.2: XSS (Cross-Site Scripting)

**Purpose:** Verify the app is protected against XSS attacks.

**Prerequisites:**
- A logged-in user account

**Steps:**
1. Navigate to a text channel.
2. Send the following messages one at a time:
   - `<script>alert('XSS')</script>`
   - `<img src=x onerror=alert('XSS')>`
   - `<svg onload=alert('XSS')>`
   - `javascript:alert('XSS')`
   - `<a href="javascript:alert('XSS')">Click me</a>`
3. Observe how each message renders.
4. Try the same payloads in username, bio, server name, and channel name fields.
5. Check the browser Console for any executed scripts.

**Expected Results:**
- All script tags and event handlers are escaped or sanitized.
- Messages display the raw text without executing any JavaScript.
- No alert dialogs appear.
- The Console shows no unexpected script execution.
- React's built-in XSS protection (JSX escaping) handles most cases.
- Any `dangerouslySetInnerHTML` usage properly sanitizes input.

**Troubleshooting:**
- If an alert dialog appears, identify which input was not sanitized and add proper escaping.
- Check for any use of `dangerouslySetInnerHTML` in the codebase and ensure the input is sanitized with a library like DOMPurify.

---

### Test 9.3: CSRF Protection

**Purpose:** Verify Cross-Site Request Forgery protections are in place.

**Prerequisites:**
- A logged-in user account
- Knowledge of the API endpoints

**Steps:**
1. While logged in to Bedrock Chat, open a new tab.
2. Create a simple HTML page with a form that submits a POST request to a Bedrock Chat API endpoint (e.g., send a message or change settings).
3. Open the HTML page and submit the form.
4. Check if the action was performed.

**Expected Results:**
- The cross-origin request is rejected.
- Supabase's built-in CSRF protection (via JWT in Authorization header) prevents form-based CSRF.
- Since the app uses fetch/XHR with Authorization headers (not cookies for auth), traditional CSRF is mitigated.
- CORS headers restrict which origins can make requests.

**Troubleshooting:**
- If the request succeeds, check the CORS configuration in Supabase and the API.
- Verify that authentication is done via Authorization headers, not cookies.

---

### Test 9.4: RLS Verification

**Purpose:** Verify Row Level Security prevents unauthorized data access.

**Prerequisites:**
- Two user accounts
- Supabase anon key and project URL

**Steps:**
1. Log in as User A and note their JWT token (from localStorage or Network tab).
2. Using a tool like `curl` or Postman, make a request to the Supabase REST API:
   ```
   GET /rest/v1/messages?select=*&channel_id=eq.<some_channel_id>
   Authorization: Bearer <user_a_token>
   ```
3. Verify that only messages from channels User A has access to are returned.
4. Try to access a private channel that User A is not a member of.
5. Try to read another user's private data (e.g., DMs between two other users).
6. Try to update another user's profile:
   ```
   PATCH /rest/v1/profiles?id=eq.<user_b_id>
   Authorization: Bearer <user_a_token>
   Body: { "username": "hacked" }
   ```

**Expected Results:**
- RLS policies restrict data access to authorized users only.
- User A can only read messages from channels they are a member of.
- User A cannot read other users' DMs.
- User A cannot modify another user's profile.
- Unauthorized requests return empty results or 403 errors, NOT the actual data.

**Troubleshooting:**
- If unauthorized data is returned, this is a critical security issue. Check the RLS policies in Supabase for the affected table.
- Review all tables to ensure RLS is enabled and policies are correctly defined.

---

### Test 9.5: Security Headers

**Purpose:** Verify the application returns proper security headers.

**Prerequisites:**
- Access to the deployed application URL

**Steps:**
1. Open DevTools > Network tab.
2. Navigate to the app.
3. Click on the main document request.
4. Examine the response headers.
5. Check for the following headers:

**Expected Results:**
- `X-Content-Type-Options: nosniff` -- prevents MIME type sniffing.
- `X-Frame-Options: DENY` or `SAMEORIGIN` -- prevents clickjacking.
- `Strict-Transport-Security: max-age=...` -- enforces HTTPS.
- `X-XSS-Protection: 1; mode=block` -- legacy XSS protection.
- `Content-Security-Policy` -- restricts resource loading (if configured).
- `Referrer-Policy: strict-origin-when-cross-origin` -- limits referrer data.

**Troubleshooting:**
- Missing headers can be added in the Vercel project settings or via `next.config.js` headers configuration.
- If CSP is too restrictive, it may break legitimate functionality -- check the Console for CSP violations.

---

## Section 10: Performance

### Test 10.1: Page Load Time

**Purpose:** Verify the application loads within acceptable time limits.

**Prerequisites:**
- Access to the deployed application
- DevTools ready

**Steps:**
1. Clear browser cache.
2. Open DevTools > Network tab.
3. Navigate to the app login page.
4. Note the total page load time (DOMContentLoaded and Load events in the Network tab footer).
5. Log in and navigate to the main app view.
6. Note the load time for the main app.
7. Repeat 3 times and average the results.

**Expected Results:**
- Landing page loads within 2 seconds.
- Main app view (with server list, channel list, messages) loads within 3 seconds.
- First Contentful Paint (FCP) is under 0.8 seconds.
- Time to Interactive (TTI) is under 1.5 seconds.
- Initial JavaScript bundle is under 120KB gzipped.

**Troubleshooting:**
- If load times exceed targets, check the Network tab for large assets or slow API calls.
- Run `next build` locally and check the build output for bundle sizes.
- Consider lazy loading for heavy components or pages.

---

### Test 10.2: Lighthouse Score

**Purpose:** Verify the application meets performance benchmarks.

**Prerequisites:**
- Chrome browser with DevTools

**Steps:**
1. Navigate to the app's main page.
2. Open DevTools > Lighthouse tab.
3. Select "Performance," "Accessibility," "Best Practices," and "SEO."
4. Choose "Mobile" and "Desktop" configurations.
5. Run the audit.
6. Review the scores.

**Expected Results:**
- Performance score: > 90.
- Accessibility score: > 85.
- Best Practices score: > 90.
- SEO score: > 80.
- No critical issues flagged in any category.

**Troubleshooting:**
- If the Performance score is low, check for render-blocking resources, unoptimized images, and large JavaScript bundles.
- If Accessibility is low, check for missing alt text, insufficient color contrast, and missing ARIA labels.
- Address each Lighthouse recommendation one at a time, starting with the highest-impact items.

---

### Test 10.3: No Memory Leaks

**Purpose:** Verify the application does not leak memory over time.

**Prerequisites:**
- Chrome DevTools

**Steps:**
1. Navigate to the main app view.
2. Open DevTools > Memory tab.
3. Take a heap snapshot (Snapshot 1).
4. Perform normal usage for 5 minutes: navigate between channels, send messages, scroll through message history.
5. Take another heap snapshot (Snapshot 2).
6. Continue usage for another 5 minutes.
7. Take a third snapshot (Snapshot 3).
8. Compare the snapshots.

**Expected Results:**
- Memory usage remains stable over time (within a few MB variance).
- No consistent upward trend in heap size across snapshots.
- Detached DOM nodes do not accumulate.
- Event listeners are properly cleaned up (check the "Summary" view for EventListener counts).
- Memory usage stays under 100MB for typical usage.

**Troubleshooting:**
- If memory grows consistently, use the "Comparison" view between snapshots to identify objects that are accumulating.
- Common leaks: uncleared `setInterval`/`setTimeout`, event listeners not removed in cleanup functions, Supabase subscriptions not unsubscribed on component unmount.
- Check for components that subscribe to Zustand stores or Supabase Realtime but do not clean up on unmount.

---

### Test 10.4: Animation Smoothness

**Purpose:** Verify all animations run at 60fps.

**Prerequisites:**
- Chrome DevTools

**Steps:**
1. Open DevTools > Performance tab.
2. Click "Record."
3. Perform the following actions:
   - Open and close the server list collapse.
   - Hover over server icons and channel items.
   - Open and close a modal.
   - Scroll through the message list.
   - Expand and collapse channel categories.
4. Stop recording.
5. Examine the Frames section of the recording.

**Expected Results:**
- Frame rate stays at or near 60fps during all animations.
- No frame drops below 30fps.
- No long tasks (>50ms) during animations.
- Animations use GPU-accelerated properties (transform, opacity) rather than layout-triggering properties (width, height, top, left).

**Troubleshooting:**
- If frame drops occur, check which animations coincide with the drops.
- Verify Motion 12.x is using spring physics and not JS-based tweens.
- Check for forced synchronous layouts during animations.
- Ensure animated elements have `will-change: transform` applied.

---

## Section 11: Browser Compatibility

### Desktop Browsers

Test the following core flows in each browser:

| Flow | Chrome (latest) | Firefox (latest) | Safari (latest) | Edge (latest) |
|------|-----------------|-------------------|------------------|----------------|
| Signup/Login | | | | |
| Server navigation | | | | |
| Send/receive messages | | | | |
| Voice chat (join/leave) | | | | |
| Theme toggle | | | | |
| Glass morphism effects | | | | |
| Animations (60fps) | | | | |
| File upload | | | | |
| Emoji picker | | | | |
| Settings save | | | | |

**Steps for each browser:**
1. Clear cache and cookies.
2. Navigate to the app.
3. Complete the login flow.
4. Navigate between servers and channels.
5. Send and receive messages.
6. Join and leave a voice channel.
7. Toggle theme, open settings, change preferences.

**Expected Results:**
- All core flows work identically across browsers.
- Glass morphism (backdrop-blur) renders correctly in all browsers.
- OKLCH colors render correctly (or fallback gracefully in older engines).
- Animations are smooth in all browsers.

**Troubleshooting:**
- Safari may have issues with `backdrop-filter` in certain contexts. Test with and without hardware acceleration.
- Firefox may render OKLCH differently. Check for fallback colors.
- Edge should behave identically to Chrome (Chromium-based).

### Mobile Browsers

| Flow | iOS Safari | Android Chrome |
|------|-----------|----------------|
| Signup/Login | | |
| Server navigation | | |
| Send messages | | |
| Voice chat | | |
| Responsive layout | | |
| Touch scrolling | | |
| Virtual keyboard behavior | | |

**Steps:**
1. Open the app on a mobile device or use DevTools device emulation.
2. Verify the responsive layout adapts correctly.
3. Test touch interactions (tap, swipe, long press).
4. Verify the virtual keyboard does not obscure the message input.
5. Test voice chat with the device's built-in microphone and speakers.

**Expected Results:**
- The layout adapts to narrow screens (collapsible sidebars).
- Touch targets are at least 44x44px for accessibility.
- The virtual keyboard pushes the message input up (not obscured).
- Voice chat works with mobile audio hardware.
- Scrolling is smooth and uses native momentum.

**Troubleshooting:**
- If the layout is broken on mobile, check Tailwind responsive breakpoints and the `isMobile` flag in the UI store.
- If touch scrolling is janky, check for CSS `overflow` issues or JavaScript scroll listeners interfering with native scroll.

---

## Section 12: Accessibility

### Test 12.1: Keyboard Navigation

**Purpose:** Verify the entire app can be used with keyboard only.

**Prerequisites:**
- Any browser with DevTools

**Steps:**
1. Start at the login page.
2. Use Tab to navigate through all interactive elements.
3. Use Enter/Space to activate buttons and links.
4. Use Arrow keys to navigate within lists (server list, channel list, message list).
5. Use Escape to close modals and popovers.
6. Navigate through the main app layout using only the keyboard.

**Expected Results:**
- All interactive elements are reachable via Tab.
- Focus indicators (outlines) are visible on the focused element.
- Tab order follows a logical flow (left to right, top to bottom).
- Modals trap focus (Tab cycles within the modal, not behind it).
- Escape closes modals and returns focus to the trigger element.
- No keyboard traps (user can always navigate away from any element).
- Custom interactive elements (role="button") respond to Enter and Space.

**Troubleshooting:**
- If elements are skipped, check for missing `tabIndex` attributes.
- If focus indicators are invisible, check for CSS that removes outlines (e.g., `outline: none` without a replacement).
- If modals do not trap focus, implement a focus trap using a library or manual DOM management.

---

### Test 12.2: Screen Reader

**Purpose:** Verify the app is usable with screen readers.

**Prerequisites:**
- A screen reader (VoiceOver on macOS, NVDA on Windows, or ChromeVox extension)

**Steps:**
1. Enable the screen reader.
2. Navigate to the app.
3. Listen to the screen reader announce page structure, headings, and landmarks.
4. Navigate through the server list -- each server should be announced with its name.
5. Navigate through the channel list -- each channel should be announced with its name and type.
6. Navigate to the message list -- messages should be announced with the sender, timestamp, and content.
7. Interact with buttons, forms, and modals.

**Expected Results:**
- The page has proper heading hierarchy (h1, h2, h3).
- ARIA landmarks are used (navigation, main, complementary).
- All images have meaningful alt text.
- Interactive elements have accessible names (via aria-label or visible text).
- Form inputs have associated labels.
- Dynamic content changes are announced (live regions for new messages, typing indicators).
- The message list uses `role="log"` or `aria-live="polite"` for new messages.

**Troubleshooting:**
- If elements are not announced, check for missing ARIA attributes.
- If the structure is confusing, add ARIA landmarks and heading hierarchy.
- Use the Accessibility tab in DevTools to inspect the accessibility tree.

---

### Test 12.3: Color Contrast

**Purpose:** Verify sufficient color contrast ratios for text readability.

**Prerequisites:**
- Chrome DevTools or a contrast checking tool

**Steps:**
1. Open DevTools.
2. Use the "Rendering" drawer > "Emulate vision deficiencies" to test with different color vision simulations.
3. Use a contrast checker (e.g., WebAIM contrast checker) to verify:
   - Normal text: minimum 4.5:1 contrast ratio (WCAG AA).
   - Large text (18px+ or 14px+ bold): minimum 3:1 contrast ratio.
   - UI components and graphical objects: minimum 3:1 contrast ratio.
4. Check both dark and light themes.
5. Pay special attention to:
   - Channel names in the sidebar.
   - Timestamp text on messages.
   - Placeholder text in the message input.
   - Badge text on unread counts.
   - Glass morphism surfaces with overlaid text.

**Expected Results:**
- All text meets WCAG AA contrast requirements.
- Glass morphism backgrounds do not reduce text readability.
- Both dark and light themes pass contrast checks.
- No information is conveyed by color alone (e.g., online status uses an icon plus color).

**Troubleshooting:**
- If contrast fails, adjust the OKLCH color values in `globals.css` to increase lightness difference between text and background.
- Glass morphism surfaces may need a higher background opacity to ensure text contrast.

---

### Test 12.4: Reduced Motion

**Purpose:** Verify the app respects the user's reduced motion preference.

**Prerequisites:**
- A browser with the ability to emulate `prefers-reduced-motion: reduce`

**Steps:**
1. Open DevTools > Rendering drawer.
2. Enable "Emulate CSS media feature prefers-reduced-motion" > "reduce."
3. Navigate through the app.
4. Observe all animations and transitions.

**Expected Results:**
- When reduced motion is enabled, all non-essential animations are disabled or significantly reduced.
- Page transitions are instant rather than animated.
- Hover effects are static rather than animated.
- Essential animations (e.g., loading spinners) may still animate but with minimal motion.
- The app remains fully functional without animations.
- No layout shifts occur where animations previously existed.

**Troubleshooting:**
- If animations still play, check that Motion 12.x respects the `prefers-reduced-motion` media query.
- Add `@media (prefers-reduced-motion: reduce)` CSS rules to disable transitions.
- Check the Motion configuration for a `reducedMotion` option.

---

## Final Pre-Launch Checklist

### Infrastructure
- [ ] Vercel deployment is on production environment
- [ ] Custom domain is configured and SSL certificate is active
- [ ] Supabase project is on an appropriate plan (not free tier for production)
- [ ] Daily.co account is on an appropriate plan for expected voice usage
- [ ] Environment variables are set for production (not development/test values)
- [ ] Database migrations are applied and up to date
- [ ] Supabase Realtime is enabled for all necessary tables

### Security
- [ ] All RLS policies are tested and verified (Section 9.4)
- [ ] No SQL injection vulnerabilities (Section 9.1)
- [ ] No XSS vulnerabilities (Section 9.2)
- [ ] CSRF protection is in place (Section 9.3)
- [ ] Security headers are configured (Section 9.5)
- [ ] All API keys are restricted to production domains
- [ ] Supabase anon key has minimal permissions
- [ ] No secrets or API keys are exposed in client-side code
- [ ] Rate limiting is configured on authentication endpoints
- [ ] Password requirements meet minimum standards (8+ characters, complexity)

### Privacy & Compliance
- [ ] Privacy policy is published and accessible (Section 2.1)
- [ ] Terms of service are published and accessible (Section 2.2)
- [ ] Consent banner appears on first visit (Section 2.3)
- [ ] Data export functionality works (Section 2.5)
- [ ] CCPA/GDPR compliance controls are functional (Section 2.6)
- [ ] No third-party analytics or tracking (Section 2.7)
- [ ] GPC/DNT signals are respected (Section 2.8)
- [ ] No audio recordings are stored (Section 5.8)
- [ ] Parental monitoring transparency log is functional (Section 6.5)

### Core Functionality
- [ ] User signup works for all account types (Section 1.1)
- [ ] Login and logout work correctly (Sections 1.3, 1.5)
- [ ] Messages can be sent, received, edited, and deleted (Sections 3.1-3.4)
- [ ] Reactions work correctly (Section 3.5)
- [ ] Typing indicators function (Section 3.7)
- [ ] Server creation and management work (Sections 4.1-4.10)
- [ ] Voice channels connect and transmit audio (Sections 5.1-5.5)
- [ ] Friend requests and DMs work (Sections 8.1-8.6)
- [ ] Family account features work (Sections 6.1-6.8)
- [ ] Settings save and persist (Sections 7.1-7.5)

### Performance
- [ ] Page load time under 3 seconds (Section 10.1)
- [ ] Lighthouse performance score > 90 (Section 10.2)
- [ ] No memory leaks detected (Section 10.3)
- [ ] Animations run at 60fps (Section 10.4)
- [ ] Initial bundle size under 120KB gzipped
- [ ] Virtual scrolling works with 500+ messages (Section 3.8)

### Compatibility
- [ ] Tested on Chrome, Firefox, Safari, Edge (Section 11)
- [ ] Tested on iOS Safari and Android Chrome (Section 11)
- [ ] Responsive layout works on mobile devices
- [ ] Touch interactions work correctly on mobile

### Accessibility
- [ ] Full keyboard navigation possible (Section 12.1)
- [ ] Screen reader compatibility verified (Section 12.2)
- [ ] Color contrast meets WCAG AA (Section 12.3)
- [ ] Reduced motion preference respected (Section 12.4)
- [ ] All interactive elements have accessible names
- [ ] Focus management works correctly for modals and popovers

### Monitoring & Error Handling
- [ ] Error boundaries are in place for React component crashes
- [ ] Supabase connection errors are handled gracefully
- [ ] Daily.co connection errors are handled gracefully
- [ ] Offline state is handled (shows appropriate messaging)
- [ ] 404 page exists for unknown routes
- [ ] Toast notifications appear for user-facing errors

### Final Verification
- [ ] Fresh signup flow works end-to-end (new user, no cached data)
- [ ] All 12 test sections above have been completed with passing results
- [ ] All critical and high-severity bugs are resolved
- [ ] Test results are documented and archived
- [ ] Team sign-off obtained

---

**Document prepared:** 2026-02-16
**Next review date:** Before each major release
**Maintained by:** QA Team / Development Team
