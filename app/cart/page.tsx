import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Cart | Local",
  description: "Review your Local order, adjust quantities, and apply a promo code.",
};

export default function CartPage() {
  return (
    <div className="bg-white text-black">
      <CartView />
    </div>
  );
}
