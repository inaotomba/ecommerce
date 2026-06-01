import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/CheckoutView";

export const metadata: Metadata = {
  title: "Checkout | Local",
  description:
    "Enter shipping details and review the placeholder payment step for your Local order.",
};

export default function CheckoutPage() {
  return (
    <div className="bg-white text-black">
      <CheckoutView />
    </div>
  );
}
