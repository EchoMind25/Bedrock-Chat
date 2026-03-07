# Contributing to Bedrock Chat

## Branch Strategy

```
main          ← production (Vercel auto-deploy to bedrockchat.com + developer.bedrockchat.com)
develop       ← integration branch (Vercel auto-deploy to alpha.bedrockchat.com)
feature/*     ← new features (PR → develop)
fix/*         ← bug fixes (PR → develop)
chore/*       ← maintenance, deps, CI (PR → develop)
hotfix/*      ← urgent production fixes (PR → main)
feature/native-client ← Tauri desktop app track
```

### Rules

- All changes go through PRs. No direct pushes to `main` or `develop`.
- `hotfix/*` branches may target `main` directly for urgent fixes.
- `feature/native-client` triggers Tauri CI builds automatically.

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add PWA install prompt on download page
fix: resolve hydration mismatch in channel list
chore: update pnpm lockfile
perf: lazy-load 3D hero scene on idle
docs: add Tauri development notes
```

Scopes are optional but encouraged: `feat(chat):`, `fix(auth):`, `chore(ci):`.

## Development Setup

### Prerequisites

- Node.js 20 LTS
- pnpm 9+
- For Tauri: Rust stable + platform dependencies (see below)

### Next.js (PWA) Development

```bash
pnpm install
pnpm dev          # http://localhost:3000, Turbopack HMR
```

### Tauri (Desktop) Development

```bash
# Install Rust: https://rustup.rs
rustup default stable

# Linux dependencies
sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev \
  librsvg2-dev patchelf libssl-dev libgtk-3-dev

# macOS: Xcode Command Line Tools required
xcode-select --install

# Windows: Visual Studio Build Tools with C++ workload

# Run Tauri dev (starts Next.js + native window)
pnpm add -D @tauri-apps/cli@^2   # first time only
pnpm tauri dev
```

### Linting & Type-checking

```bash
pnpm lint          # Biome (linter + formatter)
pnpm lint:fix      # Auto-fix
pnpm type-check    # tsc --noEmit
```

## Privacy Rules

Bedrock Chat is privacy-first. CI will **block your PR** if it detects third-party
analytics patterns (`gtag`, `mixpanel`, `amplitude`, `hotjar`, etc.) in source files.

- No tracking pixels or analytics scripts on any page
- No third-party scripts on pre-auth pages
- All data collection must be documented and COPPA/GDPR compliant
- Download links must use HTTPS

## PWA vs Tauri Notes

| Concern | PWA | Tauri |
|---------|-----|-------|
| Entry point | Next.js server-rendered pages | Static export loaded in WebView |
| APIs | Web APIs only | Web APIs + Tauri IPC commands |
| Updates | Automatic (service worker) | Built-in Tauri updater |
| Distribution | Browser install prompt | GitHub Releases (.exe/.dmg/.AppImage) |

When adding features, consider whether they work in both contexts. Use
`getClientContext()` from `lib/client-detection.ts` to branch on runtime context.

## Environment Variables

| Variable | Purpose | Where set |
|----------|---------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `.env.local`, Vercel UI |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `.env.local`, Vercel UI |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase key | Vercel UI only (never commit) |
| `LIVEKIT_API_KEY` | LiveKit voice server key | Vercel UI only |
| `LIVEKIT_API_SECRET` | LiveKit voice server secret | Vercel UI only |
| `LIVEKIT_URL` | LiveKit WebSocket URL | `.env.local`, Vercel UI |
| `RESEND_API_KEY` | Email sending (Resend) | Vercel UI only |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push VAPID key | `.env.local`, Vercel UI |
| `VAPID_PRIVATE_KEY` | Web Push VAPID private key | Vercel UI only |
| `TAURI_SIGNING_PRIVATE_KEY` | Tauri update signature key | GitHub Secrets only |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Tauri key password | GitHub Secrets only |

**Never commit `.env.local` or any file containing secrets.**

## Architecture Notes

- **No `middleware.ts`:** This project uses proxy-based routing (`proxy.ts`) instead of
  Next.js middleware. Do not create a `middleware.ts` file — this is intentional.
