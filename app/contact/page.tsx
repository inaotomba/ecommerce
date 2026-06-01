import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/common/ContactForm";

const contactDetails = [
  {
    label: "Email:",
    value: "hello@local.co",
  },
  {
    label: "Phone:",
    value: "+44 20 7946 0958",
  },
  {
    label: "Address:",
    value: "71-75 Shelton Street, Covent Garden,\nLondon, WC2H 9JQ, United Kingdom",
  },
];

const socialLinks = ["IG", "X", "FB", "YT"];

export const metadata: Metadata = {
  title: "Contact | Local",
  description:
    "Contact Local support for order, delivery, product, and store questions.",
};

export default function ContactPage() {
  return (
    <div className="bg-white text-black">
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
          <div>
            <p className="text-base font-bold uppercase tracking-[-0.03em]">
              (Support)
            </p>
            <h1 className="mt-6 text-5xl font-black uppercase leading-none tracking-[-0.07em] sm:text-6xl">
              Need Help?
            </h1>
            <p className="mt-8 max-w-lg text-lg font-medium uppercase leading-6 tracking-[-0.03em] text-neutral-600">
              Whatever you need, we are just a message away. Our team will get
              back to you within 24 hours.
            </p>

            <div className="mt-20 grid gap-10">
              {contactDetails.map((detail) => (
                <div key={detail.label}>
                  <h2 className="text-base font-bold uppercase tracking-[-0.03em]">
                    {detail.label}
                  </h2>
                  <p className="mt-4 whitespace-pre-line text-base font-medium leading-6 text-neutral-600">
                    {detail.value}
                  </p>
                </div>
              ))}

              <div>
                <h2 className="text-base font-bold uppercase tracking-[-0.03em]">
                  Follow Us:
                </h2>
                <div className="mt-4 flex gap-3">
                  {socialLinks.map((social) => (
                    <Link
                      key={social}
                      href="/"
                      className="flex size-8 items-center justify-center rounded-full border-2 border-black text-xs font-black uppercase transition hover:bg-black hover:text-white"
                      aria-label={`Follow us on ${social}`}
                    >
                      {social}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 lg:pt-64">
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}
