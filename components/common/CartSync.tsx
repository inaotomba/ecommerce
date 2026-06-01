"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useCartStore, type CartItem } from "@/hooks/useCartStore";
import type { Database } from "@/types/supabase";
import type { Product } from "@/types/product";

type CartRow = Database["public"]["Tables"]["carts"]["Row"];
type CartItemRow = Database["public"]["Tables"]["cart_items"]["Row"];
type VariantRow = Database["public"]["Tables"]["product_variants"]["Row"];

type CartSyncProps = {
  products: Product[];
};

function mergeCartItems(items: CartItem[]) {
  const mergedItems = new Map<string, CartItem>();

  items.forEach((item) => {
    const key = `${item.product.id}:${item.size}`;
    const existingItem = mergedItems.get(key);

    if (existingItem) {
      mergedItems.set(key, {
        ...existingItem,
        quantity: existingItem.quantity + item.quantity,
      });
      return;
    }

    mergedItems.set(key, item);
  });

  return Array.from(mergedItems.values());
}

export function CartSync({ products }: CartSyncProps) {
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const client = supabase;
    let isActive = true;
    let cartId: string | null = null;
    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    let unsubscribeCart: (() => void) | null = null;
    let previousItems = useCartStore.getState().items;

    const productsByDatabaseId = new Map(
      products
        .filter((product) => product.databaseId)
        .map((product) => [product.databaseId as string, product]),
    );
    const productDatabaseIds = Array.from(productsByDatabaseId.keys());

    async function loadVariants() {
      if (productDatabaseIds.length === 0) {
        return [];
      }

      const { data, error } = await client
        .from("product_variants")
        .select("id,product_id,size,sku,stock_quantity,is_active,created_at,updated_at,color")
        .in("product_id", productDatabaseIds);

      if (error) {
        return [];
      }

      return (data ?? []) as VariantRow[];
    }

    async function getOrCreateCart(profileId: string) {
      const { data: existingCart, error: existingError } = await client
        .from("carts")
        .select("*")
        .eq("profile_id", profileId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingError) {
        return null;
      }

      if (existingCart) {
        return existingCart as CartRow;
      }

      const { data: newCart, error } = await client
        .from("carts")
        .insert({
          profile_id: profileId,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (error) {
        return null;
      }

      return newCart as CartRow;
    }

    function rowsToCartItems(rows: CartItemRow[], variants: VariantRow[]) {
      const sizeByVariantId = new Map(
        variants.map((variant) => [variant.id, variant.size]),
      );

      return rows
        .map((row) => {
          const product = productsByDatabaseId.get(row.product_id);

          if (!product) {
            return null;
          }

          return {
            product,
            quantity: row.quantity,
            size:
              (row.variant_id ? sizeByVariantId.get(row.variant_id) : null) ??
              product.sizes[0],
          };
        })
        .filter((item): item is CartItem => Boolean(item));
    }

    async function saveCartItems(nextCartId: string, items: CartItem[], variants: VariantRow[]) {
      const variantByProductAndSize = new Map(
        variants.map((variant) => [
          `${variant.product_id}:${variant.size}`,
          variant,
        ]),
      );

      await client.from("cart_items").delete().eq("cart_id", nextCartId);

      if (items.length === 0) {
        await client
          .from("carts")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", nextCartId);
        return;
      }

      const rows = items
        .map((item) => {
          if (!item.product.databaseId) {
            return null;
          }

          const variant = variantByProductAndSize.get(
            `${item.product.databaseId}:${item.size}`,
          );

          return {
            cart_id: nextCartId,
            product_id: item.product.databaseId,
            quantity: item.quantity,
            unit_price_snapshot: item.product.price,
            updated_at: new Date().toISOString(),
            variant_id: variant?.id ?? null,
          };
        })
        .filter((row): row is NonNullable<typeof row> => Boolean(row));

      if (rows.length > 0) {
        await client.from("cart_items").insert(rows);
      }

      await client
        .from("carts")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", nextCartId);
    }

    function scheduleSave(variants: VariantRow[], items: CartItem[]) {
      if (!cartId) {
        return;
      }

      if (saveTimer) {
        clearTimeout(saveTimer);
      }

      saveTimer = setTimeout(() => {
        if (cartId) {
          void saveCartItems(cartId, items, variants);
        }
      }, 450);
    }

    async function syncCart(profileId: string) {
      await useCartStore.persist.rehydrate();

      const [cart, variants] = await Promise.all([
        getOrCreateCart(profileId),
        loadVariants(),
      ]);

      if (!isActive || !cart) {
        return;
      }

      cartId = cart.id;

      const { data: cartItems, error } = await client
        .from("cart_items")
        .select("*")
        .eq("cart_id", cart.id);

      if (!isActive || error) {
        return;
      }

      const localItems = useCartStore.getState().items;
      const remoteItems = rowsToCartItems((cartItems ?? []) as CartItemRow[], variants);
      const mergedItems = mergeCartItems([...remoteItems, ...localItems]);

      useCartStore.getState().setCart(mergedItems);
      previousItems = mergedItems;

      await saveCartItems(cart.id, mergedItems, variants);

      if (!isActive) {
        return;
      }

      unsubscribeCart?.();
      unsubscribeCart = useCartStore.subscribe((state) => {
        if (state.items === previousItems) {
          return;
        }

        previousItems = state.items;
        scheduleSave(variants, state.items);
      });
    }

    async function loadInitialUser() {
      const {
        data: { user },
      } = await client.auth.getUser();

      if (user) {
        await syncCart(user.id);
      }
    }

    void loadInitialUser();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      unsubscribeCart?.();
      unsubscribeCart = null;
      cartId = null;

      if (session?.user) {
        void syncCart(session.user.id);
      }
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
      unsubscribeCart?.();

      if (saveTimer) {
        clearTimeout(saveTimer);
      }
    };
  }, [products, supabase]);

  return null;
}
