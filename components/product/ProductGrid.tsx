"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import type { Product, ProductCategory } from "@/types/product";
import { StateBlock } from "@/components/common/StateBlock";
import { ProductCard } from "./ProductCard";

type ActiveCategory = "All" | ProductCategory;
type SortMode = "newest" | "price-asc" | "price-desc";

type ProductGridProps = {
  products: Product[];
  initialCategory?: ActiveCategory;
};

export function ProductGrid({
  initialCategory = "All",
  products,
}: ProductGridProps) {
  const [activeCategory, setActiveCategory] =
    useState<ActiveCategory>(initialCategory);
  const [query, setQuery] = useState("");
  const [selectedSize, setSelectedSize] = useState("All");
  const [saleOnly, setSaleOnly] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const productCategories = useMemo(
    () =>
      ["All", ...Array.from(new Set(products.map((product) => product.category)))] as
        | ActiveCategory[]
        | ["All"],
    [products],
  );
  const allSizes = useMemo(
    () => Array.from(new Set(products.flatMap((product) => product.sizes))).sort(),
    [products],
  );
  const highestPrice = useMemo(
    () => Math.max(...products.map((product) => product.price), 0),
    [products],
  );
  const [maxPrice, setMaxPrice] = useState(highestPrice);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products
      .filter((product) => {
        const matchesCategory =
          activeCategory === "All" || product.category === activeCategory;
        const matchesQuery =
          normalizedQuery.length === 0 ||
          product.name.toLowerCase().includes(normalizedQuery) ||
          product.label.toLowerCase().includes(normalizedQuery) ||
          product.category.toLowerCase().includes(normalizedQuery);
        const matchesSize =
          selectedSize === "All" || product.sizes.includes(selectedSize);
        const matchesSale = !saleOnly || product.isSale;
        const matchesPrice = product.price <= maxPrice;

        return (
          matchesCategory &&
          matchesQuery &&
          matchesSize &&
          matchesSale &&
          matchesPrice
        );
      })
      .sort((a, b) => {
        if (sortMode === "price-asc") {
          return a.price - b.price;
        }

        if (sortMode === "price-desc") {
          return b.price - a.price;
        }

        return b.releaseOrder - a.releaseOrder;
      });
  }, [
    activeCategory,
    maxPrice,
    products,
    query,
    saleOnly,
    selectedSize,
    sortMode,
  ]);

  const hasActiveFilters =
    activeCategory !== "All" ||
    query.length > 0 ||
    selectedSize !== "All" ||
    saleOnly ||
    maxPrice !== highestPrice ||
    sortMode !== "newest";

  function clearFilters() {
    setActiveCategory("All");
    setQuery("");
    setSelectedSize("All");
    setSaleOnly(false);
    setMaxPrice(highestPrice);
    setSortMode("newest");
  }

  return (
    <section className="mt-12">
      <div className="grid gap-6 border-b border-neutral-200 pb-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-x-5 gap-y-3">
            {productCategories.map((category) => {
              const isActive = category === activeCategory;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`text-sm font-bold uppercase tracking-[-0.03em] underline-offset-4 transition ${
                    isActive
                      ? "text-black underline"
                      : "text-neutral-500 hover:text-black"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          <label className="flex h-11 w-full items-center gap-3 border border-neutral-200 px-3 lg:w-72">
            <Search className="size-4 text-neutral-500" aria-hidden="true" />
            <span className="sr-only">Search products</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search product"
              className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold uppercase text-black outline-none placeholder:text-neutral-400"
            />
          </label>
        </div>

        <div className="grid gap-4 border border-neutral-200 p-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-end">
          <div>
            <label
              htmlFor="sort-products"
              className="text-xs font-black uppercase text-neutral-500"
            >
              Sort
            </label>
            <select
              id="sort-products"
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="mt-2 h-11 w-full bg-neutral-100 px-3 text-sm font-black uppercase outline-none"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price low to high</option>
              <option value="price-desc">Price high to low</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="size-filter"
              className="text-xs font-black uppercase text-neutral-500"
            >
              Size
            </label>
            <select
              id="size-filter"
              value={selectedSize}
              onChange={(event) => setSelectedSize(event.target.value)}
              className="mt-2 h-11 w-full bg-neutral-100 px-3 text-sm font-black uppercase outline-none"
            >
              <option value="All">All sizes</option>
              {allSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs font-black uppercase text-neutral-500">
              <label htmlFor="price-filter">Max price</label>
              <span>${maxPrice}</span>
            </div>
            <input
              id="price-filter"
              type="range"
              min={30}
              max={highestPrice}
              step={10}
              value={maxPrice}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
              className="mt-4 w-full accent-black"
            />
          </div>

          <label className="flex h-11 items-center gap-3 bg-neutral-100 px-3 text-sm font-black uppercase">
            <input
              type="checkbox"
              checked={saleOnly}
              onChange={(event) => setSaleOnly(event.target.checked)}
              className="size-4 accent-black"
            />
            Sale only
          </label>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="inline-flex h-11 items-center justify-center gap-2 border border-neutral-200 px-4 text-xs font-black uppercase transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300"
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Clear
          </button>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between text-xs font-bold uppercase text-neutral-500">
        <p>
          Showing {filteredProducts.length} of {products.length}
        </p>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="text-black underline underline-offset-4"
          >
            Clear all filters
          </button>
        ) : null}
      </div>

      {filteredProducts.length > 0 ? (
        <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-8 border border-neutral-200">
          <StateBlock
            eyebrow="(No Results)"
            title="No Products Found"
            message="Try another search term or reset the category, size, price, and sale filters to return to the full drop."
            actionHref="/products"
            actionLabel="Shop All"
          />
        </div>
      )}
    </section>
  );
}
