import type { ReactNode } from "react";
import { CartSync } from "@/components/common/CartSync";
import { StoreHydrator } from "@/components/common/StoreHydrator";
import { ToastViewport } from "@/components/common/ToastViewport";
import { WishlistSync } from "@/components/common/WishlistSync";
import { getCatalogProducts } from "@/lib/catalog";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

type SiteShellProps = {
  children: ReactNode;
};

export async function SiteShell({ children }: SiteShellProps) {
  const products = await getCatalogProducts();

  return (
    <div className="flex min-h-screen flex-col bg-white text-black">
      <StoreHydrator />
      <CartSync products={products} />
      <WishlistSync products={products} />
      <Navbar searchProducts={products} />
      <main className="flex-1">{children}</main>
      <Footer />
      <ToastViewport /> 
    </div>
  );
}
