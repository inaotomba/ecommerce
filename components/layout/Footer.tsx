import Link from "next/link";
import { NewsletterForm } from "@/components/common/NewsletterForm";

const legalLinks = ["Terms & Conditions", "Privacy Policy", "Refund Policy"];
const quickLinks = ["Shop All", "Categories", "Wishlist", "Account", "Contact"];

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white text-black">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex justify-between text-xs font-bold uppercase text-neutral-600">
          <span>No excess.</span>
          <span>Since 2026</span>
        </div>

        <p className="mt-8 select-none overflow-hidden text-[24vw] font-black uppercase leading-[0.72] tracking-[-0.095em] text-black sm:text-[18vw] lg:text-[168px]">
          LOCAL
        </p>

        <div className="mt-12 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <h2 className="text-xs font-black uppercase">
              Subscribe to our newsletter
            </h2>
            <NewsletterForm />
            <p className="mt-6 max-w-sm text-xs font-bold uppercase leading-5 text-neutral-500">
              Local is a modular clothing system built for everyday movement.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-black uppercase">Legal</h2>
            <ul className="mt-5 space-y-3 text-xs font-bold uppercase text-neutral-600">
              {legalLinks.map((link) => (
                <li key={link}>
                  <Link href="/legal" className="underline-offset-4 hover:underline">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-black uppercase">Quick links</h2>
            <ul className="mt-5 space-y-3 text-xs font-bold uppercase text-neutral-600">
              {quickLinks.map((link) => (
                <li key={link}>
                  <Link
                    href={
                      link === "Shop All"
                        ? "/products"
                        : `/${link.toLowerCase()}`
                    }
                    className="underline-offset-4 hover:underline"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-12 text-xs font-bold uppercase text-neutral-500">
          (c) 2026 Local Commerce. Built for the first drop.
        </p>
      </div>
    </footer>
  );
}
