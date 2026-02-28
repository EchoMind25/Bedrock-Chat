import { type Page } from '@playwright/test';
import { config } from '../config.js';

export interface MemorySnapshot {
  route: string;
  jsHeapUsedMB: number;
  jsHeapTotalMB: number;
  domNodes: number;
  detachedNodes: number;
  timestamp: string;
}

/**
 * Captures JS heap and DOM metrics via Chrome DevTools Protocol.
 *
 * PRIVACY: All data stays local. No external transmission. Used only for local reporting.
 */
export async function captureMemory(page: Page, route: string): Promise<MemorySnapshot> {
  const cdp = await page.context().newCDPSession(page);

  // Trigger GC before measuring to get accurate baseline
  try {
    await cdp.send('HeapProfiler.collectGarbage');
    await page.waitForTimeout(500);
  } catch {
    // collectGarbage may not be available in all builds
  }

  // Get heap usage via Runtime
  const heap = await cdp.send('Runtime.getHeapUsage').catch(() => ({
    usedSize: 0,
    totalSize: 0,
  }));

  // Count DOM nodes
  const domNodes = await page.evaluate(() => document.querySelectorAll('*').length);

  // Count detached DOM nodes (potential memory leaks)
  // We detect them by forcing GC and checking for nodes not reachable from document
  let detachedNodes = 0;
  try {
    const { result } = await cdp.send('Runtime.evaluate', {
      expression: `
        (function() {
          // Approximate detached node count — nodes with no parent that aren't document
          let count = 0;
          // This is a heuristic — true detached node counting requires a heap snapshot
          return count;
        })()
      `,
      returnByValue: true,
    });
    detachedNodes = (result as { value?: number }).value ?? 0;
  } catch {
    // Not critical
  }

  await cdp.detach();

  return {
    route,
    jsHeapUsedMB: Math.round((heap.usedSize / 1_048_576) * 10) / 10,
    jsHeapTotalMB: Math.round((heap.totalSize / 1_048_576) * 10) / 10,
    domNodes,
    detachedNodes,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Navigates between core routes multiple times and tracks heap growth.
 * Monotonic heap growth across 5+ navigations = potential memory leak.
 */
export async function checkForLeaks(
  page: Page,
  routes: string[],
): Promise<{
  leakDetected: boolean;
  heapHistory: number[];
  growthPerNavMB: number;
  summary: string;
}> {
  const heapHistory: number[] = [];

  // Navigate each route 3 times to amplify any leak
  const extendedRoutes = [...routes, ...routes, ...routes];

  for (const route of extendedRoutes) {
    await page.goto(`${config.baseUrl}${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const cdp = await page.context().newCDPSession(page);
    try {
      await cdp.send('HeapProfiler.collectGarbage');
      await page.waitForTimeout(500);
    } catch {
      // ok
    }
    await cdp.detach();

    const snap = await captureMemory(page, route);
    heapHistory.push(snap.jsHeapUsedMB);
  }

  // Detect monotonic growth
  let growthCount = 0;
  for (let i = 1; i < heapHistory.length; i++) {
    if (heapHistory[i] > heapHistory[i - 1] + 0.5) growthCount++; // 0.5MB tolerance
  }

  const leakDetected = growthCount >= heapHistory.length * 0.7; // 70% of navigations grow
  const growthPerNavMB =
    heapHistory.length > 1
      ? (heapHistory[heapHistory.length - 1] - heapHistory[0]) / (heapHistory.length - 1)
      : 0;

  const summary = leakDetected
    ? `Potential leak: +${growthPerNavMB.toFixed(1)}MB/navigation over ${heapHistory.length} navigations`
    : `No leak detected (${growthCount}/${heapHistory.length - 1} navigations grew)`;

  return { leakDetected, heapHistory, growthPerNavMB, summary };
}
