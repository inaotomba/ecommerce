"use client";

import { create } from "zustand";

type Toast = {
  id: number;
  message: string;
};

type ToastStore = {
  toasts: Toast[];
  showToast: (message: string) => void;
  dismissToast: (id: number) => void;
};

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  showToast: (message) => {
    const id = Date.now();

    set((state) => ({
      toasts: [...state.toasts, { id, message }],
    }));

    window.setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
      }));
    }, 3000);
  },
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));
