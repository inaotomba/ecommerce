"use client";

import { useEffect } from "react";
import { useCartStore } from "@/hooks/useCartStore";
import { useWishlistStore } from "@/hooks/useWishlistStore";

let hasHydratedPersistedStores = false;

export function StoreHydrator() {
  useEffect(() => {
    if (hasHydratedPersistedStores) {
      return;
    }

    hasHydratedPersistedStores = true;
    void useCartStore.persist.rehydrate();
    void useWishlistStore.persist.rehydrate();
  }, []);

  return null;
}
