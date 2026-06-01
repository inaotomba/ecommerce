"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useWishlistStore } from "@/hooks/useWishlistStore";
import type { Product } from "@/types/product";

type WishlistToggleResult = {
  error?: string;
  isSaved: boolean;
  syncedToAccount: boolean;
};

export function useWishlistActions(product: Product) {
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const addToWishlist = useWishlistStore((state) => state.addToWishlist);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);
  const isWishlisted = useWishlistStore((state) =>
    state.productIds.includes(product.id),
  );

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const client = supabase;
    let isActive = true;

    async function loadUser() {
      const {
        data: { user: currentUser },
      } = await client.auth.getUser();

      if (isActive) {
        setUser(currentUser);
      }
    }

    void loadUser();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function toggleWishlist(): Promise<WishlistToggleResult> {
    const nextIsSaved = !isWishlisted;

    if (nextIsSaved) {
      addToWishlist(product.id);
    } else {
      removeFromWishlist(product.id);
    }

    if (!supabase || !user || !product.databaseId) {
      return {
        isSaved: nextIsSaved,
        syncedToAccount: false,
      };
    }

    const { error } = nextIsSaved
      ? await supabase.from("wishlist_items").insert({
          product_id: product.databaseId,
          profile_id: user.id,
        })
      : await supabase
          .from("wishlist_items")
          .delete()
          .eq("profile_id", user.id)
          .eq("product_id", product.databaseId);

    if (error && error.code !== "23505") {
      if (nextIsSaved) {
        removeFromWishlist(product.id);
      } else {
        addToWishlist(product.id);
      }

      return {
        error: error.message,
        isSaved: !nextIsSaved,
        syncedToAccount: true,
      };
    }

    return {
      isSaved: nextIsSaved,
      syncedToAccount: true,
    };
  }

  return {
    isWishlisted,
    toggleWishlist,
  };
}
