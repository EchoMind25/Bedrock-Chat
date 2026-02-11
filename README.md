# Bedrock Chat

Privacy-first Discord alternative with 2026 design aesthetics.

## Tech Stack (February 2026)

- **Next.js 16.1.x** with Turbopack (default bundler)
- **React 19.2.x** (Activity API, useEffectEvent, refs as props)
- **Tailwind CSS 4.1.x** (CSS-first, @theme directive, OKLCH colors)
- **Motion 12.x** (import from "motion/react")
- **Zustand 5.x** (useSyncExternalStore)
- **TypeScript 5.7.x** strict mode
- **Biome** for linting (replaces ESLint + Prettier)
- **pnpm** as package manager

## Project Structure

```
bedrock-chat/
├── app/                    # Next.js 16 App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Tailwind CSS 4 with @theme
├── components/
│   └── ui/
│       └── glass/         # Glass components
│           ├── glass.tsx
│           └── index.ts
├── lib/
│   └── utils/
│       ├── animations.ts  # Motion 12 utilities
│       └── cn.ts         # Class name utility
├── proxy.ts              # Security headers + GPC detection
├── biome.json           # Biome configuration
├── next.config.ts       # Next.js 16 config
├── tsconfig.json        # TypeScript config
└── package.json         # Dependencies
```

## Getting Started

1. Install dependencies:
```bash
pnpm install
```

2. Run the development server:
```bash
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Key Features

### Glass Components
- `<Glass>` - Base glass component with blur + border variants
- `<GlassCard>` - Glass component with padding
- `<GlassPanel>` - Strong glass effect with more padding

### Animation Utilities
- Pre-built variants: fadeIn, slideUp, slideDown, scaleIn, glassReveal
- Spring and easing presets
- Stagger animations for lists
- Modal and page transitions

### Security & Privacy
- **proxy.ts** with comprehensive security headers
- GPC (Global Privacy Control) signal detection
- DNT (Do Not Track) support
- Strict CSP and permissions policies

### Styling
- OKLCH color system for perceptually uniform colors
- CSS-first configuration with @theme
- Dark mode support
- Glass morphism design system

## 2026 Best Practices

✅ **DO:**
- Use `proxy.ts` for request handling
- Configure Tailwind with `@theme` in globals.css
- Import from `motion/react` (NOT framer-motion)
- Pass refs as props in React 19 (no forwardRef)
- Let React Compiler handle useMemo/useCallback

❌ **DON'T:**
- Use `middleware.ts` (deprecated in Next.js 16)
- Use `tailwind.config.js` (use @theme instead)
- Import from `framer-motion`
- Use `forwardRef` wrapper
- Add unnecessary useMemo/useCallback

## Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Check code with Biome
- `pnpm lint:fix` - Fix linting issues
- `pnpm format` - Format code with Biome
- `pnpm type-check` - Run TypeScript compiler

## License

MIT
