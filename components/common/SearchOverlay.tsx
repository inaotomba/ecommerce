"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Search, X } from "lucide-react";
import type { Product } from "@/types/product";

type SearchOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
};

export function SearchOverlay({ isOpen, onClose, products }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    inputRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return products.slice(0, 5);
    }

    return products
      .filter((product) =>
        [
          product.name,
          product.category,
          product.label,
          product.description,
          product.sizes.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      )
      .slice(0, 6);
  }, [products, query]);

  const searchPanel = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-overlay-title"
      className={`fixed inset-0 z-[90] overflow-y-auto bg-white text-black transition duration-300 ${
        isOpen
          ? "visible pointer-events-auto opacity-100"
          : "invisible pointer-events-none opacity-0"
      }`}
      aria-hidden={!isOpen}
    >
      <div
        className={`mx-auto flex min-h-dvh max-w-7xl flex-col px-4 transition duration-300 sm:px-6 lg:px-8 ${
          isOpen ? "translate-y-0" : "-translate-y-4"
        }`}
      >
        <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-neutral-200 bg-white">
          <p
            id="search-overlay-title"
            className="text-xs font-black uppercase tracking-[-0.03em]"
          >
            Product Search
          </p>
          <button
            type="button"
            onClick={onClose}
            className="flex size-11 items-center justify-center bg-black text-white shadow-sm transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            aria-label="Close search"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <label className="mt-8 flex items-center gap-4 border-b-2 border-black pb-4 sm:mt-12">
          <Search className="size-6 shrink-0 text-black sm:size-7" aria-hidden="true" />
          <span className="sr-only">Search products</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search black jacket, hoodie, cap..."
            className="min-w-0 flex-1 bg-transparent text-2xl font-black uppercase leading-none outline-none placeholder:text-neutral-300 sm:text-5xl"
          />
        </label>

        <div className="mt-8 flex items-center justify-between text-xs font-bold uppercase text-neutral-500">
          <p>{results.length} matches</p>
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-black underline underline-offset-4"
            >
              Clear
            </button>
          ) : null}
        </div>

        {results.length > 0 ? (
          <div className="mt-6 grid divide-y divide-neutral-200 border-y border-neutral-200">
            {results.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                onClick={onClose}
                className="grid grid-cols-[72px_1fr] items-center gap-4 py-4 transition hover:bg-neutral-50 sm:grid-cols-[84px_1fr_auto]"
              >
                <div className="aspect-square overflow-hidden bg-neutral-200">
                  <div
                    className="h-full w-full bg-cover bg-center grayscale"
                    style={{ backgroundImage: `url(${product.image})` }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase text-neutral-500">
                    {product.label}
                  </p>
                  <h2 className="mt-1 break-words text-xl font-black uppercase leading-none sm:text-2xl">
                    {product.name}
                  </h2>
                  <p className="mt-2 text-xs font-black uppercase text-neutral-500 sm:hidden">
                    ${product.price}
                  </p>
                </div>
                <p className="hidden text-xs font-black uppercase sm:block">
                  ${product.price}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 border-y border-neutral-200 py-10">
            <h2 className="text-4xl font-black uppercase leading-none">
              No Results
            </h2>
            <p className="mt-4 text-sm font-bold uppercase leading-5 text-neutral-500">
              Try a product name, category, or size. The search is powered by
              local product data only.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(searchPanel, document.body);
}
