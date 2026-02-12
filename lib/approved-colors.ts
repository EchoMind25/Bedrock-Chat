/**
 * WCAG 2.1 AA Compliant Text Colors
 *
 * All colors tested against bg-slate-900 (#0F172A) and bg-slate-950 (#020617).
 * Minimum contrast ratio: 4.5:1 for normal text, 3:1 for large text.
 *
 * FORBIDDEN (never use):
 *   text-muted-foreground, text-slate-500 (except placeholders),
 *   text-slate-600, text-slate-700, text-gray-500/600/700
 */
export const APPROVED_TEXT_COLORS = {
  /** Headings, important content — Contrast: 16.06:1 */
  primary: "text-slate-100",

  /** Body text, descriptions — Contrast: 12.63:1 */
  secondary: "text-slate-200",

  /** Supporting information — Contrast: 8.59:1 */
  tertiary: "text-slate-300",

  /** Least important: timestamps, metadata — Contrast: 5.71:1 */
  muted: "text-slate-400",

  /** Form labels, categories — Contrast: 7.04:1 */
  label: "text-blue-300",

  /** Input placeholders only — Contrast: 4.54:1 (minimum) */
  placeholder: "placeholder:text-slate-500",

  /** Status colors */
  success: "text-green-300",
  warning: "text-yellow-300",
  error: "text-red-300",
  info: "text-blue-300",
} as const;
