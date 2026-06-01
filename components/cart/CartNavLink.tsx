"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/hooks/useCartStore";

type CartNavLinkProps = {
  onOpenCart?: () => void;
};

export function CartNavLink({ onOpenCart }: CartNavLinkProps) {
  const itemCount = useCartStore((state) => state.itemCount());

  if (onOpenCart) {
    return (
      <button
        type="button"
        onClick={onOpenCart}
        className="relative inline-flex size-9 items-center justify-center bg-black text-white transition hover:bg-neutral-800"
        aria-label="Open cart"
      >
        <ShoppingBag className="size-4" aria-hidden="true" />
        <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-white text-[10px] font-black text-black ring-1 ring-black">
          {itemCount}
        </span>
      </button>
    );
  }

  return (
    <Link
      href="/cart"
      className="relative inline-flex size-9 items-center justify-center bg-black text-white transition hover:bg-neutral-800"
      aria-label="Cart"
    >
      <ShoppingBag className="size-4" aria-hidden="true" />
      <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-white text-[10px] font-black text-black ring-1 ring-black">
        {itemCount}
      </span>
    </Link>
  );
}
