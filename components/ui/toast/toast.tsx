"use client";

import { useToastStore } from "@/lib/stores/toast-store";
import type { Toast, ToastVariant } from "@/lib/stores/toast-store";
import { cn } from "@/lib/utils/cn";
import { AnimatePresence, motion, useDragControls } from "motion/react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

const variantClasses: Record<ToastVariant, string> = {
  default: "bg-background border-border",
  success: "bg-green-500/10 border-green-500/50 text-green-500",
  warning: "bg-yellow-500/10 border-yellow-500/50 text-yellow-500",
  error: "bg-red-500/10 border-red-500/50 text-red-500",
  info: "bg-blue-500/10 border-blue-500/50 text-blue-500",
};

const iconVariants: Record<ToastVariant, ReactNode> = {
  default: null,
  success: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className="text-green-500"
      role="img"
      aria-label="Success"
    >
      <path
        d="M16.667 5L7.5 14.167L3.333 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  warning: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className="text-yellow-500"
      role="img"
      aria-label="Warning"
    >
      <path
        d="M10 6.667v3.333M10 13.333h.008M8.617 3.333l-6.95 12.5c-.5.833.125 1.834 1.117 1.834h13.9c.991 0 1.616-1 1.116-1.834l-6.95-12.5c-.5-.833-1.733-.833-2.233 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  error: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className="text-red-500"
      role="img"
      aria-label="Error"
    >
      <path
        d="M10 18.333c4.602 0 8.333-3.731 8.333-8.333 0-4.602-3.731-8.333-8.333-8.333-4.602 0-8.333 3.731-8.333 8.333 0 4.602 3.731 8.333 8.333 8.333zM12.5 7.5l-5 5M7.5 7.5l5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  info: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className="text-blue-500"
      role="img"
      aria-label="Info"
    >
      <path
        d="M10 18.333c4.602 0 8.333-3.731 8.333-8.333 0-4.602-3.731-8.333-8.333-8.333-4.602 0-8.333 3.731-8.333 8.333 0 4.602 3.731 8.333 8.333 8.333zM10 13.333V10M10 6.667h.008"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [progress, setProgress] = useState(100);
  const dragControls = useDragControls();

  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (toast.duration || 5000)) * 100;
        return Math.max(0, newProgress);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [toast.duration]);

  const variant = toast.variant || "default";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 200, scale: 0.9 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      dragControls={dragControls}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 100) {
          onRemove(toast.id);
        }
      }}
      className={cn(
        "relative w-full max-w-sm",
        "backdrop-blur-md border rounded-lg shadow-lg",
        "p-4 pr-12",
        "cursor-grab active:cursor-grabbing",
        variantClasses[variant]
      )}
    >
      <div className="flex items-start gap-3">
        {iconVariants[variant] && (
          <div className="flex-shrink-0 mt-0.5">{iconVariants[variant]}</div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">{toast.title}</h3>
          {toast.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {toast.description}
            </p>
          )}
        </div>
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        className={cn(
          "absolute top-4 right-4",
          "p-1 rounded",
          "text-muted-foreground hover:text-foreground",
          "hover:bg-muted/50",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary"
        )}
        aria-label="Close toast"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Close"
        >
          <path
            d="M12 4L4 12M4 4L12 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-primary rounded-bl-lg"
          initial={{ width: "100%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
        />
      )}
    </motion.div>
  );
}

/**
 * Toast container component - manages all toasts
 * Zustand-managed with swipe dismiss and progress bar
 */
export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export { useToastStore, toast } from "@/lib/stores/toast-store";
export type { Toast, ToastVariant } from "@/lib/stores/toast-store";
