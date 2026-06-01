"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type WishlistStore = {
  productIds: string[];
  setWishlist: (productIds: string[]) => void;
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  clearWishlist: () => void;
};

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      productIds: [],
      setWishlist: (productIds) => set({ productIds: [...new Set(productIds)] }),
      addToWishlist: (productId) => {
        set((state) => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds
            : [...state.productIds, productId],
        }));
      },
      removeFromWishlist: (productId) => {
        set((state) => ({
          productIds: state.productIds.filter((id) => id !== productId),
        }));
      },
      toggleWishlist: (productId) => {
        set((state) => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds.filter((id) => id !== productId)
            : [...state.productIds, productId],
        }));
      },
      isWishlisted: (productId) => get().productIds.includes(productId),
      clearWishlist: () => set({ productIds: [] }),
    }),
    {
      name: "local-wishlist",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
