/**
 * Route registry for the Bedrock Chat performance audit.
 *
 * IMPORTANT: Routes are based on actual app/ directory structure, not the spec template.
 * - Chat: /servers/[serverId]/[channelId]  (not /channels/...)
 * - Voice: /channels/[serverId]/voice/[channelId]
 * - Settings: modal-based — no /settings/* routes exist
 * - Family: /family/* and /parent-dashboard/*
 */

export interface AuditRoute {
  path: string;
  name: string;
  category: 'public' | 'core' | 'social' | 'family' | 'voice';
  /** If true, {serverId}/{channelId}/{voiceChannelId} placeholders will be substituted */
  requiresServer?: boolean;
  /** If true, parent account credentials (AUDIT_PARENT_EMAIL) required */
  requiresParent?: boolean;
  /** CSS selector to wait for before running Lighthouse */
  readySelector?: string;
  /** Performance budget overrides for this route */
  budget?: Partial<PerformanceBudget>;
}

export interface PerformanceBudget {
  performanceScore: number;
  fcp: number;   // ms
  lcp: number;   // ms
  tbt: number;   // ms
  cls: number;
  jsHeapMB: number;
  unusedJSKiB: number;
}

export const DEFAULT_BUDGET: PerformanceBudget = {
  performanceScore: 80,
  fcp: 1800,
  lcp: 2500,
  tbt: 300,
  cls: 0.1,
  jsHeapMB: 50,
  unusedJSKiB: 100,
};

const HEAVY_ROUTE_BUDGET: Partial<PerformanceBudget> = {
  performanceScore: 70,
  lcp: 3500,
  tbt: 500,
  jsHeapMB: 80,
};

export const ROUTES: AuditRoute[] = [
  // ─── Public (baseline) ───
  {
    path: '/',
    name: 'Landing Page',
    category: 'public',
    readySelector: 'main',
  },
  {
    path: '/login',
    name: 'Login Page',
    category: 'public',
    readySelector: 'form',
  },

  // ─── Core App ───
  {
    path: '/friends',
    name: 'Friends List',
    category: 'core',
    readySelector: 'main',
  },
  {
    // Resolved dynamically — needs both serverId AND channelId
    path: '/servers/{serverId}/{channelId}',
    name: 'Server — Text Channel (Chat View)',
    category: 'core',
    requiresServer: true,
    readySelector: '[role="log"], main',
    budget: HEAVY_ROUTE_BUDGET,
  },

  // ─── Social ───
  {
    path: '/dms',
    name: 'Direct Messages',
    category: 'social',
    readySelector: 'main',
  },
  {
    path: '/notifications',
    name: 'Notifications',
    category: 'social',
    readySelector: 'main',
  },

  // ─── Voice ───
  {
    path: '/channels/{serverId}/voice/{voiceChannelId}',
    name: 'Voice Channel (Pre-Join)',
    category: 'voice',
    requiresServer: true,
    readySelector: 'main',
    budget: HEAVY_ROUTE_BUDGET,
  },

  // ─── Family — Parent account only ───
  {
    path: '/family/dashboard',
    name: 'Family — Dashboard',
    category: 'family',
    requiresParent: true,
    readySelector: 'main',
  },
  {
    path: '/family/flags',
    name: 'Family — Flags',
    category: 'family',
    requiresParent: true,
    readySelector: 'main',
  },
  {
    path: '/parent-dashboard/overview',
    name: 'Parent Dashboard — Overview',
    category: 'family',
    requiresParent: true,
    readySelector: 'main',
  },
  {
    path: '/parent-dashboard/monitoring',
    name: 'Parent Dashboard — Monitoring',
    category: 'family',
    requiresParent: true,
    readySelector: 'main',
  },
  {
    path: '/parent-dashboard/activity',
    name: 'Parent Dashboard — Activity',
    category: 'family',
    requiresParent: true,
    readySelector: 'main',
  },
];
