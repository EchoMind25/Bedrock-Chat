# Bedrock Chat — Performance Audit

**DEV-ONLY tooling. Never deployed. Collects zero user data.**

Runs Playwright + Lighthouse across every authenticated route and produces:
- Per-route Lighthouse scores (Performance, Accessibility, Best Practices, SEO)
- Core Web Vitals (FCP, LCP, TBT, CLS, Speed Index, TTI)
- JS heap + DOM node snapshots
- Non-composited animation detection
- Memory leak check across core routes
- Consolidated `AUDIT_REPORT.md` with prioritized recommendations
- Full HTML Lighthouse reports per route

---

## Setup

**1. Install dependencies:**
```bash
cd audit
npm install
npm run setup   # installs Playwright Chromium
```

**2. Create your credentials file:**
```bash
cp .env.audit.example .env.audit
# Edit .env.audit — set AUDIT_EMAIL / AUDIT_PASSWORD
# Use the test account, not a real user account
```

The `.env.audit` file is git-ignored. Never commit it.

**3. Ensure the app is running (for local audits):**
```bash
# From repo root:
pnpm dev
# Then in audit/ set AUDIT_BASE_URL=http://localhost:3000
```

---

## Run

```bash
# Full audit — mobile + desktop, all routes
npm run audit

# Mobile only (Moto G Power / Slow 4G)
npm run audit:mobile

# Desktop only
npm run audit:desktop

# Single route
npm run audit:route -- --route=/friends

# Compare against previous run
npm run audit:compare

# Skip Lighthouse (just memory + animations — faster)
npm run audit -- --skip-lighthouse

# Skip memory leak check
npm run audit -- --skip-leak-check
```

---

## Output

Results are saved to `audit/results/YYYY-MM-DD/` (git-ignored):

```
results/
└── 2026-02-28/
    ├── AUDIT_REPORT.md          # Consolidated findings + recommendations
    ├── COMPARISON.md            # Delta vs previous run (--compare mode)
    ├── history.json             # Raw data for future comparisons
    ├── screenshots/             # Full-page PNG per route
    └── lighthouse-reports/      # Full HTML Lighthouse report per route
```

---

## Routes Audited

| Route | Category | Notes |
|-------|----------|-------|
| `/` | Public | Landing page baseline |
| `/login` | Public | Auth page |
| `/friends` | Core | Friends list |
| `/servers/{id}/{channelId}` | Core | Text channel (chat view) |
| `/dms` | Social | DMs list |
| `/notifications` | Social | Notifications |
| `/channels/{id}/voice/{id}` | Voice | Voice channel pre-join |
| `/family/dashboard` | Family | Requires parent account |
| `/family/flags` | Family | Requires parent account |
| `/parent-dashboard/overview` | Family | Requires parent account |
| `/parent-dashboard/monitoring` | Family | Requires parent account |
| `/parent-dashboard/activity` | Family | Requires parent account |

Server/channel IDs are discovered automatically from the live app.
Family routes are skipped unless `AUDIT_PARENT_EMAIL` is set.

---

## Performance Budgets

| Metric | Default Budget | Heavy Routes (Chat/Voice) |
|--------|---------------|--------------------------|
| Performance Score | 80 | 70 |
| FCP | 1800ms | 1800ms |
| LCP | 2500ms | 3500ms |
| TBT | 300ms | 500ms |
| CLS | 0.1 | 0.1 |
| JS Heap | 50MB | 80MB |

---

## Privacy

- Runs locally or in CI only
- Uses a dedicated test account — no real user data
- No telemetry, no analytics, no external requests beyond normal app traffic
- Credentials are git-ignored (`.env.audit`, `results/`)
- The test account should have minimal/no personal data
