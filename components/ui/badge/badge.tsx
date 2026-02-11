import { cn } from "@/lib/utils/cn";
import { motion } from "motion/react";
import type { HTMLAttributes, ReactNode, Ref } from "react";

type BadgeVariant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "outline";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Badge variant
   * @default "default"
   */
  variant?: BadgeVariant;

  /**
   * Enable pulse animation
   * @default false
   */
  pulse?: boolean;

  /**
   * Children elements
   */
  children?: ReactNode;

  /**
   * Additional classes
   */
  className?: string;

  /**
   * Ref - React 19 passes refs as props (no forwardRef needed)
   */
  ref?: Ref<HTMLSpanElement>;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary text-white",
  secondary: "bg-secondary text-white",
  success: "bg-green-500 text-white",
  warning: "bg-yellow-500 text-white",
  danger: "bg-red-500 text-white",
  outline: "border border-border text-foreground bg-transparent",
};

/**
 * Badge component with variants and optional pulse animation
 * Uses React 19 ref-as-prop pattern (no forwardRef)
 */
export function Badge({
  variant = "default",
  pulse = false,
  children,
  className = "",
  ref,
  ...props
}: BadgeProps) {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center",
        "px-2.5 py-0.5 rounded-full",
        "text-xs font-semibold",
        "transition-all duration-200",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {pulse && (
        <motion.span
          className="relative mr-1.5 flex h-2 w-2"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
        >
          <motion.span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75",
              variant === "success" && "bg-green-400",
              variant === "warning" && "bg-yellow-400",
              variant === "danger" && "bg-red-400",
              variant === "primary" && "bg-blue-400",
              variant === "default" && "bg-gray-400"
            )}
            animate={{
              scale: [1, 1.5],
              opacity: [0.75, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeOut",
            }}
          />
          <span
            className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              variant === "success" && "bg-green-500",
              variant === "warning" && "bg-yellow-500",
              variant === "danger" && "bg-red-500",
              variant === "primary" && "bg-blue-500",
              variant === "default" && "bg-gray-500"
            )}
          />
        </motion.span>
      )}
      {children}
    </span>
  );
}

/**
 * Notification badge (dot style)
 */
interface NotificationBadgeProps {
  /**
   * Count to display (if > 0)
   */
  count?: number;

  /**
   * Max count to display before showing "+"
   */
  max?: number;

  /**
   * Show badge even with 0 count
   */
  showZero?: boolean;

  /**
   * Variant
   */
  variant?: Extract<BadgeVariant, "primary" | "danger" | "warning">;

  /**
   * Additional classes
   */
  className?: string;
}

export function NotificationBadge({
  count = 0,
  max = 99,
  showZero = false,
  variant = "danger",
  className = "",
}: NotificationBadgeProps) {
  if (count === 0 && !showZero) {
    return null;
  }

  const displayCount = count > max ? `${max}+` : count;

  return (
    <motion.span
      className={cn(
        "absolute -top-1 -right-1",
        "inline-flex items-center justify-center",
        "min-w-5 h-5 px-1 rounded-full",
        "text-xs font-bold text-white",
        "ring-2 ring-background",
        variantClasses[variant],
        className
      )}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 25,
      }}
    >
      {displayCount}
    </motion.span>
  );
}

export type { BadgeProps, BadgeVariant, NotificationBadgeProps };
