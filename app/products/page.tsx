import type { Metadata } from "next";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getCatalogProducts } from "@/lib/catalog";
import type { ProductCategory } from "@/types/product";

export const metadata: Metadata = {
  title: "Shop All | Local",
  description:
    "Browse every product in the Local apparel drop with category filters and search.",
};

type ProductsPageProps = {
  searchParams: Promise<{
    category?: string;
  }>;
};

type ActiveCategory = "All" | ProductCategory;

function getInitialCategory(category?: string): ActiveCategory {
  const categories: ProductCategory[] = [
    "Outerwear",
    "Tops",
    "Bottoms",
    "Accessories",
  ];
  const match = categories.find(
    (item) => item.toLowerCase() === category?.toLowerCase(),
  );

  return match ?? "All";
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category } = await searchParams;
  const initialCategory = getInitialCategory(category);
  const products = await getCatalogProducts();

  return (
    <div className="bg-white text-black">
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex items-end justify-between gap-6">
          <h1 className="text-5xl font-black uppercase leading-none tracking-[-0.07em] sm:text-6xl">
            All Products
          </h1>
          <p className="mb-1 text-base font-bold uppercase tracking-[-0.03em] text-neutral-700">
            ({products.length})
          </p>
        </div>

        <div className="mt-8 aspect-[16/3.2] min-h-40 overflow-hidden bg-black">
          <div
            className="h-full w-full bg-cover bg-center grayscale"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1507680434567-5739c80be1ac?auto=format&fit=crop&w=1800&q=80)",
            }}
          />
        </div>

        <ProductGrid initialCategory={initialCategory} products={products} />
      </section>
    </div>
  );
}
