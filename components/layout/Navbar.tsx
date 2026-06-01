"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { AuthNavLink } from "@/components/account/AuthNavLink";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartNavLink } from "@/components/cart/CartNavLink";
import { SearchOverlay } from "@/components/common/SearchOverlay";
import type { Product } from "@/types/product";

const navItems = [
  { href: "/products", label: "Shop All" },
  { href: "/categories", label: "Categories" },
  { href: "/contact", label: "Contact" },
];

type NavbarProps = {
  searchProducts: Product[];
};

export function Navbar({ searchProducts }: NavbarProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const hasOpenPanel = isMenuOpen || isSearchOpen || isCartOpen;

  useEffect(() => {
    document.body.style.overflow = hasOpenPanel ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [hasOpenPanel]);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <nav
        className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <Link
          href="/"
          onClick={closeMenu}
          className="text-xs font-black uppercase tracking-[-0.03em] text-black"
          aria-label="Local home"
        >
          Local.
        </Link>

        <div className="hidden items-center gap-5 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-xs font-bold uppercase tracking-[-0.02em] underline-offset-4 transition hover:underline ${
                isActive(item.href) ? "text-black underline" : "text-neutral-500"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              closeMenu();
              setIsSearchOpen(true);
            }}
            className="inline-flex size-9 items-center justify-center text-black transition hover:bg-neutral-100"
            aria-label="Search products"
          >
            <Search className="size-5" aria-hidden="true" />
          </button>

          <AuthNavLink />

          <CartNavLink
            onOpenCart={() => {
              closeMenu();
              setIsCartOpen(true);
            }}
          />

          <button
            type="button"
            onClick={() => setIsMenuOpen((current) => !current)}
            className="inline-flex size-9 items-center justify-center border border-neutral-200 text-black transition hover:bg-neutral-100 md:hidden"
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
          >
            {isMenuOpen ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      <div
        id="mobile-navigation"
        className={`overflow-hidden border-t border-neutral-200 bg-white transition-[max-height,opacity] duration-300 md:hidden ${
          isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mx-auto grid max-w-7xl px-4 py-4 sm:px-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              className={`border-b border-neutral-100 py-4 text-3xl font-black uppercase leading-none tracking-[-0.06em] ${
                isActive(item.href) ? "text-black underline" : "text-black"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/account"
            onClick={closeMenu}
            className={`border-b border-neutral-100 py-4 text-3xl font-black uppercase leading-none tracking-[-0.06em] ${
              isActive("/account") ? "text-black underline" : "text-black"
            }`}
          >
            Account
          </Link>
          <button
            type="button"
            onClick={() => {
              closeMenu();
              setIsCartOpen(true);
            }}
            className="py-4 text-left text-3xl font-black uppercase leading-none tracking-[-0.06em] text-black"
          >
            Cart
          </button>
        </div>
      </div>

      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={searchProducts}
      />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}
