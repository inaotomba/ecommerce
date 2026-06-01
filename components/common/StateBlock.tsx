import Link from "next/link";

type StateBlockProps = {
  eyebrow: string;
  title: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
  secondaryActionHref?: string;
  secondaryActionLabel?: string;
};

export function StateBlock({
  eyebrow,
  title,
  message,
  actionHref,
  actionLabel,
  secondaryActionHref,
  secondaryActionLabel,
}: StateBlockProps) {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-7xl items-center px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="w-full border-y border-neutral-200 py-12">
        <p className="text-base font-bold uppercase tracking-[-0.03em]">
          {eyebrow}
        </p>
        <h1 className="mt-6 max-w-4xl text-5xl font-black uppercase leading-none tracking-[-0.07em] sm:text-6xl">
          {title}
        </h1>
        <p className="mt-8 max-w-lg text-sm font-bold uppercase leading-5 text-neutral-500">
          {message}
        </p>
        {(actionHref && actionLabel) || (secondaryActionHref && secondaryActionLabel) ? (
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            {actionHref && actionLabel ? (
              <Link
                href={actionHref}
                className="inline-flex h-12 items-center justify-center bg-black px-8 text-sm font-black uppercase text-white transition hover:bg-neutral-800"
              >
                {actionLabel}
              </Link>
            ) : null}
            {secondaryActionHref && secondaryActionLabel ? (
              <Link
                href={secondaryActionHref}
                className="inline-flex h-12 items-center justify-center border border-neutral-200 px-8 text-sm font-black uppercase transition hover:bg-neutral-100"
              >
                {secondaryActionLabel}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function LoadingBlock() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-7xl items-center px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="w-full">
        <p className="text-base font-bold uppercase tracking-[-0.03em]">
          (Loading)
        </p>
        <div className="mt-6 h-16 max-w-3xl animate-pulse bg-neutral-200 sm:h-20" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index}>
              <div className="h-4 w-24 animate-pulse bg-neutral-200" />
              <div className="mt-3 aspect-square animate-pulse bg-neutral-200" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
