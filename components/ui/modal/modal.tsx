"use client";

import { Glass } from "@/components/ui/glass";
import { backdropVariants, modalVariants } from "@/lib/utils/animations";
import { cn } from "@/lib/utils/cn";
import { AnimatePresence, motion } from "motion/react";
import type { KeyboardEvent, ReactNode, Ref } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  /**
   * Modal open state
   */
  isOpen: boolean;

  /**
   * Callback when modal should close
   */
  onClose: () => void;

  /**
   * Modal title
   */
  title?: string;

  /**
   * Modal description
   */
  description?: string;

  /**
   * Children elements
   */
  children?: ReactNode;

  /**
   * Footer content
   */
  footer?: ReactNode;

  /**
   * Modal size
   * @default "md"
   */
  size?: "sm" | "md" | "lg" | "xl" | "full";

  /**
   * Close on overlay click
   * @default true
   */
  closeOnOverlay?: boolean;

  /**
   * Close on escape key
   * @default true
   */
  closeOnEscape?: boolean;

  /**
   * Additional classes
   */
  className?: string;

  /**
   * Ref - React 19 passes refs as props (no forwardRef needed)
   */
  ref?: Ref<HTMLDivElement>;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-full mx-4",
};

/**
 * Modal component with AnimatePresence and focus trap
 * Uses React 19 ref-as-prop pattern (no forwardRef)
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnOverlay = true,
  closeOnEscape = true,
  className = "",
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Focus trap implementation
  useEffect(() => {
    if (!isOpen) return;

    // Save the currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus the modal
    modalRef.current?.focus();

    // Prevent body scroll
    document.body.style.overflow = "hidden";

    return () => {
      // Restore focus to previous element
      previousActiveElement.current?.focus();

      // Restore body scroll
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Trap focus within modal
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Tab") return;

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (!focusableElements || focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
          aria-describedby={description ? "modal-description" : undefined}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={closeOnOverlay ? onClose : undefined}
          />

          {/* Modal content */}
          <motion.div
            ref={modalRef}
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn("relative z-10 w-full", sizeClasses[size], className)}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
          >
            <Glass variant="strong" border="medium" className="p-6">
              {/* Header */}
              {(title || description) && (
                <div className="mb-4">
                  {title && (
                    <h2
                      id="modal-title"
                      className="text-2xl font-semibold text-foreground mb-2"
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p
                      id="modal-description"
                      className="text-sm text-muted-foreground"
                    >
                      {description}
                    </p>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="text-foreground">{children}</div>

              {/* Footer */}
              {footer && (
                <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-end gap-3">
                  {footer}
                </div>
              )}

              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "absolute top-4 right-4",
                  "p-2 rounded-lg",
                  "text-muted-foreground hover:text-foreground",
                  "hover:bg-muted/50",
                  "transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-primary"
                )}
                aria-label="Close modal"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  role="img"
                  aria-label="Close"
                >
                  <path
                    d="M15 5L5 15M5 5L15 15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </Glass>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export type { ModalProps };
