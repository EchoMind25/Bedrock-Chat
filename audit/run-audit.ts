#!/usr/bin/env tsx
/**
 * Bedrock Chat — Performance Audit Orchestrator
 *
 * DEV-ONLY. Never deployed. Collects zero user data.
 * Runs Lighthouse + memory + animation audits across all authenticated routes.
 *
 * Usage:
 *   npm run audit                          # All routes, both mobile + desktop
 *   npm run audit:mobile                   # Mobile only
 *   npm run audit:desktop                  # Desktop only
 *   npm run audit:route -- --route=/friends # Single route
 *   npm run audit:compare                  # Compare against previous run
 */

import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';

import { config } from './config.js';
import { authenticate, discoverRouteParams } from './auth.setup.js';
import { ROUTES, DEFAULT_BUDGET, type AuditRoute, type PerformanceBudget } from './routes.js';
import { runLighthouse, type LighthouseResult } from './collectors/lighthouse-collector.js';
import { captureMemory, checkForLeaks, type MemorySnapshot } from './collectors/memory-collector.js';
import { auditAnimations, type AnimationAudit } from './collectors/animation-collector.js';
import { generateReport, generateComparison } from './reporters/markdown-reporter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

const rawStrategy = args.find((a) => a.startsWith('--strategy='))?.split('=')[1];
const strategy: 'mobile' | 'desktop' | 'both' =
  rawStrategy === 'mobile' ? 'mobile' : rawStrategy === 'desktop' ? 'desktop' : 'both';

const singleRoute = args.find((a) => a.startsWith('--route='))?.split('=')[1] ?? null;
const compareMode = args.includes('--compare');
const skipLighthouse = args.includes('--skip-lighthouse');
const skipLeakCheck = args.includes('--skip-leak-check');

// ── Results directory ────────────────────────────────────────────────────────
const dateSlug = new Date().toISOString().split('T')[0];
const resultsDir = join(__dirname, 'results', dateSlug);
mkdirSync(join(resultsDir, 'screenshots'), { recursive: true });
mkdirSync(join(resultsDir, 'lighthouse-reports'), { recursive: true });

// ── Helpers ──────────────────────────────────────────────────────────────────
type ResolvedRoute = AuditRoute & { resolvedPath: string };

function resolveRoutes(
  routes: AuditRoute[],
  params: { serverId: string | null; channelId: string | null; voiceChannelId: string | null },
  hasParent: boolean,
): ResolvedRoute[] {
  return routes
    .filter((r) => {
      if (r.requiresServer && (!params.serverId || !params.channelId)) return false;
      if (r.requiresParent && !hasParent) return false;
      return true;
    })
    .map((r) => ({
      ...r,
      resolvedPath: r.path
        .replace('{serverId}', params.serverId ?? '')
        .replace('{channelId}', params.channelId ?? '')
        .replace('{voiceChannelId}', params.voiceChannelId ?? ''),
    }))
    .filter((r) => !r.resolvedPath.includes('{'));
}

function checkBudget(result: LighthouseResult, budget: PerformanceBudget): string[] {
  const v: string[] = [];
  if (result.scores.performance < budget.performanceScore)
    v.push(`Performance ${result.scores.performance} < ${budget.performanceScore} budget`);
  if (result.metrics.fcp > budget.fcp)
    v.push(`FCP ${result.metrics.fcp.toFixed(0)}ms > ${budget.fcp}ms budget`);
  if (result.metrics.lcp > budget.lcp)
    v.push(`LCP ${result.metrics.lcp.toFixed(0)}ms > ${budget.lcp}ms budget`);
  if (result.metrics.tbt > budget.tbt)
    v.push(`TBT ${result.metrics.tbt.toFixed(0)}ms > ${budget.tbt}ms budget`);
  if (result.metrics.cls > budget.cls)
    v.push(`CLS ${result.metrics.cls.toFixed(3)} > ${budget.cls} budget`);
  return v;
}

