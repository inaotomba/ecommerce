import type { Metadata } from "next";
import Link from "next/link";
import { OrderHistoryView } from "@/components/account/OrderHistoryView";

export const metadata: Metadata = {
  title: "Order History | Local",
  description: "View saved Local orders for your signed-in account.",
};

export default function OrderHistoryPage() {
  return (
    <div className="bg-white text-black">
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="border-b border-neutral-200 pb-10">
          <Link
            href="/account"
            className="text-xs font-black uppercase underline decoration-2 underline-offset-4"
          >
            Back To Account
          </Link>
          <p className="mt-8 text-base font-bold uppercase tracking-[-0.03em]">
            (Account)
          </p>
          <h1 className="mt-6 text-5xl font-black uppercase leading-none tracking-[-0.07em] sm:text-6xl">
            Order History
          </h1>
          <p className="mt-8 max-w-xl text-sm font-bold uppercase leading-5 text-neutral-500">
            Review unpaid and fulfilled order records saved in Supabase for the
            signed-in user.
          </p>
        </div>

        <div className="py-12">
          <OrderHistoryView />
        </div>
      </section>
    </div>
  );
}
