"use client";

import { cn } from "@/lib/utils/cn";
import { motion } from "motion/react";
import type { InputHTMLAttributes, Ref } from "react";

interface ToggleProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "ref" | "size"> {
  /**
   * Label text
   */
  label?: string;

  /**
   * Toggle size
   * @default "md"
   */
  size?: "sm" | "md" | "lg";

  /**
   * Checked state
   */
  checked?: boolean;

  /**
   * Disabled state
   */
  disabled?: boolean;

  /**
   * Additional classes
   */
  className?: string;

  /**
   * Ref - React 19 passes refs as props (no forwardRef needed)
   */
  ref?: Ref<HTMLInputElement>;
}

const sizeClasses = {
  sm: {
    container: "w-9 h-5",
    thumb: "w-3.5 h-3.5",
    translate: 16,
  },
  md: {
    container: "w-11 h-6",
    thumb: "w-4 h-4",
    translate: 20,
  },
  lg: {
    container: "w-14 h-7",
    thumb: "w-5 h-5",
    translate: 28,
  },
};

/**
 * Toggle component with liquid fill animation
 * Uses React 19 ref-as-prop pattern (no forwardRef)
 */
export function Toggle({
  label,
  size = "md",
  checked = false,
  disabled = false,
  className = "",
  ref,
  onChange,
  ...props
}: ToggleProps) {
  const sizes = sizeClasses[size];

  return (
    <label
      className={cn(
        "inline-flex items-center gap-3",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className
      )}
    >
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="sr-only"
        aria-checked={checked}
        aria-label={label || "Toggle"}
        {...props}
      />

      <div className="relative">
        {/* Background container */}
        <motion.div
          className={cn(
            "relative rounded-full transition-colors duration-200",
            sizes.container,
            checked
              ? "bg-primary"
              : "bg-muted border-2 border-border dark:border-border-dark"
          )}
          animate={{
            backgroundColor: checked
              ? "oklch(0.65 0.25 265)"
              : "oklch(0.92 0.02 285)",
          }}
          transition={{ duration: 0.2 }}
        >
          {/* Liquid fill effect */}
          <motion.div
            className="absolute inset-0 rounded-full bg-primary overflow-hidden"
            initial={false}
            animate={{
              scale: checked ? 1 : 0,
              opacity: checked ? 1 : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary via-blue-500 to-primary"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            />
          </motion.div>

          {/* Thumb */}
          <motion.div
            className={cn(
              "absolute top-1 left-1 rounded-full bg-white shadow-md",
              sizes.thumb
            )}
            animate={{
              x: checked ? sizes.translate : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
            }}
          />
        </motion.div>
      </div>

      {label && (
        <span className="text-sm font-medium select-none text-slate-200">
          {label}
        </span>
      )}
    </label>
  );
}

/**
 * Toggle group component for managing multiple toggles
 */
interface ToggleGroupProps {
  /**
   * Toggle items
   */
  items: Array<{
    id: string;
    label: string;
    checked: boolean;
    disabled?: boolean;
  }>;

  /**
   * Callback when toggle changes
   */
  onChange: (id: string, checked: boolean) => void;

  /**
   * Toggle size
   */
  size?: "sm" | "md" | "lg";

  /**
   * Additional classes
   */
  className?: string;
}

export function ToggleGroup({
  items,
  onChange,
  size = "md",
  className = "",
}: ToggleGroupProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {items.map((item) => (
        <Toggle
          key={item.id}
          label={item.label}
          checked={item.checked}
          disabled={item.disabled}
          size={size}
          onChange={(e) => onChange(item.id, e.target.checked)}
        />
      ))}
    </div>
  );
}

export type { ToggleProps, ToggleGroupProps };
