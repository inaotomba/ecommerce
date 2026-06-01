import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product/ProductDetail";
import { getCatalogProduct, getCatalogProducts } from "@/lib/catalog";

type ProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateStaticParams() {
  const products = await getCatalogProducts();

  return products.map((product) => ({
    id: product.id,
  }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getCatalogProduct(id);

  if (!product) {
    return {
      title: "Product Not Found | Local",
    };
  }

  return {
    title: `${product.name} | Local`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const products = await getCatalogProducts();
  const product = products.find((item) => item.id === id);

  if (!product) {
    notFound();
  }

  return (
    <div className="bg-white text-black">
      <ProductDetail product={product} products={products} />
    </div>
  );
}