function loadHistory(): LighthouseResult[] {
  const resultsRoot = join(__dirname, 'results');
  const dirs = existsSync(resultsRoot) ? readdirSync(resultsRoot) : [];
  // Find the most recent date directory that isn't today
  const prevDir = dirs
    .filter((d: string) => d !== dateSlug && /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort()
    .reverse()[0];

  if (!prevDir) return [];

  const histPath = join(__dirname, 'results', prevDir, 'history.json');
  if (!existsSync(histPath)) return [];

  try {
    const data = JSON.parse(readFileSync(histPath, 'utf-8'));
    return data.lighthouse ?? [];
  } catch {
    return [];
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(chalk.bold('\n Bedrock Chat Performance Audit\n'));
  console.log(`  Target:   ${config.baseUrl}`);
  console.log(`  Strategy: ${strategy}`);
  console.log(`  Output:   ${resultsDir}\n`);

  // Launch Chromium with remote debugging so Lighthouse can connect
  const browser = await chromium.launch({
    headless: true,
    args: [
      `--remote-debugging-port=${config.cdpPort}`,
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1350, height: 940 },
  });

  const page = await context.newPage();

  const lighthouseResults: LighthouseResult[] = [];
  const memorySnapshots: MemorySnapshot[] = [];
  const animationAudits: AnimationAudit[] = [];
  let leakSummary: string | undefined;

  try {
    // ── Step 1: Authenticate ────────────────────────────────────────────────
    const authSpinner = ora('Authenticating...').start();
    await authenticate(page);
    authSpinner.succeed('Authenticated');

    // ── Step 2: Discover route params ───────────────────────────────────────
    const discoverySpinner = ora('Discovering route parameters...').start();
    const params = await discoverRouteParams(page);
    discoverySpinner.succeed(
      `Routes discovered — server: ${params.serverId ?? 'none'}, channel: ${params.channelId ?? 'none'}`,
    );

    // ── Step 3: Build route list ────────────────────────────────────────────
    const baseRoutes = singleRoute
      ? ROUTES.filter((r) => r.path === singleRoute)
      : ROUTES;

    const routesToAudit = resolveRoutes(baseRoutes, params, !!config.parentEmail);

    if (routesToAudit.length === 0) {
      console.log(chalk.yellow('\nNo routes matched — check --route flag or route discovery.\n'));
      return;
    }

    console.log(chalk.cyan(`\nAuditing ${routesToAudit.length} routes...\n`));

    // ── Step 4: Per-route audit ─────────────────────────────────────────────
    for (let i = 0; i < routesToAudit.length; i++) {
      const route = routesToAudit[i];
      const label = `[${i + 1}/${routesToAudit.length}] ${route.name}`;
      const spinner = ora(label).start();

      try {
        // Navigate
        await page.goto(`${config.baseUrl}${route.resolvedPath}`, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });

        // Wait for content
        if (route.readySelector) {
          await page
            .waitForSelector(route.readySelector, { timeout: 12000 })
            .catch(() => {
              spinner.warn(`${label} — ready selector not found, continuing`);
            });
        }

        // Let animations settle and lazy components load
        await page.waitForTimeout(2500);

        // Screenshot
        const screenshotSlug = route.resolvedPath.replace(/\//g, '_').replace(/^_/, '') || 'root';
        await page.screenshot({
          path: join(resultsDir, 'screenshots', `${screenshotSlug}.png`),
          fullPage: true,
        });

        // Memory snapshot
        const mem = await captureMemory(page, route.resolvedPath);
        memorySnapshots.push(mem);

        // Animation audit
        const anim = await auditAnimations(page, route.resolvedPath);
        animationAudits.push(anim);

        // Lighthouse
        if (!skipLighthouse) {
          const strategies: Array<'mobile' | 'desktop'> =
            strategy === 'both' ? ['mobile', 'desktop'] : [strategy];

          for (const strat of strategies) {
            try {
              const lhResult = await runLighthouse(
                page, browser, route.resolvedPath, route.name, strat, resultsDir,
              );

              const budget = { ...DEFAULT_BUDGET, ...(route.budget ?? {}) };
              lhResult.budgetViolations = checkBudget(lhResult, budget);

              lighthouseResults.push(lhResult);

              const scoreColor =
                lhResult.scores.performance >= 90
                  ? chalk.green
                  : lhResult.scores.performance >= 70
                    ? chalk.yellow
                    : chalk.red;

              spinner.text =
                `${label} (${strat}) — ` +
                `${scoreColor(String(lhResult.scores.performance) + '/100')} ` +
                `LCP:${(lhResult.metrics.lcp / 1000).toFixed(1)}s ` +
                `TBT:${Math.round(lhResult.metrics.tbt)}ms`;

              if (lhResult.budgetViolations.length > 0) {
                lhResult.budgetViolations.forEach((v) =>
                  console.log(`\n    ${chalk.red('❌')} ${v}`),
                );
              }
            } catch (lhErr) {
              console.log(`\n    ${chalk.red('Lighthouse failed:')} ${lhErr}`);
            }
          }
        }

        spinner.succeed(
          `${route.name} — heap:${mem.jsHeapUsedMB}MB dom:${mem.domNodes} anim:${anim.nonComposited.length}nc`,
        );
      } catch (err) {
        spinner.fail(`${route.name} — ${err}`);
      }
    }

    // ── Step 5: Memory leak detection ───────────────────────────────────────
    if (!skipLeakCheck) {
      const leakSpinner = ora('Checking for memory leaks...').start();
      const coreRoutes = routesToAudit
        .filter((r) => r.category === 'core')
        .map((r) => r.resolvedPath)
        .slice(0, 4);

      if (coreRoutes.length >= 2) {
        const leak = await checkForLeaks(page, coreRoutes);
        leakSummary = leak.leakDetected
          ? `⚠️ ${leak.summary} — heap: ${leak.heapHistory.map((h) => `${h}MB`).join(' → ')}`
          : `✅ ${leak.summary}`;
        leak.leakDetected
          ? leakSpinner.warn(leakSummary)
          : leakSpinner.succeed(leakSummary);
      } else {
        leakSpinner.info('Not enough core routes to run leak check.');
      }
    }

    // ── Step 6: Generate report ─────────────────────────────────────────────
    const reportSpinner = ora('Generating report...').start();

    const reportMd = generateReport(
      lighthouseResults, memorySnapshots, animationAudits, strategy, leakSummary,
    );
    const reportPath = join(resultsDir, 'AUDIT_REPORT.md');
    writeFileSync(reportPath, reportMd);

    // Save raw data for future comparison
    writeFileSync(
      join(resultsDir, 'history.json'),
      JSON.stringify(
        { date: new Date().toISOString(), lighthouse: lighthouseResults, memory: memorySnapshots },
        null,
        2,
      ),
    );

    reportSpinner.succeed(`Report saved: ${reportPath}`);

    // ── Step 7: Comparison (if requested) ──────────────────────────────────
    if (compareMode && lighthouseResults.length > 0) {
      const previous = loadHistory();
      if (previous.length > 0) {
        const compMd = generateComparison(previous, lighthouseResults);
        const compPath = join(resultsDir, 'COMPARISON.md');
        writeFileSync(compPath, compMd);
        console.log(chalk.green(`Comparison saved: ${compPath}`));
      } else {
        console.log(chalk.yellow('No previous run found for comparison.'));
      }
    }

    // ── Summary ─────────────────────────────────────────────────────────────
    console.log(chalk.bold('\n Summary\n'));

    if (lighthouseResults.length > 0) {
      const mobileScores = lighthouseResults
        .filter((r) => r.strategy === 'mobile')
        .map((r) => r.scores.performance);

      if (mobileScores.length > 0) {
        const avg = Math.round(mobileScores.reduce((a, b) => a + b, 0) / mobileScores.length);
        const min = Math.min(...mobileScores);
        const worstRoute = lighthouseResults
          .filter((r) => r.strategy === 'mobile')
          .sort((a, b) => a.scores.performance - b.scores.performance)[0];

        console.log(`  Mobile avg:  ${avg}/100`);
        console.log(`  Mobile min:  ${min}/100 (${worstRoute.routeName})`);
      }

      const totalViolations = lighthouseResults.reduce((s, r) => s + r.budgetViolations.length, 0);
      if (totalViolations > 0) {
        console.log(chalk.red(`\n  ${totalViolations} budget violation(s) — see ${reportPath}\n`));
      } else {
        console.log(chalk.green('\n  All routes within performance budget\n'));
      }
    }

    console.log(`  Full report: ${reportPath}`);
    console.log(`  Screenshots: ${join(resultsDir, 'screenshots')}`);
    console.log(`  Lighthouse:  ${join(resultsDir, 'lighthouse-reports')}\n`);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

main().catch((err) => {
  console.error(chalk.red(`\nAudit crashed: ${err}\n`));
  process.exit(1);
});
