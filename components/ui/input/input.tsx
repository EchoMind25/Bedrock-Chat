"use client";

import { cn } from "@/lib/utils/cn";
import { motion } from "motion/react";
import type {
  InputHTMLAttributes,
  ReactNode,
  Ref,
  TextareaHTMLAttributes,
} from "react";
import { useState } from "react";

interface BaseInputProps {
  /**
   * Label text
   */
  label?: string;

  /**
   * Additional classes for the label
   */
  labelClassName?: string;

  /**
   * Error message
   */
  error?: string;

  /**
   * Helper text
   */
  helperText?: string;

  /**
   * Additional classes
   */
  className?: string;

  /**
   * Left icon
   */
  leftIcon?: ReactNode;

  /**
   * Right icon
   */
  rightIcon?: ReactNode;
}

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "ref">,
    BaseInputProps {
  /**
   * Ref - React 19 passes refs as props (no forwardRef needed)
   */
  ref?: Ref<HTMLInputElement>;
}

interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "ref">,
    BaseInputProps {
  /**
   * Ref - React 19 passes refs as props (no forwardRef needed)
   */
  ref?: Ref<HTMLTextAreaElement>;
}

/**
 * Input component with animated focus border
 * Uses React 19 ref-as-prop pattern (no forwardRef)
 */
export function Input({
  label,
  labelClassName,
  error,
  helperText,
  className = "",
  leftIcon,
  rightIcon,
  ref,
  type = "text",
  disabled = false,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="w-full">
      {label && (
        <label
          className={cn("block text-sm font-medium mb-2 text-foreground", labelClassName)}
          htmlFor={props.id}
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          type={type}
          disabled={disabled}
          className={cn(
            "w-full px-4 py-2 rounded-lg",
            "bg-background border border-border",
            "text-foreground placeholder:text-muted-foreground",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-red-500 focus:ring-red-500",
            leftIcon ? "pl-10" : false,
            rightIcon ? "pr-10" : false,
            className
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error
              ? `${props.id}-error`
              : helperText
                ? `${props.id}-helper`
                : undefined
          }
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {rightIcon}
          </div>
        )}

        {/* Animated focus border */}
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          initial={false}
          animate={{
            boxShadow: isFocused
              ? "0 0 0 3px oklch(0.65 0.25 265 / 0.1)"
              : "0 0 0 0px oklch(0.65 0.25 265 / 0)",
          }}
          transition={{ duration: 0.2 }}
        />
      </div>

      {error && (
        <motion.p
          id={`${props.id}-error`}
          className="mt-1 text-sm text-red-500"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
        >
          {error}
        </motion.p>
      )}

      {helperText && !error && (
        <p
          id={`${props.id}-helper`}
          className="mt-1 text-sm text-muted-foreground"
        >
          {helperText}
        </p>
      )}
    </div>
  );
}

/**
 * Textarea component with animated focus border
 */
export function Textarea({
  label,
  error,
  helperText,
  className = "",
  ref,
  disabled = false,
  rows = 4,
  ...props
}: TextareaProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="w-full">
      {label && (
        <label
          className="block text-sm font-medium mb-2 text-foreground"
          htmlFor={props.id}
        >
          {label}
        </label>
      )}

      <div className="relative">
        <textarea
          ref={ref}
          rows={rows}
          disabled={disabled}
          className={cn(
            "w-full px-4 py-2 rounded-lg resize-y",
            "bg-background border border-border",
            "text-foreground placeholder:text-muted-foreground",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error
              ? `${props.id}-error`
              : helperText
                ? `${props.id}-helper`
                : undefined
          }
          {...props}
        />

        {/* Animated focus border */}
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          initial={false}
          animate={{
            boxShadow: isFocused
              ? "0 0 0 3px oklch(0.65 0.25 265 / 0.1)"
              : "0 0 0 0px oklch(0.65 0.25 265 / 0)",
          }}
          transition={{ duration: 0.2 }}
        />
      </div>

      {error && (
        <motion.p
          id={`${props.id}-error`}
          className="mt-1 text-sm text-red-500"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
        >
          {error}
        </motion.p>
      )}

      {helperText && !error && (
        <p
          id={`${props.id}-helper`}
          className="mt-1 text-sm text-muted-foreground"
        >
          {helperText}
        </p>
      )}
    </div>
  );
}

export type { InputProps, TextareaProps };
