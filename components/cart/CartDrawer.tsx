"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { useCartStore } from "@/hooks/useCartStore";
import { useToastStore } from "@/hooks/useToastStore";

type CartDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(value);
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const showToast = useToastStore((state) => state.showToast);
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );
  const freeShippingTarget = 75;
  const freeShippingRemaining = Math.max(freeShippingTarget - subtotal, 0);
  const shippingProgress = Math.min((subtotal / freeShippingTarget) * 100, 100);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  function handleClearCart() {
    clearCart();
    showToast("Cart cleared");
  }

  const drawer = (
    <div
      className={`fixed inset-0 z-[80] transition duration-300 ${
        isOpen
          ? "visible pointer-events-auto"
          : "invisible pointer-events-none"
      }`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        onClick={onClose}
        className={`fixed inset-0 bg-black/45 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Close cart overlay"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="mini-cart-title"
        className={`fixed inset-y-0 right-0 z-10 flex w-full flex-col overflow-hidden border-l border-neutral-200 bg-white shadow-2xl transition-transform duration-300 ease-out sm:w-[440px] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="relative shrink-0 border-b border-neutral-200 px-4 py-4 pr-20 sm:px-6 sm:py-5 sm:pr-24">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase text-neutral-500">
                ({itemCount} {itemCount === 1 ? "Item" : "Items"})
              </p>
              <h2
                id="mini-cart-title"
                className="mt-2 text-3xl font-black uppercase leading-none sm:text-4xl"
              >
                Mini Cart
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-20 flex size-11 shrink-0 items-center justify-center bg-black text-white shadow-sm transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 sm:right-6 sm:top-5"
              aria-label="Close cart drawer"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          {items.length > 0 ? (
            <div className="mt-5 border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-center justify-between gap-4 text-[11px] font-black uppercase text-neutral-500">
                <span>
                  {freeShippingRemaining === 0
                    ? "Free delivery unlocked"
                    : `${formatCurrency(freeShippingRemaining)} from free delivery`}
                </span>
                <span>{Math.round(shippingProgress)}%</span>
              </div>
              <div className="mt-3 h-2 bg-neutral-100">
                <div
                  className="h-full bg-black transition-[width] duration-300"
                  style={{ width: `${shippingProgress}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col justify-center px-4 py-8 sm:px-6">
            <p className="text-[11px] font-black uppercase text-neutral-500">
              (Empty)
            </p>
            <h3 className="mt-3 text-4xl font-black uppercase leading-none sm:text-5xl">
              Your Cart Is Quiet
            </h3>
            <p className="mt-5 max-w-xs text-sm font-bold uppercase leading-5 text-neutral-500">
              Add a piece from the latest drop and it will appear here instantly.
            </p>
            <Link
              href="/products"
              onClick={onClose}
              className="mt-8 flex h-12 items-center justify-center bg-black text-sm font-black uppercase text-white transition hover:bg-neutral-800"
            >
              Shop All
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-2 sm:px-6">
              <div className="divide-y divide-neutral-200">
                {items.map((item) => (
                  <div
                    key={`${item.product.id}-${item.size}`}
                    className="grid grid-cols-[84px_1fr] gap-4 py-4 sm:grid-cols-[96px_1fr]"
                  >
                    <Link
                      href={`/products/${item.product.id}`}
                      onClick={onClose}
                      className="aspect-square overflow-hidden bg-neutral-200"
                      aria-label={`View ${item.product.name}`}
                    >
                      <div
                        className="h-full w-full bg-cover bg-center grayscale transition hover:scale-105 hover:grayscale-0"
                        style={{ backgroundImage: `url(${item.product.image})` }}
                      />
                    </Link>

                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold uppercase text-neutral-500">
                            {item.product.label}
                          </p>
                          <Link
                            href={`/products/${item.product.id}`}
                            onClick={onClose}
                            className="mt-1 block break-words text-base font-black uppercase leading-none hover:underline sm:text-lg"
                          >
                            {item.product.name}
                          </Link>
                          <p className="mt-2 text-[11px] font-bold uppercase text-neutral-500">
                            Size {item.size}
                          </p>
                        </div>

                        <p className="shrink-0 text-xs font-black uppercase">
                          {formatCurrency(item.product.price * item.quantity)}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex h-9 items-center border border-neutral-200">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.size,
                                item.quantity - 1,
                              )
                            }
                            disabled={item.quantity === 1}
                            className="flex size-9 items-center justify-center transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300"
                            aria-label={`Decrease ${item.product.name} quantity`}
                          >
                            <Minus className="size-4" aria-hidden="true" />
                          </button>
                          <span className="w-9 text-center text-xs font-black">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.size,
                                item.quantity + 1,
                              )
                            }
                            className="flex size-9 items-center justify-center transition hover:bg-neutral-100"
                            aria-label={`Increase ${item.product.name} quantity`}
                          >
                            <Plus className="size-4" aria-hidden="true" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            removeItem(item.product.id, item.size);
                            showToast(`${item.product.name} removed`);
                          }}
                          className="inline-flex items-center gap-2 text-[11px] font-black uppercase text-neutral-500 underline-offset-4 transition hover:text-black hover:underline"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="shrink-0 border-t border-neutral-200 bg-white px-4 py-4 shadow-[0_-16px_30px_rgba(0,0,0,0.05)] sm:px-6 sm:py-5">
              <div className="grid gap-3 text-sm font-bold uppercase">
                <div className="flex items-center justify-between text-neutral-500">
                  <span>Subtotal</span>
                  <span className="text-black">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-500">
                  <span>Delivery</span>
                  <span className="text-black">
                    {freeShippingRemaining === 0
                      ? "Free"
                      : "Calculated at checkout"}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="flex h-12 items-center justify-center border border-neutral-200 text-sm font-black uppercase transition hover:bg-neutral-100"
                >
                  View Cart
                </Link>
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="flex h-12 items-center justify-center bg-black text-sm font-black uppercase text-white transition hover:bg-neutral-800"
                >
                  Checkout
                </Link>
              </div>

              <button
                type="button"
                onClick={handleClearCart}
                className="mt-4 h-10 w-full text-xs font-black uppercase text-neutral-500 underline-offset-4 transition hover:text-black hover:underline"
              >
                Clear Cart
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(drawer, document.body);
}
