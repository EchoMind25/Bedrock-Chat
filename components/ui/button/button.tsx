import { cn } from "@/lib/utils/cn";
import { motion } from "motion/react";
import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    | "onDrag"
    | "onDragStart"
    | "onDragEnd"
    | "onAnimationStart"
    | "onAnimationEnd"
    | "onAnimationIteration"
  > {
  /**
   * Button variant
   * @default "primary"
   */
  variant?: ButtonVariant;

  /**
   * Button size
   * @default "md"
   */
  size?: ButtonSize;

  /**
   * Loading state
   * @default false
   */
  loading?: boolean;

  /**
   * Disabled state
   */
  disabled?: boolean;

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
  ref?: Ref<HTMLButtonElement>;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover active:scale-95 shadow-md",
  secondary:
    "bg-secondary text-white hover:opacity-90 active:scale-95 shadow-md",
  danger: "bg-red-500 text-white hover:bg-red-600 active:scale-95 shadow-md",
  ghost: "bg-transparent hover:bg-muted active:scale-95",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

/**
 * Button component with variants and loading state
 * Uses React 19 ref-as-prop pattern (no forwardRef)
 * Animations via motion/react at 60fps
 */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  children,
  className = "",
  ref,
  type = "button",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={cn(
        "relative inline-flex items-center justify-center",
        "rounded-lg font-medium",
        "transition-all duration-200",
        "focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      whileHover={!isDisabled ? { scale: 1.02 } : undefined}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      aria-busy={loading}
      aria-disabled={isDisabled}
      {...props}
    >
      {loading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Spinner />
        </motion.div>
      )}
      <span className={cn(loading && "opacity-0")}>{children}</span>
    </motion.button>
  );
}

/**
 * Loading spinner component
 */
function Spinner() {
  return (
    <motion.div
      className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
      animate={{ rotate: 360 }}
      transition={{
        duration: 0.8,
        repeat: Number.POSITIVE_INFINITY,
        ease: "linear",
      }}
      aria-label="Loading"
    />
  );
}

export type { ButtonProps, ButtonVariant, ButtonSize };
