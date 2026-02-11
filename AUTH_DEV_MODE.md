# Authentication - Development Mode Guide

## Quick Access in Development

In development mode (`NODE_ENV=development`), you have **easy access** to all features without going through the full authentication flow every time.

### 🚀 Quick Login Methods

#### Method 1: One-Click Dev Login (Recommended)
- Visit `/login` or `/signup`
- Look for the **Development Mode banner** at the top
- Click the **"Quick Login"** or **"Skip Signup"** button
- You'll be instantly logged in as a dev user and redirected to `/channels`

#### Method 2: Any Email + Password
- Go to `/login`
- Enter **any email** (must contain `@`)
- Enter **any password** (6+ characters)
- Click **Sign In**
- Example: `test@example.com` / `password123`

#### Method 3: Full Signup Flow (For Testing)
The signup wizard has 4 steps, but in dev mode:
1. Choose account type (Standard or Family)
2. Fill in details (any values work)
3. Enter verification code (**any 6 digits** work)
4. Welcome screen → Get Started

### 📁 Files Created

```
Bedrock-Chat/
├── store/
│   └── auth.store.ts              # Zustand auth store with devLogin()
├── lib/
│   └── hooks/
│       └── use-auth-guard.ts      # Auth guard hook
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/
│   │   │   └── page.tsx           # Login with dev banner
│   │   └── signup/
│   │       └── page.tsx           # Signup wizard with dev banner
│   └── channels/
│       └── page.tsx               # Authenticated landing page
└── AUTH_DEV_MODE.md               # This file
```

### 🔒 Authentication Features

- ✅ **Login/Signup flows** - Fully functional with mock validation
- ✅ **Persistent auth** - User data stored in localStorage (key: `bedrock-auth`)
- ✅ **Protected routes** - `/channels` redirects to `/login` if not authenticated
- ✅ **Dev mode shortcuts** - Quick login without credentials
- ✅ **Error handling** - Shows validation errors (but accepts most inputs)
- ✅ **Loading states** - Simulates network delays (800-1500ms)

### 🎨 User Data Structure

```typescript
interface User {
  id: string;              // UUID
  email: string;
  username: string;
  displayName: string;
  avatar: string;          // Faker-generated avatar
  accountType: "standard" | "parent" | "teen";
  createdAt: Date;
  settings: {
    theme: "dark" | "light" | "system";
    notifications: boolean;
    reducedMotion: boolean;
  };
}
```

### 🧪 Testing Auth

1. **Start dev server:**
   ```bash
   pnpm dev
   ```

2. **Test flows:**
   - Visit http://localhost:3000
   - Click "Get Started" or "Sign In" from landing page
   - Use Quick Login button for instant access
   - Or test full login/signup flows

3. **Test persistence:**
   - Log in → Refresh page → Still logged in
   - Check localStorage: `bedrock-auth` key
   - Logout → Redirected to home

4. **Test auth guards:**
   - Visit `/channels` when logged out → Redirected to `/login`
   - Visit `/login` when logged in → Redirected to `/channels`

### 🛠️ Dev Tools

- **Zustand DevTools**: Auth store is instrumented with Redux DevTools
- **Local Storage**: Inspect `bedrock-auth` in browser DevTools
- **Quick Logout**: Visit `/channels` and click "Logout" button

### 📝 Notes

- **All validation is mock** - Any reasonable input works
- **No backend** - Everything runs client-side
- **No real verification** - Email codes accept any 6 digits
- **localStorage only** - No cookies, no server sessions

### 🚧 Coming Next: Phase 2.3

After authentication is complete, the next phase will add:
- Server list navigation
- Channel list with categories
- Main application layout (Discord-style)
- User panel with settings

---

**Pro Tip**: Add this to your bookmark bar for instant dev login:
```javascript
javascript:(function(){localStorage.setItem('bedrock-auth','{"state":{"user":{"id":"dev-123","email":"dev@bedrock.chat","username":"developer","displayName":"Dev User","avatar":"https://api.dicebear.com/7.x/avataaars/svg?seed=dev","accountType":"standard","createdAt":"2026-02-11T00:00:00.000Z","settings":{"theme":"dark","notifications":true,"reducedMotion":false}},"isAuthenticated":true},"version":0}');location.href='/channels'})()
```
