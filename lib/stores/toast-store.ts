import { create } from "zustand";

export type ToastVariant = "default" | "success" | "warning" | "error" | "info";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

/**
 * Zustand store for managing toasts
 * Uses useSyncExternalStore internally (Zustand 5.x)
 */
export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      id,
      variant: "default",
      duration: 5000,
      ...toast,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, newToast.duration);
    }
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),
}));

/**
 * Helper function to show toast
 */
export const toast = {
  show: (toast: Omit<Toast, "id">) => {
    useToastStore.getState().addToast(toast);
  },

  success: (title: string, description?: string) => {
    useToastStore.getState().addToast({
      title,
      description,
      variant: "success",
    });
  },

  error: (title: string, description?: string) => {
    useToastStore.getState().addToast({
      title,
      description,
      variant: "error",
    });
  },

  warning: (title: string, description?: string) => {
    useToastStore.getState().addToast({
      title,
      description,
      variant: "warning",
    });
  },

  info: (title: string, description?: string) => {
    useToastStore.getState().addToast({
      title,
      description,
      variant: "info",
    });
  },
};
