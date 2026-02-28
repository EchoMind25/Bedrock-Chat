import lighthouse from 'lighthouse';
import { type Page, type Browser } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface LighthouseResult {
  route: string;
  routeName: string;
  strategy: 'mobile' | 'desktop';
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  metrics: {
    fcp: number;   // ms
    lcp: number;   // ms
    tbt: number;   // ms
    cls: number;
    si: number;    // Speed Index ms
    tti: number;   // Time to Interactive ms
  };
  diagnostics: {
    mainThreadWork: number;           // ms
    unusedJavaScript: number;         // KiB
    jsExecutionTime: number;          // ms
    longTasks: number;
    nonCompositedAnimations: number;
    renderBlockingSavings: number;    // ms savings
  };
  budgetViolations: string[];
  htmlReportPath: string;
}

/**
 * Runs Lighthouse against the current page by reusing Playwright's Chrome instance.
 *
 * KEY: disableStorageReset=true preserves auth cookies so authenticated routes
 * remain accessible during Lighthouse's internal navigation.
 */
export async function runLighthouse(
  page: Page,
  browser: Browser,
  routePath: string,
  routeName: string,
  strategy: 'mobile' | 'desktop',
  resultsDir: string,
): Promise<LighthouseResult> {
  const url = page.url();

  // Extract CDP port from Playwright's websocket endpoint
  const wsEndpoint = browser.wsEndpoint();
  const portMatch = wsEndpoint.match(/:(\d+)\//);
  if (!portMatch) {
    throw new Error(`Cannot extract CDP port from wsEndpoint: ${wsEndpoint}`);
  }
  const port = parseInt(portMatch[1], 10);

  const isMobile = strategy === 'mobile';

  const flags = {
    port,
    output: ['json', 'html'] as const,
    logLevel: 'error' as const,
    // Preserve auth cookies — CRITICAL for authenticated routes.
    // Without this, Lighthouse clears localStorage/cookies before running,
    // which logs the user out and causes every authenticated route to 404/redirect.
    disableStorageReset: true,
  };

  const lighthouseConfig = {
    extends: 'lighthouse:default' as const,
    settings: {
      formFactor: (isMobile ? 'mobile' : 'desktop') as 'mobile' | 'desktop',
      screenEmulation: isMobile
        ? { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75 }
        : { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1 },
      throttling: isMobile
        ? {
            // Moto G Power on Slow 4G (matches the existing audit baseline)
            rttMs: 150,
            throughputKbps: 1638.4,
            cpuSlowdownMultiplier: 4,
            requestLatencyMs: 562.5,
            downloadThroughputKbps: 1474.56,
            uploadThroughputKbps: 675,
          }
        : {
            // Light desktop throttling
            rttMs: 40,
            throughputKbps: 10240,
            cpuSlowdownMultiplier: 1,
            requestLatencyMs: 0,
            downloadThroughputKbps: 0,
            uploadThroughputKbps: 0,
          },
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    },
  };

  console.log(`    Running Lighthouse (${strategy}) on ${url}...`);

  const runnerResult = await lighthouse(url, flags, lighthouseConfig);

  if (!runnerResult?.lhr) {
    throw new Error(`Lighthouse returned no results for ${routePath}`);
  }

  const lhr = runnerResult.lhr;
  const audits = lhr.audits ?? {};

  // Save HTML report
  const safeSlug = routePath.replace(/[/{}\[\]]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'root';
  const reportDir = join(resultsDir, 'lighthouse-reports');
  mkdirSync(reportDir, { recursive: true });
  const htmlReportPath = join(reportDir, `${safeSlug}_${strategy}.html`);

  if (Array.isArray(runnerResult.report)) {
    writeFileSync(htmlReportPath, runnerResult.report[1] ?? ''); // index 1 = HTML
  } else if (typeof runnerResult.report === 'string') {
    writeFileSync(htmlReportPath, runnerResult.report);
  }

  return {
    route: routePath,
    routeName,
    strategy,
    scores: {
      performance: Math.round((lhr.categories?.performance?.score ?? 0) * 100),
      accessibility: Math.round((lhr.categories?.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round((lhr.categories?.['best-practices']?.score ?? 0) * 100),
      seo: Math.round((lhr.categories?.seo?.score ?? 0) * 100),
    },
    metrics: {
      fcp: audits['first-contentful-paint']?.numericValue ?? 0,
      lcp: audits['largest-contentful-paint']?.numericValue ?? 0,
      tbt: audits['total-blocking-time']?.numericValue ?? 0,
      cls: audits['cumulative-layout-shift']?.numericValue ?? 0,
      si: audits['speed-index']?.numericValue ?? 0,
      tti: audits['interactive']?.numericValue ?? 0,
    },
    diagnostics: {
      mainThreadWork: audits['mainthread-work-breakdown']?.numericValue ?? 0,
      unusedJavaScript: extractWastedKiB(audits['unused-javascript']),
      jsExecutionTime: audits['bootup-time']?.numericValue ?? 0,
      longTasks: countAuditItems(audits['long-tasks']),
      nonCompositedAnimations: countAuditItems(audits['non-composited-animations']),
      renderBlockingSavings: audits['render-blocking-resources']?.numericValue ?? 0,
    },
    budgetViolations: [],
    htmlReportPath,
  };
}

function extractWastedKiB(audit: Record<string, unknown> | undefined): number {
  if (!audit) return 0;
  const details = audit.details as { items?: Array<{ wastedBytes?: number }> } | undefined;
  if (!details?.items) return 0;
  const total = details.items.reduce((sum, item) => sum + (item.wastedBytes ?? 0), 0);
  return Math.round(total / 1024);
}

function countAuditItems(audit: Record<string, unknown> | undefined): number {
  if (!audit) return 0;
  const details = audit.details as { items?: unknown[] } | undefined;
  return details?.items?.length ?? 0;
}
