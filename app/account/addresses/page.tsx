import type { Metadata } from "next";
import Link from "next/link";
import { AddressBookView } from "@/components/account/AddressBookView";

export const metadata: Metadata = {
  title: "Saved Addresses | Local",
  description:
    "Manage saved shipping and billing addresses for your Local account.",
};

export default function SavedAddressesPage() {
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
            Saved Addresses
          </h1>
          <p className="mt-8 max-w-xl text-sm font-bold uppercase leading-5 text-neutral-500">
            Add, edit, delete, and set default shipping or billing addresses for
            the signed-in Supabase user.
          </p>
        </div>

        <div className="py-12">
          <AddressBookView />
        </div>
      </section>
    </div>
  );
}
