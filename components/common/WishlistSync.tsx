"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useWishlistStore } from "@/hooks/useWishlistStore";
import type { Product } from "@/types/product";

type WishlistSyncProps = {
  products: Product[];
};

export function WishlistSync({ products }: WishlistSyncProps) {
  const supabase = createSupabaseBrowserClient();
  const setWishlist = useWishlistStore((state) => state.setWishlist);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const client = supabase;
    let isActive = true;
    const slugByDatabaseId = new Map(
      products
        .filter((product) => product.databaseId)
        .map((product) => [product.databaseId as string, product.id]),
    );
    const databaseIdBySlug = new Map(
      products
        .filter((product) => product.databaseId)
        .map((product) => [product.id, product.databaseId as string]),
    );

    async function syncWishlist(profileId: string) {
      await useWishlistStore.persist.rehydrate();

      if (!isActive) {
        return;
      }

      const localProductIds = useWishlistStore.getState().productIds;
      const { data, error } = await client
        .from("wishlist_items")
        .select("product_id")
        .eq("profile_id", profileId);

      if (!isActive || error) {
        return;
      }

      const databaseProductIds = (data ?? []).map((item) => item.product_id);
      const databaseSlugs = databaseProductIds
        .map((productId) => slugByDatabaseId.get(productId))
        .filter((productId): productId is string => Boolean(productId));
      const localDatabaseIds = localProductIds
        .map((productId) => databaseIdBySlug.get(productId))
        .filter((productId): productId is string => Boolean(productId));
      const missingDatabaseIds = localDatabaseIds.filter(
        (productId) => !databaseProductIds.includes(productId),
      );

      if (missingDatabaseIds.length > 0) {
        await client.from("wishlist_items").insert(
          [...new Set(missingDatabaseIds)].map((productId) => ({
            product_id: productId,
            profile_id: profileId,
          })),
        );
      }

      if (isActive) {
        setWishlist([...new Set([...localProductIds, ...databaseSlugs])]);
      }
    }

    async function loadInitialUser() {
      const {
        data: { user },
      } = await client.auth.getUser();

      if (user) {
        await syncWishlist(user.id);
      }
    }

    void loadInitialUser();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void syncWishlist(session.user.id);
      }
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [products, setWishlist, supabase]);

  return null;
}
