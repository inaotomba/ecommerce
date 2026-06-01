import Link from "next/link";


const featuredProducts = [
  {
    category: "OUTERWEAR",
    name: "BLACK JACKET 01",
    image:
      "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=80",
  },
  {
    category: "OUTERWEAR",
    name: "TECH COAT 02",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
  },
  {
    category: "PANTS",
    name: "UTILITY PANTS 03",
    badge: "SALE",
    image:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80",
  },
  {
    category: "CARGO PANTS",
    name: "CARGO SYSTEM 04",
    badge: "SALE",
    image:
      "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=900&q=80",
  },
];

const arrivals = [
  {
    category: "BASEBALL CAPS",
    name: "ARCHIVE CAP 08",
    badge: "SALE",
    image:
      "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=80",
  },
  ...featuredProducts.slice(0, 1),
  featuredProducts[3],
  {
    category: "HOODIES",
    name: "HOODIE 05",
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80",
  },
];

const communityShots = [
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1507680434567-5739c80be1ac?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80&sat=-100",
];

function ProductCard({
  product,
}: {
  product: {
    category: string;
    name: string;
    image: string;
    badge?: string;
  };
}) {
  return (
    <article className="group">
      <div className="mb-3">
        <p className="text-[11px] font-medium uppercase text-neutral-500">
          {product.category}
        </p>
        <h3 className="text-base font-black uppercase leading-none tracking-[-0.03em] text-black sm:text-lg">
          {product.name}
        </h3>
      </div>
      <Link
        href="/products"
        className="relative block aspect-[4/5] overflow-hidden bg-neutral-200"
        aria-label={`View ${product.name}`}
      >
        {product.badge ? (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-black px-3 py-1 text-[10px] font-bold uppercase text-white">
            {product.badge}
          </span>
        ) : null}
        <div
          className="h-full w-full bg-cover bg-center grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0"
          style={{ backgroundImage: `url(${product.image})` }}
        />
      </Link>
    </article>
  );
}

function PromoStrip() {
  return (
    <div className="overflow-hidden bg-black py-4 text-white">
      <div className="flex w-max animate-[ticker_24s_linear_infinite] items-center gap-8 text-xs font-bold uppercase tracking-[-0.02em]">
        {Array.from({ length: 2 }).map((_, groupIndex) => (
          <div key={groupIndex} className="flex items-center gap-8">
            <span>Use code LOCAL10 for 10% off your first order</span>
            <span className="text-neutral-500">|</span>
            <span>Free local pickup</span>
            <span className="text-neutral-500">|</span>
            <span>Free delivery over $75</span>
            <span className="text-neutral-500">|</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-white text-black">
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
        <h1 className="select-none text-[22vw] font-black uppercase leading-[0.78] tracking-[-0.095em] text-black sm:text-[18vw] lg:text-[168px]">
          LOCAL
        </h1>

        <div className="mt-8 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[-0.02em]">
              (Our Bestsellers)
            </p>
            <h2 className="mt-1 text-4xl font-black uppercase leading-none tracking-[-0.06em] sm:text-5xl">
              Featured
            </h2>
          </div>
          <Link
            href="/products"
            className="text-xs font-black uppercase tracking-[-0.02em] underline decoration-2 underline-offset-4"
          >
            View all
          </Link>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.name} product={product} />
          ))}
        </div>
      </section>

      <PromoStrip />

      <section className="relative min-h-[460px] overflow-hidden bg-black text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-70 grayscale"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1507680434567-5739c80be1ac?auto=format&fit=crop&w=1800&q=80)",
          }}
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative mx-auto flex min-h-[460px] max-w-7xl items-end px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-lg">
            <p className="text-xs font-bold uppercase">(Not for everyone)</p>
            <h2 className="mt-2 text-4xl font-black uppercase leading-none tracking-[-0.06em] sm:text-5xl">
              Limited Pieces
            </h2>
            <p className="mt-5 max-w-sm text-sm font-bold uppercase leading-5">
              Made for those who know exactly what they are wearing. No logo
              noise, no excess, just structure and form.
            </p>
          </div>
        </div>
      </section>

      <div className="bg-black py-4 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-8 gap-y-3 px-4 text-xs font-bold uppercase sm:px-6 lg:px-8">
          <span>100% Secure Payment</span>
          <span className="text-neutral-500">|</span>
          <span>14 Days Return</span>
          <span className="text-neutral-500">|</span>
          <span>24/7 Support</span>
          <span className="text-neutral-500">|</span>
          <span>Local Dispatch</span>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase text-neutral-500">(Drop 01)</p>
        <div className="flex items-end justify-between gap-6">
          <h2 className="mt-2 max-w-4xl text-4xl font-black uppercase leading-none tracking-[-0.06em] sm:text-5xl">
            Exclusive Limited Arrivals
          </h2>
          <Link
            href="/products"
            className="hidden text-xs font-black uppercase tracking-[-0.02em] sm:inline-flex"
          >
            Shop all
          </Link>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {arrivals.map((product) => (
            <ProductCard key={`${product.category}-${product.name}`} product={product} />
          ))}
        </div>

        <div className="mt-10 flex flex-col justify-between gap-6 text-xs font-bold uppercase text-neutral-500 sm:flex-row">
          <p className="max-w-xs">
            A collection built on structure, simplicity, and consistent form.
          </p>
          <Link href="/products" className="text-black">
            Shop all
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase text-neutral-500">
          (They wear local)
        </p>
        <h2 className="mt-2 text-4xl font-black uppercase leading-none tracking-[-0.06em] sm:text-5xl">
          Watch them wear it
        </h2>
        <p className="mt-8 max-w-md text-xs font-bold uppercase leading-5 text-neutral-500">
          Unfiltered moments from those who chose the uniform. Authentic,
          effortless, and real.
        </p>

        <div className="mt-12 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {communityShots.map((image, index) => (
            <div
              key={image}
              className="aspect-[3/4] bg-neutral-200 bg-cover bg-center grayscale"
              style={{
                backgroundImage: `url(${image})`,
                marginTop: index % 2 === 0 ? "0" : "28px",
              }}
            />
          ))}
        </div>
      </section>

      {/* <section className="border-y border-neutral-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between text-xs font-bold uppercase text-neutral-600">
            <span>No excess.</span>
            <span>Since 2026</span>
          </div>
          <p className="mt-8 select-none overflow-hidden text-[24vw] font-black uppercase leading-[0.72] tracking-[-0.095em] text-black sm:text-[18vw] lg:text-[168px]">
            LOCAL
          </p>
        </div>
      </section> */}
    </div>
  );
}
