import { type Page } from '@playwright/test';

export interface AnimationViolation {
  selector: string;
  property: string;
}

export interface AnimationAudit {
  route: string;
  totalAnimatedElements: number;
  nonComposited: AnimationViolation[];
  compositedCount: number;
  recommendations: string[];
}

/**
 * Detects non-composited animations by inspecting Web Animations API and CSS transitions.
 *
 * Composited = only transforms (translate, scale, rotate) and opacity — GPU-accelerated.
 * Non-composited = layout/paint properties (width, height, top, background-color, etc.)
 * These cause main-thread work and degrade animation FPS.
 */
export async function auditAnimations(page: Page, route: string): Promise<AnimationAudit> {
  const result = await page.evaluate(() => {
    const NON_COMPOSITED = new Set([
      'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
      'top', 'right', 'bottom', 'left',
      'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'border-width', 'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
      'border-radius',
      'font-size', 'line-height', 'letter-spacing',
      'box-shadow', 'text-shadow',
      'background-color', 'background-position', 'background-size',
      'clip-path', 'clip',
      'color', 'fill', 'stroke',
      'flex-basis', 'grid-template-columns', 'grid-template-rows',
    ]);

    const camelToKebab = (s: string) =>
      s.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);

    const violations: Array<{ selector: string; property: string }> = [];
    let compositedCount = 0;
    let totalAnimated = 0;

    document.querySelectorAll('*').forEach((el) => {
      const anims = el.getAnimations();
      if (anims.length === 0) return;

      totalAnimated++;
      let hasViolation = false;

      anims.forEach((anim) => {
        const effect = anim.effect;
        if (!(effect instanceof KeyframeEffect)) return;

        const kfs = effect.getKeyframes();
        kfs.forEach((kf) => {
          Object.keys(kf).forEach((prop) => {
            if (['offset', 'computedOffset', 'easing', 'composite'].includes(prop)) return;
            const kebab = camelToKebab(prop);
            if (NON_COMPOSITED.has(kebab)) {
              hasViolation = true;
              const id = el.id ? `#${el.id}` : '';
              const cls =
                el.className && typeof el.className === 'string'
                  ? `.${el.className.split(' ').filter(Boolean).slice(0, 2).join('.')}`
                  : '';
              const tag = el.tagName.toLowerCase();
              violations.push({ selector: `${tag}${id}${cls}`, property: kebab });
            }
          });
        });
      });

      if (!hasViolation) compositedCount++;
    });

    return { totalAnimated, violations, compositedCount };
  });

  // Build recommendations from violation patterns
  const recommendations: string[] = [];

  const propFreq = new Map<string, number>();
  result.violations.forEach((v) => {
    propFreq.set(v.property, (propFreq.get(v.property) ?? 0) + 1);
  });

  propFreq.forEach((count, prop) => {
    if (count >= 2) {
      const suggestion = prop.includes('height') || prop.includes('width')
        ? `Use scaleY/scaleX transform instead of ${prop}`
        : prop.includes('top') || prop.includes('left') || prop.includes('margin')
          ? `Use translateY/translateX transform instead of ${prop}`
          : prop === 'background-color' || prop === 'color'
            ? `Avoid animating ${prop} — use opacity on a pseudo-element overlay instead`
            : `Replace ${prop} animation with composited equivalent (transform/opacity)`;

      recommendations.push(`${count}x "${prop}": ${suggestion}`);
    }
  });

  if (result.violations.length > 15) {
    recommendations.unshift(
      `${result.violations.length} non-composited animations detected. Add will-change: transform or use transform/opacity exclusively.`,
    );
  }

  return {
    route,
    totalAnimatedElements: result.totalAnimated,
    nonComposited: result.violations,
    compositedCount: result.compositedCount,
    recommendations,
  };
}
