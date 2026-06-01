"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Check, Heart, Minus, Plus, Ruler, ShoppingBag, X } from "lucide-react";
import type { Product } from "@/types/product";
import { useCartStore } from "@/hooks/useCartStore";
import { useToastStore } from "@/hooks/useToastStore";
import { useWishlistActions } from "@/hooks/useWishlistActions";
import { ProductCard } from "./ProductCard";

type ProductDetailProps = {
  product: Product;
  products: Product[];
};

const recentlyViewedEvent = "recently-viewed-update";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(value);
}

function readRecentlyViewed() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return JSON.parse(window.localStorage.getItem("recently-viewed") ?? "[]") as string[];
  } catch {
    return [];
  }
}

function getRecentlyViewedSnapshot() {
  return readRecentlyViewed().join("|");
}

function subscribeToRecentlyViewed(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(recentlyViewedEvent, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(recentlyViewedEvent, callback);
  };
}

export function ProductDetail({ product, products }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(product.images[0] ?? product.image);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const recentIdsSnapshot = useSyncExternalStore(
    subscribeToRecentlyViewed,
    getRecentlyViewedSnapshot,
    () => "",
  );
  const addItem = useCartStore((state) => state.addItem);
  const showToast = useToastStore((state) => state.showToast);
  const { isWishlisted, toggleWishlist } = useWishlistActions(product);
  const isOutOfStock = product.stockStatus === "out-of-stock";

  useEffect(() => {
    const existingIds = readRecentlyViewed().filter((id) => id !== product.id);
    const nextIds = [product.id, ...existingIds].slice(0, 5);

    window.localStorage.setItem("recently-viewed", JSON.stringify(nextIds));
    window.dispatchEvent(new Event(recentlyViewedEvent));
  }, [product.id]);

  const recentIds = useMemo(
    () =>
      recentIdsSnapshot
        ? recentIdsSnapshot.split("|").filter((id) => id && id !== product.id).slice(0, 4)
        : [],
    [product.id, recentIdsSnapshot],
  );

  const relatedProducts = useMemo(
    () =>
      products
        .filter(
          (candidate) =>
            candidate.category === product.category && candidate.id !== product.id,
        )
        .slice(0, 4),
    [product.category, product.id, products],
  );

  const recentlyViewedProducts = useMemo(
    () =>
      recentIds
        .map((id) => products.find((candidate) => candidate.id === id))
        .filter((candidate): candidate is Product => Boolean(candidate)),
    [products, recentIds],
  );

  function handleAddToCart() {
    if (isOutOfStock) {
      return;
    }

    addItem(product, selectedSize, quantity);
    setAdded(true);
    showToast(`${quantity} ${product.name} added`);
  }

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="grid gap-4">
            <div className="aspect-[4/5] overflow-hidden bg-neutral-200">
              <div
                className="h-full w-full bg-cover bg-center grayscale"
                style={{ backgroundImage: `url(${selectedImage})` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {product.images.map((image) => {
                const isSelected = image === selectedImage;

                return (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`aspect-square overflow-hidden border ${
                      isSelected ? "border-black" : "border-transparent"
                    }`}
                    aria-label={`View ${product.name} image`}
                  >
                    <div
                      className="h-full w-full bg-cover bg-center grayscale"
                      style={{ backgroundImage: `url(${image})` }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:sticky lg:top-24">
            <Link
              href="/products"
              className="text-xs font-black uppercase text-neutral-500 underline-offset-4 hover:text-black hover:underline"
            >
              Back to shop
            </Link>

            <div className="mt-8 border-b border-neutral-200 pb-8">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-bold uppercase text-neutral-500">
                  {product.label}
                </p>
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
                  className="flex size-10 items-center justify-center border border-neutral-200 transition hover:bg-neutral-100"
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
              </div>
              <h1 className="mt-3 text-5xl font-black uppercase leading-none tracking-[-0.07em] sm:text-6xl">
                {product.name}
              </h1>
              <div className="mt-6 flex items-center gap-3 text-lg font-black uppercase">
                {product.originalPrice ? (
                  <span className="text-neutral-400 line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                ) : null}
                <span>{formatCurrency(product.price)}</span>
              </div>
            </div>

            <p className="mt-8 max-w-xl text-sm font-bold uppercase leading-6 text-neutral-600">
              {product.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-xs font-bold uppercase text-neutral-500">
              <span>{product.stockStatus.replaceAll("-", " ")}</span>
              <span>/</span>
              <span>{product.inventory} units</span>
            </div>

            <div className="mt-10">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black uppercase">Select size</h2>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="inline-flex items-center gap-2 text-xs font-black uppercase text-neutral-500 underline-offset-4 hover:text-black hover:underline"
                >
                  <Ruler className="size-4" aria-hidden="true" />
                  Size guide
                </button>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {product.sizes.map((size) => {
                  const isSelected = size === selectedSize;

                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setSelectedSize(size);
                        setAdded(false);
                      }}
                      className={`h-12 border text-sm font-black uppercase transition ${
                        isSelected
                          ? "border-black bg-black text-white"
                          : "border-neutral-200 bg-white text-black hover:border-black"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-sm font-black uppercase">Quantity</h2>
              <div className="mt-4 flex h-12 w-max items-center border border-neutral-200">
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.max(current - 1, 1))}
                  disabled={quantity === 1}
                  className="flex size-12 items-center justify-center disabled:text-neutral-300"
                  aria-label="Decrease quantity"
                >
                  <Minus className="size-4" aria-hidden="true" />
                </button>
                <span className="w-12 text-center text-sm font-black">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((current) =>
                      Math.min(current + 1, Math.max(product.inventory, 1)),
                    )
                  }
                  disabled={quantity >= product.inventory || isOutOfStock}
                  className="flex size-12 items-center justify-center disabled:text-neutral-300"
                  aria-label="Increase quantity"
                >
                  <Plus className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="mt-8 flex h-14 w-full items-center justify-center gap-3 bg-black text-sm font-black uppercase text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
            >
              {isOutOfStock ? (
                "Out of stock"
              ) : added ? (
                <>
                  <Check className="size-5" aria-hidden="true" />
                  Added to cart
                </>
              ) : (
                <>
                  <ShoppingBag className="size-5" aria-hidden="true" />
                  Add to cart
                </>
              )}
            </button>

            {added ? (
              <Link
                href="/cart"
                className="mt-4 flex h-12 w-full items-center justify-center border border-neutral-200 text-sm font-black uppercase transition hover:bg-neutral-100"
              >
                View cart
              </Link>
            ) : null}

            <div className="mt-10 border-t border-neutral-200 pt-8">
              <h2 className="text-sm font-black uppercase">Details</h2>
              <ul className="mt-4 grid gap-3 text-sm font-bold uppercase text-neutral-600">
                {product.details.map((detail) => (
                  <li key={detail} className="flex items-center gap-3">
                    <span className="size-1.5 rounded-full bg-black" />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 grid gap-3 border-t border-neutral-200 pt-8 text-xs font-bold uppercase text-neutral-500">
              <p>Free delivery over $75</p>
              <p>14 day returns on unworn items</p>
              <p>Secure checkout ready for payment integration</p>
            </div>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 ? (
        <section className="mx-auto max-w-7xl border-t border-neutral-200 px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase text-neutral-500">
                (Same Category)
              </p>
              <h2 className="mt-2 text-4xl font-black uppercase leading-none tracking-[-0.06em]">
                Related Products
              </h2>
            </div>
            <Link
              href={`/products?category=${product.category}`}
              className="text-xs font-black uppercase underline decoration-2 underline-offset-4"
            >
              View all
            </Link>
          </div>
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      ) : null}

      {recentlyViewedProducts.length > 0 ? (
        <section className="mx-auto max-w-7xl border-t border-neutral-200 px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase text-neutral-500">
            (Recently Viewed)
          </p>
          <h2 className="mt-2 text-4xl font-black uppercase leading-none tracking-[-0.06em]">
            Back In Rotation
          </h2>
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {recentlyViewedProducts.map((recentProduct) => (
              <ProductCard key={recentProduct.id} product={recentProduct} />
            ))}
          </div>
        </section>
      ) : null}

      {isSizeGuideOpen ? (
        <div className="fixed inset-0 z-[70] bg-black/40 p-4">
          <div className="mx-auto mt-20 max-w-xl bg-white p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-3xl font-black uppercase leading-none tracking-[-0.06em]">
                Size Guide
              </h2>
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(false)}
                className="flex size-10 items-center justify-center border border-neutral-200 hover:bg-neutral-100"
                aria-label="Close size guide"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 grid gap-3 text-sm font-bold uppercase text-neutral-600">
              <div className="grid grid-cols-4 border-b border-neutral-200 pb-2 text-black">
                <span>Size</span>
                <span>Chest</span>
                <span>Waist</span>
                <span>Fit</span>
              </div>
              {[
                ["S", "36-38", "28-30", "Slim"],
                ["M", "39-41", "31-33", "Regular"],
                ["L", "42-44", "34-36", "Relaxed"],
                ["XL", "45-47", "37-39", "Oversized"],
                ["OS", "One", "One", "Adjustable"],
              ].map((row) => (
                <div key={row[0]} className="grid grid-cols-4">
                  {row.map((cell) => (
                    <span key={cell}>{cell}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
