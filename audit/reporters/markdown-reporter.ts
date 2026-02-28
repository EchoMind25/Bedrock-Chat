import { type LighthouseResult } from '../collectors/lighthouse-collector.js';
import { type MemorySnapshot } from '../collectors/memory-collector.js';
import { type AnimationAudit } from '../collectors/animation-collector.js';
import { type PerformanceBudget, DEFAULT_BUDGET } from '../routes.js';

function scoreIcon(score: number): string {
  if (score >= 90) return '🟢';
  if (score >= 70) return '🟡';
  return '🔴';
}

function msIcon(ms: number, warnAt: number, errorAt: number): string {
  if (ms <= warnAt) return '🟢';
  if (ms <= errorAt) return '🟡';
  return '🔴';
}

function fmt(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}

export function generateReport(
  lighthouse: LighthouseResult[],
  memory: MemorySnapshot[],
  animations: AnimationAudit[],
  strategy: string,
  leakSummary?: string,
): string {
  const now = new Date().toISOString();
  const mobileResults = lighthouse.filter((r) => r.strategy === 'mobile');
  const desktopResults = lighthouse.filter((r) => r.strategy === 'desktop');
  const uniqueRoutes = new Set(lighthouse.map((r) => r.route)).size;

  let md = `# Bedrock Chat — Performance Audit Report\n\n`;
  md += `**Generated:** ${now}  \n`;
  md += `**Strategy:** ${strategy}  \n`;
  md += `**Routes audited:** ${uniqueRoutes}  \n\n`;
  md += `---\n\n`;

  // ── Executive Summary ──────────────────────────────────────────────────────
  md += `## Executive Summary\n\n`;

  if (mobileResults.length > 0) {
    const scores = mobileResults.map((r) => r.scores.performance);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const sorted = [...mobileResults].sort((a, b) => a.scores.performance - b.scores.performance);
    const worst = sorted[0];
    const best = sorted[sorted.length - 1];
    const violations = mobileResults.reduce((s, r) => s + r.budgetViolations.length, 0);

    md += `### Mobile (Moto G Power / Slow 4G)\n\n`;
    md += `| Metric | Value |\n|--------|-------|\n`;
    md += `| Average performance score | ${scoreIcon(avg)} **${avg}/100** |\n`;
    md += `| Best route | ${best.routeName} (${best.scores.performance}) |\n`;
    md += `| Worst route | ${worst.routeName} (${worst.scores.performance}) |\n`;
    md += `| Budget violations | ${violations > 0 ? `❌ ${violations}` : '✅ 0'} |\n\n`;
  }

  if (desktopResults.length > 0) {
    const scores = desktopResults.map((r) => r.scores.performance);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const violations = desktopResults.reduce((s, r) => s + r.budgetViolations.length, 0);

    md += `### Desktop\n\n`;
    md += `| Metric | Value |\n|--------|-------|\n`;
    md += `| Average performance score | ${scoreIcon(avg)} **${avg}/100** |\n`;
    md += `| Budget violations | ${violations > 0 ? `❌ ${violations}` : '✅ 0'} |\n\n`;
  }

  if (leakSummary) {
    md += `### Memory Leak Check\n\n${leakSummary}\n\n`;
  }

  md += `---\n\n`;

  // ── Per-route Scorecard ────────────────────────────────────────────────────
  md += `## Route Scorecard\n\n`;

  const categories = ['public', 'core', 'social', 'voice', 'family'] as const;
  const categoryLabels: Record<string, string> = {
    public: 'Public Routes',
    core: 'Core App',
    social: 'Social',
    voice: 'Voice',
    family: 'Family / Parental Controls',
  };

  // Group results by route name for easy lookup
  const byRoute = new Map<string, { mobile?: LighthouseResult; desktop?: LighthouseResult }>();
  lighthouse.forEach((r) => {
    const existing = byRoute.get(r.routeName) ?? {};
    existing[r.strategy] = r;
    byRoute.set(r.routeName, existing);
  });

  // Display mobile table (primary) then desktop supplement
  const strategiesToShow = strategy === 'desktop' ? ['desktop'] : ['mobile'];
  if (strategy === 'both') strategiesToShow.push('desktop');

  for (const cat of categories) {
    const catResults = mobileResults.filter((r) => {
      // Infer category from route name keywords
      if (cat === 'public') return r.routeName.includes('Landing') || r.routeName.includes('Login');
      if (cat === 'core') return r.routeName.includes('Friends') || r.routeName.includes('Chat') || r.routeName.includes('Server');
      if (cat === 'social') return r.routeName.includes('DM') || r.routeName.includes('Direct') || r.routeName.includes('Notification');
      if (cat === 'voice') return r.routeName.includes('Voice');
      if (cat === 'family') return r.routeName.includes('Family') || r.routeName.includes('Parent');
      return false;
    });

    // For desktop-only mode, check desktop results
    const fallbackResults =
      catResults.length === 0
        ? desktopResults.filter((r) => {
            if (cat === 'public') return r.routeName.includes('Landing') || r.routeName.includes('Login');
            if (cat === 'core') return r.routeName.includes('Friends') || r.routeName.includes('Chat');
            if (cat === 'social') return r.routeName.includes('DM') || r.routeName.includes('Notification');
            if (cat === 'voice') return r.routeName.includes('Voice');
            if (cat === 'family') return r.routeName.includes('Family') || r.routeName.includes('Parent');
            return false;
          })
        : catResults;

    if (fallbackResults.length === 0) continue;

    md += `### ${categoryLabels[cat]}\n\n`;
    md += `| Route | Perf | A11y | FCP | LCP | TBT | CLS | Heap | DOM Nodes |\n`;
    md += `|-------|------|------|-----|-----|-----|-----|------|----------|\n`;

    for (const r of fallbackResults) {
      const mem = memory.find((m) => m.route === r.route);
      const heapStr = mem
        ? `${mem.jsHeapUsedMB > 50 ? '🔴' : mem.jsHeapUsedMB > 30 ? '🟡' : '🟢'} ${mem.jsHeapUsedMB}MB`
        : '—';
      const domStr = mem ? String(mem.domNodes) : '—';

      md +=
        `| ${r.routeName} ` +
        `| ${scoreIcon(r.scores.performance)} ${r.scores.performance} ` +
        `| ${r.scores.accessibility} ` +
        `| ${msIcon(r.metrics.fcp, 1800, 3000)} ${fmt(r.metrics.fcp)} ` +
        `| ${msIcon(r.metrics.lcp, 2500, 4000)} ${fmt(r.metrics.lcp)} ` +
        `| ${msIcon(r.metrics.tbt, 300, 600)} ${fmt(r.metrics.tbt)} ` +
        `| ${r.metrics.cls <= 0.1 ? '🟢' : r.metrics.cls <= 0.25 ? '🟡' : '🔴'} ${r.metrics.cls.toFixed(3)} ` +
        `| ${heapStr} ` +
        `| ${domStr} |\n`;
    }
    md += `\n`;
  }

  md += `---\n\n`;

  // ── Diagnostics Table ─────────────────────────────────────────────────────
  md += `## Diagnostics\n\n`;
  md += `| Route | Strategy | Main Thread | Unused JS | Long Tasks | Non-Composited Anims | Render Blocking |\n`;
  md += `|-------|----------|-------------|-----------|------------|---------------------|------------------|\n`;

  lighthouse.forEach((r) => {
    const d = r.diagnostics;
    md +=
      `| ${r.routeName} | ${r.strategy} ` +
      `| ${msIcon(d.mainThreadWork, 2000, 4000)} ${fmt(d.mainThreadWork)} ` +
      `| ${d.unusedJavaScript > 100 ? '🔴' : d.unusedJavaScript > 50 ? '🟡' : '🟢'} ${d.unusedJavaScript}KiB ` +
      `| ${d.longTasks > 5 ? '🔴' : d.longTasks > 2 ? '🟡' : '🟢'} ${d.longTasks} ` +
      `| ${d.nonCompositedAnimations > 20 ? '🔴' : d.nonCompositedAnimations > 10 ? '🟡' : '🟢'} ${d.nonCompositedAnimations} ` +
      `| ${d.renderBlockingSavings > 200 ? '🔴' : d.renderBlockingSavings > 100 ? '🟡' : '🟢'} ${fmt(d.renderBlockingSavings)} |\n`;
  });
  md += `\n---\n\n`;

  // ── Budget Violations ──────────────────────────────────────────────────────
  const violated = lighthouse.filter((r) => r.budgetViolations.length > 0);
  if (violated.length > 0) {
    md += `## Budget Violations\n\n`;
    for (const r of violated) {
      md += `### ${r.routeName} (${r.strategy})\n\n`;
      r.budgetViolations.forEach((v) => {
        md += `- ❌ ${v}\n`;
      });
      md += `\n`;
    }
    md += `---\n\n`;
  }

  // ── Animation Issues ───────────────────────────────────────────────────────
  const animIssues = animations.filter((a) => a.nonComposited.length > 0);
  if (animIssues.length > 0) {
    md += `## Non-Composited Animation Violations\n\n`;

    for (const a of animIssues) {
      md += `### ${a.route} — ${a.nonComposited.length} violations\n\n`;

      if (a.recommendations.length > 0) {
        md += `**Recommendations:**\n`;
        a.recommendations.forEach((rec) => {
          md += `> ${rec}\n`;
        });
        md += `\n`;
      }

      md += `| Element | Property |\n|---------|----------|\n`;
      const deduped = [...new Map(a.nonComposited.map((v) => [`${v.selector}:${v.property}`, v])).values()];
      deduped.slice(0, 25).forEach((v) => {
        md += `| \`${v.selector.slice(0, 60)}\` | \`${v.property}\` |\n`;
      });
      if (deduped.length > 25) {
        md += `| *(${deduped.length - 25} more — see HTML reports)* | |\n`;
      }
      md += `\n`;
    }

    md += `---\n\n`;
  }

  // ── Memory Analysis ────────────────────────────────────────────────────────
  if (memory.length > 0) {
    md += `## Memory Analysis\n\n`;
    md += `| Route | JS Heap Used | JS Heap Total | DOM Nodes |\n`;
    md += `|-------|-------------|---------------|----------|\n`;

    memory.forEach((m) => {
      const heapIcon =
        m.jsHeapUsedMB > 80 ? '🔴' : m.jsHeapUsedMB > 50 ? '🟡' : '🟢';
      const domIcon = m.domNodes > 1500 ? '🔴' : m.domNodes > 800 ? '🟡' : '🟢';
      md += `| ${m.route} | ${heapIcon} ${m.jsHeapUsedMB}MB | ${m.jsHeapTotalMB}MB | ${domIcon} ${m.domNodes} |\n`;
    });
    md += `\n---\n\n`;
  }

  // ── Recommendations ────────────────────────────────────────────────────────
  md += `## Top Recommendations\n\n`;
  md += `*Prioritized by estimated performance impact.*\n\n`;

  const recs: string[] = [];

  // LCP > 2.5s
  const highLCP = [...mobileResults, ...desktopResults]
    .filter((r) => r.metrics.lcp > 2500)
    .sort((a, b) => b.metrics.lcp - a.metrics.lcp);
  if (highLCP.length > 0) {
    const worst = highLCP[0];
    recs.push(
      `**LCP exceeds 2.5s on ${highLCP.length} route(s).** Worst: ${worst.routeName} at ` +
        `${(worst.metrics.lcp / 1000).toFixed(1)}s (${worst.strategy}). ` +
        `Likely causes: undeferred Three.js scene, large hero image without \`priority\`, ` +
        `or render-blocking JS. Ensure the LCP element is text or a \`<Image priority>\`.`,
    );
  }

  // TBT > 300ms
  const highTBT = [...mobileResults, ...desktopResults]
    .filter((r) => r.metrics.tbt > 300)
    .sort((a, b) => b.metrics.tbt - a.metrics.tbt);
  if (highTBT.length > 0) {
    const worst = highTBT[0];
    recs.push(
      `**TBT exceeds 300ms on ${highTBT.length} route(s).** Worst: ${worst.routeName} at ` +
        `${worst.metrics.tbt.toFixed(0)}ms (${worst.strategy}). ` +
        `Code-split heavy imports (LiveKit, Three.js, Supabase Realtime) behind \`React.lazy()\`. ` +
        `Use \`requestIdleCallback\` for non-critical initialisation.`,
    );
  }

  // Unused JS > 100KiB
  const highUnused = lighthouse
    .filter((r) => r.diagnostics.unusedJavaScript > 100)
    .sort((a, b) => b.diagnostics.unusedJavaScript - a.diagnostics.unusedJavaScript);
  if (highUnused.length > 0) {
    recs.push(
      `**Unused JS > 100KiB on ${highUnused.length} route(s).** Worst: ` +
        `${highUnused[0].routeName} (${highUnused[0].diagnostics.unusedJavaScript}KiB). ` +
        `Audit barrel exports — re-exporting from index files pulls in entire modules. ` +
        `Use named imports from specific subpaths (e.g. \`motion/react\` not \`motion\`).`,
    );
  }

  // High memory
  const highMem = memory.filter((m) => m.jsHeapUsedMB > 50);
  if (highMem.length > 0) {
    recs.push(
      `**JS heap > 50MB on ${highMem.length} route(s).** Worst: ${highMem[0].route} at ` +
        `${highMem[0].jsHeapUsedMB}MB. ` +
        `Check for undisposed Three.js geometries/materials, uncleared Supabase subscriptions, ` +
        `or Zustand store accumulation (messages growing without pruning).`,
    );
  }

  // Non-composited animations
  const totalNC = animations.reduce((s, a) => s + a.nonComposited.length, 0);
  if (totalNC > 10) {
    recs.push(
      `**${totalNC} non-composited animations across ${animIssues.length} route(s).** ` +
        `Replace layout-triggering properties (height, top, background-color) with ` +
        `transform/opacity. In Motion 12.x use \`scaleY\` instead of \`height\`, ` +
        `\`translateY\` instead of \`top\`. Add \`viewport={{ once: true }}\` on scroll animations.`,
    );
  }

  // Render blocking
  const highRB = lighthouse
    .filter((r) => r.diagnostics.renderBlockingSavings > 150)
    .sort((a, b) => b.diagnostics.renderBlockingSavings - a.diagnostics.renderBlockingSavings);
  if (highRB.length > 0) {
    recs.push(
      `**Render-blocking resources savings of ${highRB[0].diagnostics.renderBlockingSavings.toFixed(0)}ms ` +
        `on ${highRB.length} route(s).** Likely a CSS file or font. ` +
        `Preload critical fonts with \`<link rel="preload">\`, inline critical CSS, ` +
        `or defer non-critical stylesheets.`,
    );
  }

  if (recs.length === 0) {
    md += `All routes are within performance budgets. Great work! 🎉\n\n`;
  } else {
    recs.forEach((rec, i) => {
      md += `${i + 1}. ${rec}\n\n`;
    });
  }

  md += `---\n\n`;
  md += `*Report generated by the Bedrock Chat DEV-ONLY audit tooling.*  \n`;
  md += `*HTML Lighthouse reports are in \`results/lighthouse-reports/\`.*\n`;

  return md;
}

/**
 * Generates a brief comparison summary between two audit runs.
 */
export function generateComparison(
  previous: LighthouseResult[],
  current: LighthouseResult[],
): string {
  let md = `# Audit Comparison\n\n`;
  md += `| Route | Strategy | Previous | Current | Delta |\n`;
  md += `|-------|----------|----------|---------|-------|\n`;

  current.forEach((cur) => {
    const prev = previous.find((p) => p.route === cur.route && p.strategy === cur.strategy);
    if (!prev) {
      md += `| ${cur.routeName} | ${cur.strategy} | — | ${cur.scores.performance} | *new* |\n`;
      return;
    }
    const delta = cur.scores.performance - prev.scores.performance;
    const deltaStr = delta > 0 ? `+${delta} 🟢` : delta < 0 ? `${delta} 🔴` : `0 ─`;
    md += `| ${cur.routeName} | ${cur.strategy} | ${prev.scores.performance} | ${cur.scores.performance} | ${deltaStr} |\n`;
  });

  return md;
}
