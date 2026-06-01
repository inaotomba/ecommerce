import type { Metadata } from "next";
import { WishlistView } from "@/components/product/WishlistView";
import { getCatalogProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Wishlist | Local",
  description: "Saved product wishlist for the Local store.",
};

export default async function WishlistPage() {
  const products = await getCatalogProducts();

  return (
    <div className="bg-white text-black">
      <WishlistView products={products} />
    </div>
  );
}
