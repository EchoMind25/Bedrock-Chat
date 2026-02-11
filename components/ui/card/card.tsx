"use client";

import { Glass } from "@/components/ui/glass";
import type { GlassBorder, GlassVariant } from "@/components/ui/glass";
import { cn } from "@/lib/utils/cn";
import { motion } from "motion/react";
import type { HTMLAttributes, MouseEvent, ReactNode, Ref } from "react";
import { useState } from "react";

interface CardProps
  extends Omit<
    HTMLAttributes<HTMLDivElement>,
    | "onDrag"
    | "onDragStart"
    | "onDragEnd"
    | "onAnimationStart"
    | "onAnimationEnd"
    | "onAnimationIteration"
  > {
  /**
   * Glass variant
   * @default "medium"
   */
  variant?: GlassVariant;

  /**
   * Border style
   * @default "light"
   */
  border?: GlassBorder;

  /**
   * Enable 3D tilt effect on hover
   * @default true
   */
  tilt?: boolean;

  /**
   * Enable hover lift effect
   * @default false
   */
  hoverable?: boolean;

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
  ref?: Ref<HTMLDivElement>;
}

/**
 * Card component with Glass container and 3D tilt hover
 * Uses React 19 ref-as-prop pattern (no forwardRef)
 */
export function Card({
  variant = "medium",
  border = "light",
  tilt = true,
  hoverable = false,
  children,
  className = "",
  ref,
  ...props
}: CardProps) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!tilt) return;

    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateXValue = ((y - centerY) / centerY) * -10;
    const rotateYValue = ((x - centerX) / centerX) * 10;

    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };

  const handleMouseLeave = () => {
    if (!tilt) return;

    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX,
        rotateY,
        scale: hoverable ? 1 : 1,
      }}
      whileHover={
        hoverable
          ? {
              scale: 1.02,
              y: -4,
            }
          : undefined
      }
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
      style={{
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      {...props}
    >
      <Glass
        variant={variant}
        border={border}
        className={cn("p-6", hoverable && "cursor-pointer", className)}
      >
        <div style={{ transform: "translateZ(20px)" }}>{children}</div>
      </Glass>
    </motion.div>
  );
}

/**
 * Card header component
 */
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
}

export function CardHeader({
  children,
  className = "",
  ...props
}: CardHeaderProps) {
  return (
    <div className={cn("mb-4", className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Card title component
 */
interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children?: ReactNode;
  className?: string;
}

export function CardTitle({
  children,
  className = "",
  ...props
}: CardTitleProps) {
  return (
    <h3
      className={cn("text-xl font-semibold text-foreground", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

/**
 * Card description component
 */
interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children?: ReactNode;
  className?: string;
}

export function CardDescription({
  children,
  className = "",
  ...props
}: CardDescriptionProps) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props}>
      {children}
    </p>
  );
}

/**
 * Card content component
 */
interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
}

export function CardContent({
  children,
  className = "",
  ...props
}: CardContentProps) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Card footer component
 */
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
}

export function CardFooter({
  children,
  className = "",
  ...props
}: CardFooterProps) {
  return (
    <div
      className={cn("mt-4 pt-4 border-t border-border/50", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export type {
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
};
