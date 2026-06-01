"use client";

import { useEffect } from "react";
import Link from "next/link";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-7xl items-center px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="w-full border-y border-neutral-200 py-12">
        <p className="text-base font-bold uppercase tracking-[-0.03em]">
          (Error)
        </p>
        <h1 className="mt-6 max-w-4xl text-5xl font-black uppercase leading-none tracking-[-0.07em] sm:text-6xl">
          Something Broke
        </h1>
        <p className="mt-8 max-w-lg text-sm font-bold uppercase leading-5 text-neutral-500">
          The storefront hit an unexpected issue. Try again, or head back to the
          shop while we keep the interface steady.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-12 items-center justify-center bg-black px-8 text-sm font-black uppercase text-white transition hover:bg-neutral-800"
          >
            Try Again
          </button>
          <Link
            href="/products"
            className="inline-flex h-12 items-center justify-center border border-neutral-200 px-8 text-sm font-black uppercase transition hover:bg-neutral-100"
          >
            Shop All
          </Link>
        </div>
      </div>
    </section>
  );
}
