import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getCatalogCategories, getCatalogProducts } from "@/lib/catalog";
import type { ProductCategory } from "@/types/product";
import { ProductCard } from "@/components/product/ProductCard";

const categories: Array<{
  name: ProductCategory;
  description: string;
}> = [
  {
    name: "Outerwear",
    description: "Structured jackets and coats built for daily rotation.",
  },
  {
    name: "Tops",
    description: "Hoodies, tees, and shirts with a clean uniform feel.",
  },
  {
    name: "Bottoms",
    description: "Utility pants and cargo systems with functional shape.",
  },
  {
    name: "Accessories",
    description: "Caps and bags that finish the drop without extra noise.",
  },
];

export const metadata: Metadata = {
  title: "Categories | Local",
  description:
    "Browse Local apparel by category, including outerwear, tops, bottoms, and accessories.",
};

function getCategoryProducts(products: Awaited<ReturnType<typeof getCatalogProducts>>, category: ProductCategory) {
  return products.filter((product) => product.category === category);
}

export default async function CategoriesPage() {
  const products = await getCatalogProducts();
  const activeCategories = categories.filter((category) =>
    getCatalogCategories(products).includes(category.name),
  );

  return (
    <div className="bg-white text-black">
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex flex-col gap-8 border-b border-neutral-200 pb-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-base font-bold uppercase tracking-[-0.03em]">
              (Shop by type)
            </p>
            <h1 className="mt-6 text-5xl font-black uppercase leading-none tracking-[-0.07em] sm:text-6xl">
              Categories
            </h1>
          </div>
          <p className="max-w-md text-sm font-bold uppercase leading-5 text-neutral-500">
            Move through the collection by category, then jump into a filtered
            Shop All view when you are ready to browse.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {activeCategories.map((category) => {
            const categoryProducts = getCategoryProducts(products, category.name);
            const coverProduct = categoryProducts[0];

            return (
              <Link
                key={category.name}
                href={`/products?category=${category.name}`}
                className="group block"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-neutral-200">
                  <div
                    className="h-full w-full bg-cover bg-center grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0"
                    style={{ backgroundImage: `url(${coverProduct?.image ?? "/window.svg"})` }}
                  />
                  <div className="absolute inset-0 bg-black/15" />
                  <span className="absolute right-4 top-4 flex size-9 items-center justify-center bg-white text-black">
                    <ArrowUpRight className="size-5" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black uppercase leading-none tracking-[-0.06em]">
                      {category.name}
                    </h2>
                    <p className="mt-3 text-xs font-bold uppercase leading-5 text-neutral-500">
                      {category.description}
                    </p>
                  </div>
                  <p className="text-xs font-bold uppercase text-neutral-500">
                    ({categoryProducts.length})
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        {activeCategories.map((category) => {
          const categoryProducts = getCategoryProducts(products, category.name);

          return (
            <div key={category.name} className="border-t border-neutral-200 py-12">
              <div className="mb-8 flex items-end justify-between gap-6">
                <div>
                  <p className="text-xs font-bold uppercase text-neutral-500">
                    ({categoryProducts.length} items)
                  </p>
                  <h2 className="mt-2 text-4xl font-black uppercase leading-none tracking-[-0.06em]">
                    {category.name}
                  </h2>
                </div>
                <Link
                  href={`/products?category=${category.name}`}
                  className="text-xs font-black uppercase underline decoration-2 underline-offset-4"
                >
                  View all
                </Link>
              </div>

              <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                {categoryProducts.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
