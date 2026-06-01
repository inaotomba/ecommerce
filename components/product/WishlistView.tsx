"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useWishlistStore } from "@/hooks/useWishlistStore";
import type { Product } from "@/types/product";
import { ProductCard } from "./ProductCard";

type WishlistViewProps = {
  products: Product[];
};

export function WishlistView({ products }: WishlistViewProps) {
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const productIds = useWishlistStore((state) => state.productIds);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);
  const wishlistProducts = products.filter((product) =>
    productIds.includes(product.id),
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

  async function handleClearWishlist() {
    clearWishlist();
    setNotice(null);

    if (!supabase || !user) {
      setNotice("Local wishlist cleared.");
      return;
    }

    const { error } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("profile_id", user.id);

    if (error) {
      setNotice("Local wishlist cleared, but Supabase could not sync.");
      return;
    }

    setNotice("Account wishlist cleared.");
  }

  if (wishlistProducts.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <p className="text-base font-bold uppercase tracking-[-0.03em]">
          (Wishlist)
        </p>
        <h1 className="mt-6 text-5xl font-black uppercase leading-none tracking-[-0.07em] sm:text-6xl">
          No Saved Pieces
        </h1>
        <p className="mt-8 max-w-md text-sm font-bold uppercase leading-5 text-neutral-500">
          Tap the heart on any product card to save it here. Signed-in users
          sync their wishlist to Supabase.
        </p>
        {notice ? (
          <p className="mt-5 text-sm font-bold uppercase text-neutral-500">
            {notice}
          </p>
        ) : null}
        <Link
          href="/products"
          className="mt-10 inline-flex h-12 items-center justify-center bg-black px-8 text-sm font-black uppercase text-white transition hover:bg-neutral-800"
        >
          Shop All
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="flex flex-col gap-8 border-b border-neutral-200 pb-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-base font-bold uppercase tracking-[-0.03em]">
            (Wishlist)
          </p>
          <h1 className="mt-6 text-5xl font-black uppercase leading-none tracking-[-0.07em] sm:text-6xl">
            Saved Pieces
          </h1>
        </div>
        <button
          type="button"
          onClick={() => void handleClearWishlist()}
          className="text-xs font-black uppercase text-neutral-500 underline-offset-4 hover:text-black hover:underline"
        >
          Clear wishlist
        </button>
      </div>

      {notice ? (
        <p className="mt-6 border border-neutral-200 bg-neutral-100 px-4 py-3 text-sm font-bold uppercase text-neutral-500">
          {notice}
        </p>
      ) : null}

      <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {wishlistProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
