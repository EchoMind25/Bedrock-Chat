"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils/cn";

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
}

export interface ContextMenuDivider {
  id: string;
  type: "divider";
}

export type ContextMenuEntry = ContextMenuItem | ContextMenuDivider;

interface ContextMenuProps {
  items: ContextMenuEntry[];
  position: { x: number; y: number };
  isOpen: boolean;
  onClose: () => void;
}

function isDivider(entry: ContextMenuEntry): entry is ContextMenuDivider {
  return "type" in entry && entry.type === "divider";
}

export function ContextMenu({ items, position, isOpen, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside or escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    // Use setTimeout so the opening right-click doesn't immediately close it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Adjust position to stay within viewport
  const adjustedPosition = { ...position };
  if (typeof window !== "undefined" && isOpen) {
    const menuWidth = 200;
    const menuHeight = items.length * 36;
    if (adjustedPosition.x + menuWidth > window.innerWidth) {
      adjustedPosition.x = window.innerWidth - menuWidth - 8;
    }
    if (adjustedPosition.y + menuHeight > window.innerHeight) {
      adjustedPosition.y = window.innerHeight - menuHeight - 8;
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          className="fixed z-[100] min-w-[180px] py-1.5 rounded-lg bg-[oklch(0.15_0.02_250)] border border-white/10 shadow-xl"
          style={{
            left: adjustedPosition.x,
            top: adjustedPosition.y,
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1 }}
        >
          {items.map((entry) => {
            if (isDivider(entry)) {
              return (
                <div
                  key={entry.id}
                  className="h-px bg-white/10 mx-2 my-1"
                />
              );
            }

            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => {
                  if (!entry.disabled) {
                    entry.onClick();
                    onClose();
                  }
                }}
                disabled={entry.disabled}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors",
                  entry.disabled
                    ? "opacity-40 cursor-not-allowed"
                    : entry.variant === "danger"
                      ? "text-red-400 hover:bg-red-500/20 hover:text-red-300"
                      : "text-white/80 hover:bg-white/10 hover:text-white",
                )}
              >
                {entry.icon && (
                  <span className="w-4 h-4 shrink-0 flex items-center justify-center">
                    {entry.icon}
                  </span>
                )}
                <span>{entry.label}</span>
              </button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
