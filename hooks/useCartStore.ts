"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Product } from "@/types/product";

export type CartItem = {
  product: Product;
  quantity: number;
  size: string;
};

type CartStore = {
  items: CartItem[];
  setCart: (items: CartItem[]) => void;
  addItem: (product: Product, size: string, quantity?: number) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  updateSize: (productId: string, currentSize: string, nextSize: string) => void;
  removeItem: (productId: string, size: string) => void;
  clearCart: () => void;
  itemCount: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      setCart: (items) => set({ items }),
      addItem: (product, size, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.product.id === product.id && item.size === size,
          );

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id && item.size === size
                  ? { ...item, quantity: item.quantity + quantity }
                  : item,
              ),
            };
          }

          return {
            items: [...state.items, { product, quantity, size }],
          };
        });
      },
      updateQuantity: (productId, size, quantity) => {
        if (quantity < 1) {
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId && item.size === size
              ? { ...item, quantity }
              : item,
          ),
        }));
      },
      updateSize: (productId, currentSize, nextSize) => {
        set((state) => {
          const itemToMove = state.items.find(
            (item) => item.product.id === productId && item.size === currentSize,
          );

          if (!itemToMove || currentSize === nextSize) {
            return state;
          }

          const matchingNextSize = state.items.find(
            (item) => item.product.id === productId && item.size === nextSize,
          );

          if (matchingNextSize) {
            return {
              items: state.items
                .filter(
                  (item) =>
                    !(item.product.id === productId && item.size === currentSize),
                )
                .map((item) =>
                  item.product.id === productId && item.size === nextSize
                    ? { ...item, quantity: item.quantity + itemToMove.quantity }
                    : item,
                ),
            };
          }

          return {
            items: state.items.map((item) =>
              item.product.id === productId && item.size === currentSize
                ? { ...item, size: nextSize }
                : item,
            ),
          };
        });
      },
      removeItem: (productId, size) => {
        set((state) => ({
          items: state.items.filter(
            (item) => item.product.id !== productId || item.size !== size,
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      itemCount: () =>
        get().items.reduce((totalItems, item) => totalItems + item.quantity, 0),
    }),
    {
      name: "local-cart",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
