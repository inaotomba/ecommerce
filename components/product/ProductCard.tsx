"use client";

import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import type { Product } from "@/types/product";
import { useCartStore } from "@/hooks/useCartStore";
import { useToastStore } from "@/hooks/useToastStore";
import { useWishlistActions } from "@/hooks/useWishlistActions";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const showToast = useToastStore((state) => state.showToast);
  const { isWishlisted, toggleWishlist } = useWishlistActions(product);
  const isOutOfStock = product.stockStatus === "out-of-stock";

  function handleQuickAdd() {
    if (isOutOfStock) {
      return;
    }

    addItem(product, product.sizes[0]);
    showToast(`${product.name} added`);
  }

  return (
    <article className="group">
      <div className="mb-4">
        <p className="text-xs font-medium uppercase leading-none text-neutral-500">
          {product.label}
        </p>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h2 className="text-lg font-black uppercase leading-none tracking-[-0.04em] text-black">
            {product.name}
          </h2>
          <div className="text-right text-xs font-bold uppercase">
            {product.originalPrice ? (
              <p className="text-neutral-400 line-through">
                ${product.originalPrice}
              </p>
            ) : null}
            <p className="text-neutral-500">${product.price}</p>
          </div>
        </div>
      </div>

      <div className="relative aspect-square overflow-hidden bg-neutral-200">
        <Link
          href={`/products/${product.id}`}
          className="block h-full w-full"
          aria-label={`View ${product.name}`}
        >
          {product.isSale ? (
            <span className="absolute left-4 top-4 z-10 rounded-full bg-black px-4 py-1.5 text-xs font-bold uppercase text-white">
              Sale
            </span>
          ) : null}
          {product.isNew ? (
            <span className="absolute left-4 top-14 z-10 rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase text-black">
              New
            </span>
          ) : null}
          {isOutOfStock ? (
            <span className="absolute inset-x-4 bottom-4 z-10 bg-white px-4 py-3 text-center text-xs font-black uppercase text-black">
              Out of stock
            </span>
          ) : null}
          <div
            className={`absolute inset-0 bg-cover bg-center grayscale transition duration-500 group-hover:scale-105 ${
              product.hoverImage ? "group-hover:opacity-0" : "group-hover:grayscale-0"
            } ${isOutOfStock ? "opacity-45" : ""}`}
            style={{ backgroundImage: `url(${product.image})` }}
          />
          {product.hoverImage ? (
            <div
              className={`absolute inset-0 bg-cover bg-center opacity-0 grayscale transition duration-500 group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0 ${
                isOutOfStock ? "opacity-25 group-hover:opacity-25" : ""
              }`}
              style={{ backgroundImage: `url(${product.hoverImage})` }}
            />
          ) : null}
        </Link>

        <div className="absolute right-3 top-3 z-20 grid gap-2">
          <button
            type="button"
            onClick={async () => {
              const result = await toggleWishlist();

              if (result.error) {
                showToast("Wishlist could not sync");
                return;
              }

              showToast(
                result.isSaved
                  ? `${product.name} saved`
                  : `${product.name} removed from wishlist`,
              );
            }}
            className={`flex size-10 items-center justify-center border border-neutral-200 bg-white transition hover:bg-neutral-100 ${
              isWishlisted ? "text-black" : "text-neutral-500"
            }`}
            aria-label={
              isWishlisted
                ? `Remove ${product.name} from wishlist`
                : `Add ${product.name} to wishlist`
            }
          >
            <Heart
              className={`size-5 ${isWishlisted ? "fill-black" : ""}`}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className="flex size-10 items-center justify-center bg-black text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
            aria-label={`Quick add ${product.name}`}
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex justify-between gap-3 text-xs font-bold uppercase text-neutral-500">
        <span>
          {product.stockStatus === "low-stock"
            ? "Low stock"
            : product.stockStatus === "out-of-stock"
              ? "Sold out"
              : "In stock"}
        </span>
        <span>{product.sizes.join(" / ")}</span>
      </div>
    </article>
  );
}
