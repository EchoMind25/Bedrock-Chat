"use client";

import { cn } from "@/lib/utils/cn";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type TooltipPosition = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  /**
   * Tooltip content
   */
  content: ReactNode;

  /**
   * Children (trigger element)
   */
  children: ReactNode;

  /**
   * Tooltip position
   * @default "top"
   */
  position?: TooltipPosition;

  /**
   * Delay before showing tooltip (ms)
   * @default 500
   */
  delay?: number;

  /**
   * Additional classes for tooltip
   */
  className?: string;

  /**
   * Disabled state
   */
  disabled?: boolean;
}

const positionClasses: Record<TooltipPosition, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const arrowClasses: Record<TooltipPosition, string> = {
  top: "top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent",
  bottom:
    "bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent",
  left: "left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent",
  right:
    "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent",
};

const animationVariants = {
  top: {
    initial: { opacity: 0, y: 5 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 5 },
  },
  bottom: {
    initial: { opacity: 0, y: -5 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -5 },
  },
  left: {
    initial: { opacity: 0, x: 5 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 5 },
  },
  right: {
    initial: { opacity: 0, x: -5 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -5 },
  },
};

/**
 * Tooltip component with positions and 500ms delay
 */
export function Tooltip({
  content,
  children,
  position = "top",
  delay = 500,
  className = "",
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (disabled) return;

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}

      <AnimatePresence>
        {isVisible && !disabled && (
          <motion.div
            role="tooltip"
            className={cn(
              "absolute z-50 whitespace-nowrap pointer-events-none",
              positionClasses[position]
            )}
            variants={animationVariants[position]}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.15 }}
          >
            <div
              className={cn(
                "px-3 py-2 rounded-lg",
                "bg-background-dark dark:bg-background",
                "text-foreground-dark dark:text-foreground",
                "text-sm font-medium",
                "border border-border-dark/50 dark:border-border/50",
                "shadow-lg backdrop-blur-sm",
                className
              )}
            >
              {content}
            </div>

            {/* Arrow */}
            <div
              className={cn(
                "absolute w-0 h-0",
                "border-4 border-background-dark dark:border-background",
                arrowClasses[position]
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Tooltip with icon helper
 */
interface TooltipIconProps extends Omit<TooltipProps, "children"> {
  icon?: ReactNode;
}

export function TooltipIcon({
  content,
  icon,
  position = "top",
  delay = 500,
  className = "",
}: TooltipIconProps) {
  return (
    <Tooltip
      content={content}
      position={position}
      delay={delay}
      className={className}
    >
      <button
        type="button"
        className={cn(
          "inline-flex items-center justify-center",
          "w-5 h-5 rounded-full",
          "text-slate-400 hover:text-foreground",
          "transition-colors duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary"
        )}
        aria-label="More information"
      >
        {icon || (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Information"
          >
            <path
              d="M10 18.333c4.602 0 8.333-3.731 8.333-8.333 0-4.602-3.731-8.333-8.333-8.333-4.602 0-8.333 3.731-8.333 8.333 0 4.602 3.731 8.333 8.333 8.333zM10 13.333V10M10 6.667h.008"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </Tooltip>
  );
}

export type { TooltipProps, TooltipPosition, TooltipIconProps };
