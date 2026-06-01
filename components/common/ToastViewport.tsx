"use client";

import { X } from "lucide-react";
import { useToastStore } from "@/hooks/useToastStore";

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[70] grid w-[calc(100vw-2rem)] max-w-sm gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center justify-between gap-4 border border-neutral-200 bg-white px-4 py-3 shadow-lg"
        >
          <p className="text-sm font-black uppercase text-black">
            {toast.message}
          </p>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="flex size-8 shrink-0 items-center justify-center text-neutral-500 hover:text-black"
            aria-label="Dismiss notification"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
