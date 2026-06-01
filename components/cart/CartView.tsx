"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/hooks/useCartStore";
import { useToastStore } from "@/hooks/useToastStore";
import { StateBlock } from "@/components/common/StateBlock";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(value);
}

export function CartView() {
  const items = useCartStore((state) => state.items);
  const updateCartQuantity = useCartStore((state) => state.updateQuantity);
  const updateCartSize = useCartStore((state) => state.updateSize);
  const removeCartItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const showToast = useToastStore((state) => state.showToast);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  const subtotal = items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );
  const discount = promoApplied ? subtotal * 0.1 : 0;
  const delivery = subtotal > 0 && subtotal - discount < 75 ? 12 : 0;
  const total = Math.max(subtotal - discount + delivery, 0);
  const itemCount = items.reduce(
    (totalItems, item) => totalItems + item.quantity,
    0,
  );

  function applyPromo() {
    setPromoApplied(promoCode.trim().toUpperCase() === "LOCAL10");
  }

  if (items.length === 0) {
    return (
      <StateBlock
        eyebrow="(Cart)"
        title="Your Cart Is Empty"
        message="Add limited pieces from the shop to build your order. Your selected sizes will stay here while you move through the store."
        actionHref="/products"
        actionLabel="Shop All"
        secondaryActionHref="/categories"
        secondaryActionLabel="Categories"
      />
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="flex flex-col gap-8 border-b border-neutral-200 pb-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-base font-bold uppercase tracking-[-0.03em]">
            (Cart)
          </p>
          <h1 className="mt-6 text-5xl font-black uppercase leading-none tracking-[-0.07em] sm:text-6xl">
            Your Cart
          </h1>
        </div>
        <p className="text-sm font-bold uppercase text-neutral-500">
          {itemCount} {itemCount === 1 ? "item" : "items"} reserved for checkout
        </p>
        <button
          type="button"
          onClick={() => {
            clearCart();
            showToast("Cart cleared");
          }}
          className="text-xs font-black uppercase text-neutral-500 underline-offset-4 hover:text-black hover:underline"
        >
          Clear cart
        </button>
      </div>

      <div className="grid gap-12 py-12 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="grid gap-8">
          {items.map((item) => (
            <article
              key={item.product.id}
              className="grid gap-5 border-b border-neutral-200 pb-8 sm:grid-cols-[180px_1fr]"
            >
              <Link
                href={`/products/${item.product.id}`}
                className="block aspect-square overflow-hidden bg-neutral-200"
                aria-label={`View ${item.product.name}`}
              >
                <div
                  className="h-full w-full bg-cover bg-center grayscale transition hover:scale-105 hover:grayscale-0"
                  style={{ backgroundImage: `url(${item.product.image})` }}
                />
              </Link>

              <div className="flex flex-col justify-between gap-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase text-neutral-500">
                      {item.product.label}
                    </p>
                    <h2 className="mt-1 text-2xl font-black uppercase leading-none tracking-[-0.06em]">
                      {item.product.name}
                    </h2>
                    <label className="mt-4 block max-w-40">
                      <span className="text-xs font-bold uppercase text-neutral-500">
                        Size
                      </span>
                      <select
                        value={item.size}
                        onChange={(event) => {
                          updateCartSize(
                            item.product.id,
                            item.size,
                            event.target.value,
                          );
                          showToast(`${item.product.name} size updated`);
                        }}
                        className="mt-2 h-10 w-full bg-neutral-100 px-3 text-xs font-black uppercase outline-none"
                      >
                        {item.product.sizes.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p className="text-sm font-black uppercase">
                    {formatCurrency(item.product.price * item.quantity)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex h-11 items-center border border-neutral-200">
                    <button
                      type="button"
                      onClick={() =>
                        updateCartQuantity(
                          item.product.id,
                          item.size,
                          item.quantity - 1,
                        )
                      }
                      className="flex size-11 items-center justify-center transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300"
                      disabled={item.quantity === 1}
                      aria-label={`Decrease ${item.product.name} quantity`}
                    >
                      <Minus className="size-4" aria-hidden="true" />
                    </button>
                    <span className="w-10 text-center text-sm font-black">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateCartQuantity(
                          item.product.id,
                          item.size,
                          item.quantity + 1,
                        )
                      }
                      className="flex size-11 items-center justify-center transition hover:bg-neutral-100"
                      aria-label={`Increase ${item.product.name} quantity`}
                    >
                      <Plus className="size-4" aria-hidden="true" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      removeCartItem(item.product.id, item.size);
                      showToast(`${item.product.name} removed`);
                    }}
                    className="inline-flex items-center gap-2 text-xs font-black uppercase text-neutral-500 underline-offset-4 transition hover:text-black hover:underline"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="sticky top-20 border border-neutral-200 p-6">
          <h2 className="text-3xl font-black uppercase leading-none tracking-[-0.06em]">
            Summary
          </h2>

          <div className="mt-8 grid gap-4 border-b border-neutral-200 pb-6 text-sm font-bold uppercase">
            <div className="flex justify-between">
              <span className="text-neutral-500">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Discount</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Delivery</span>
              <span>{delivery === 0 ? "Free" : formatCurrency(delivery)}</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between text-lg font-black uppercase">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>

          <div className="mt-8">
            <label
              htmlFor="promo-code"
              className="text-xs font-black uppercase text-neutral-500"
            >
              Promo code
            </label>
            <div className="mt-3 flex gap-2">
              <input
                id="promo-code"
                value={promoCode}
                onChange={(event) => {
                  setPromoCode(event.target.value);
                  setPromoApplied(false);
                }}
                placeholder="LOCAL10"
                className="h-11 min-w-0 flex-1 bg-neutral-100 px-3 text-sm font-bold uppercase outline-none focus:bg-neutral-200"
              />
              <button
                type="button"
                onClick={applyPromo}
                className="h-11 bg-black px-4 text-xs font-black uppercase text-white transition hover:bg-neutral-800"
              >
                Apply
              </button>
            </div>
            {promoApplied ? (
              <p className="mt-3 text-xs font-bold uppercase text-neutral-500">
                LOCAL10 applied. 10% off your order.
              </p>
            ) : null}
          </div>

          <Link
            href="/checkout"
            className="mt-8 flex h-12 w-full items-center justify-center bg-black text-sm font-black uppercase text-white transition hover:bg-neutral-800"
          >
            Checkout
          </Link>

          <Link
            href="/products"
            className="mt-4 flex h-12 w-full items-center justify-center border border-neutral-200 text-sm font-black uppercase transition hover:bg-neutral-100"
          >
            Continue Shopping
          </Link>
        </aside>
      </div>
    </section>
  );
}
