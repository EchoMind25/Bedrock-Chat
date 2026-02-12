"use client";

import { cn } from "@/lib/utils/cn";
import { motion } from "motion/react";
import type { ImgHTMLAttributes, ReactNode, Ref } from "react";
import { useState } from "react";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
type AvatarStatus = "online" | "offline" | "busy" | "away";

interface AvatarProps
  extends Omit<
    ImgHTMLAttributes<HTMLImageElement>,
    | "ref"
    | "onDrag"
    | "onDragStart"
    | "onDragEnd"
    | "onAnimationStart"
    | "onAnimationEnd"
    | "onAnimationIteration"
  > {
  /**
   * Image source
   */
  src?: string;

  /**
   * Alt text
   */
  alt?: string;

  /**
   * Fallback text (initials)
   */
  fallback?: string;

  /**
   * Avatar size
   * @default "md"
   */
  size?: AvatarSize;

  /**
   * Status indicator
   */
  status?: AvatarStatus;

  /**
   * Additional classes
   */
  className?: string;

  /**
   * Ref - React 19 passes refs as props (no forwardRef needed)
   */
  ref?: Ref<HTMLDivElement>;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-12 h-12 text-lg",
  xl: "w-16 h-16 text-xl",
};

const statusColors: Record<AvatarStatus, string> = {
  online: "bg-green-500",
  offline: "bg-gray-400",
  busy: "bg-red-500",
  away: "bg-yellow-500",
};

const statusIndicatorSize: Record<AvatarSize, string> = {
  xs: "w-1.5 h-1.5",
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
  xl: "w-4 h-4",
};

/**
 * Avatar component with image fallback and status indicator
 * Uses React 19 ref-as-prop pattern (no forwardRef)
 */
export function Avatar({
  src,
  alt = "",
  fallback,
  size = "md",
  status,
  className = "",
  ref,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const showFallback = !src || imageError || !imageLoaded;

  const initials = fallback
    ? fallback
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full overflow-hidden",
          "bg-gradient-to-br from-primary to-secondary",
          "text-white font-semibold",
          sizeClasses[size]
        )}
      >
        {showFallback ? (
          <span className="select-none">{initials}</span>
        ) : (
          <motion.img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            onLoad={() => setImageLoaded(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            {...props}
          />
        )}
      </div>

      {/* Status indicator with pulse animation */}
      {status && (
        <span className="absolute bottom-0 right-0 block rounded-full ring-2 ring-background">
          <span
            className={cn(
              "block rounded-full",
              statusColors[status],
              statusIndicatorSize[size]
            )}
          />
          {status === "online" && (
            <motion.span
              className={cn(
                "absolute inset-0 rounded-full",
                statusColors[status]
              )}
              initial={{ scale: 1, opacity: 1 }}
              animate={{
                scale: 1.5,
                opacity: 0,
              }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeOut",
              }}
            />
          )}
        </span>
      )}
    </div>
  );
}

/**
 * Avatar group component for displaying multiple avatars
 */
interface AvatarGroupProps {
  /**
   * Children (Avatar components)
   */
  children: ReactNode;

  /**
   * Max number of avatars to show
   */
  max?: number;

  /**
   * Avatar size
   */
  size?: AvatarSize;

  /**
   * Additional classes
   */
  className?: string;
}

export function AvatarGroup({
  children,
  max = 3,
  size = "md",
  className = "",
}: AvatarGroupProps) {
  const childrenArray = Array.isArray(children) ? children : [children];
  const displayedAvatars = childrenArray.slice(0, max);
  const remainingCount = childrenArray.length - max;

  return (
    <div className={cn("flex -space-x-2", className)}>
      {displayedAvatars}
      {remainingCount > 0 && (
        <div
          className={cn(
            "relative flex items-center justify-center rounded-full",
            "bg-slate-700 text-slate-300 font-semibold ring-2 ring-background",
            sizeClasses[size]
          )}
        >
          <span className="select-none text-xs">+{remainingCount}</span>
        </div>
      )}
    </div>
  );
}

export type { AvatarProps, AvatarSize, AvatarStatus, AvatarGroupProps };
