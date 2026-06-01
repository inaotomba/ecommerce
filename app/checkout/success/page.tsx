import Link from "next/link";

type CheckoutSuccessPageProps = {
  searchParams: Promise<{
    order?: string;
  }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const { order } = await searchParams;

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-7xl items-center px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="w-full border-y border-neutral-200 py-12">
        <p className="text-base font-bold uppercase tracking-[-0.03em]">
          (Order Request Sent)
        </p>
        <h1 className="mt-6 max-w-4xl text-5xl font-black uppercase leading-none tracking-[-0.07em] sm:text-6xl">
          Order Request Received
        </h1>
        <p className="mt-8 max-w-lg text-sm font-bold uppercase leading-5 text-neutral-500">
          No online payment was collected. The store can now confirm stock,
          delivery, and payment manually before fulfilling this order.
        </p>
        {order ? (
          <p className="mt-6 inline-flex border border-neutral-200 px-4 py-3 text-sm font-black uppercase">
            Order {order}
          </p>
        ) : null}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/products"
            className="inline-flex h-12 items-center justify-center bg-black px-8 text-sm font-black uppercase text-white transition hover:bg-neutral-800"
          >
            Keep Shopping
          </Link>
          <Link
            href="/account/orders"
            className="inline-flex h-12 items-center justify-center border border-neutral-200 px-8 text-sm font-black uppercase transition hover:bg-neutral-100"
          >
            Order History
          </Link>
        </div>
      </div>
    </section>
  );
}
