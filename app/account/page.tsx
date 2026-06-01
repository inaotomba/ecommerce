import type { Metadata } from "next";
import { AccountView } from "@/components/account/AccountView";

export const metadata: Metadata = {
  title: "Account | Local",
  description:
    "Sign in to your Local account to manage profile, wishlist, addresses, and orders.",
};

export default function AccountPage() {
  return (
    <div className="bg-white text-black">
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="border-b border-neutral-200 pb-10">
          <p className="text-base font-bold uppercase tracking-[-0.03em]">
            (Account)
          </p>
          <h1 className="mt-6 text-5xl font-black uppercase leading-none tracking-[-0.07em] sm:text-6xl">
            Customer Space
          </h1>
          <p className="mt-8 max-w-xl text-sm font-bold uppercase leading-5 text-neutral-500">
            Sign in with Supabase Auth to load your customer profile and prepare
            account-backed commerce features.
          </p>
        </div>

        <div className="py-12">
          <AccountView />
        </div>
      </section>
    </div>
  );
}
