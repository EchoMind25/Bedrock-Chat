import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "@/lib/utils/cn";

type GlassVariant = "light" | "medium" | "strong" | "liquid" | "liquid-elevated";
type GlassBorder = "none" | "light" | "medium" | "strong" | "liquid";

interface GlassProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Glass blur intensity
   * @default "medium"
   */
  variant?: GlassVariant;

  /**
   * Border style
   * @default "light"
   */
  border?: GlassBorder;

  /**
   * Additional classes
   */
  className?: string;

  /**
   * Children elements
   */
  children?: ReactNode;

  /**
   * Ref - React 19 passes refs as props (no forwardRef needed)
   */
  ref?: Ref<HTMLDivElement>;
}

const variantClasses: Record<GlassVariant, string> = {
  light: "backdrop-blur-sm bg-glass-light/50",
  medium: "backdrop-blur-md bg-glass-light/70",
  strong: "backdrop-blur-xl bg-glass-light/90",
  liquid: "liquid-glass",
  "liquid-elevated": "liquid-glass-elevated",
};

const borderClasses: Record<GlassBorder, string> = {
  none: "border-0",
  light: "border border-border/30",
  medium: "border border-border/50",
  strong: "border-2 border-border/70",
  liquid: "liquid-border",
};

/**
 * Glass component with blur and border variants
 * Uses React 19 ref-as-prop pattern (no forwardRef)
 */
export function Glass({
  variant = "medium",
  border = "light",
  className = "",
  children,
  ref,
  ...props
}: GlassProps) {
  const variantClass = variantClasses[variant];
  const borderClass = borderClasses[border];
  const isLiquid = variant === "liquid" || variant === "liquid-elevated";

  return (
    <div
      ref={ref}
      className={cn(
        variantClass,
        borderClass,
        "rounded-lg transition-all duration-300",
        !isLiquid && "shadow-glass dark:bg-glass-dark/70 dark:border-border-dark/50",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Glass card variant with padding
 */
export function GlassCard({
  variant = "medium",
  border = "light",
  className = "",
  children,
  ref,
  ...props
}: GlassProps) {
  return (
    <Glass
      variant={variant}
      border={border}
      className={cn("p-6", className)}
      ref={ref}
      {...props}
    >
      {children}
    </Glass>
  );
}

/**
 * Liquid glass card with enhanced depth and glow
 */
export function LiquidGlassCard({
  className = "",
  children,
  ref,
  ...props
}: Omit<GlassProps, "variant" | "border">) {
  return (
    <div
      ref={ref}
      className={cn("glass-card rounded-xl p-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Glass panel variant with stronger effect
 */
export function GlassPanel({
  border = "medium",
  className = "",
  children,
  ref,
  ...props
}: Omit<GlassProps, "variant">) {
  return (
    <Glass
      variant="strong"
      border={border}
      className={cn("p-8", className)}
      ref={ref}
      {...props}
    >
      {children}
    </Glass>
  );
}

export type { GlassProps, GlassVariant, GlassBorder };
