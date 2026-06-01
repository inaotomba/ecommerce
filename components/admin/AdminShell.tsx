"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  Boxes,
  Inbox,
  Image as ImageIcon,
  LayoutDashboard,
  ListOrdered,
  Package,
  ShieldAlert,
  Store,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

type AdminShellProps = {
  children: ReactNode;
};

type Profile = {
  email: string;
  full_name: string | null;
  role: string;
};

const adminLinks = [
  {
    href: "/admin",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    href: "/admin/orders",
    icon: ListOrdered,
    label: "Orders",
  },
  {
    href: "/admin/products",
    icon: Package,
    label: "Products",
  },
  {
    href: "/admin/inventory",
    icon: Boxes,
    label: "Inventory",
  },
  {
    href: "/admin/images",
    icon: ImageIcon,
    label: "Images",
  },
  {
    href: "/admin/messages",
    icon: Inbox,
    label: "Messages",
  },
];

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const client = supabase;
    let isActive = true;

    async function loadProfile(nextUser: User | null) {
      if (!isActive) {
        return;
      }

      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      const { data, error: profileError } = await client
        .from("profiles")
        .select("full_name,email,role")
        .eq("id", nextUser.id)
        .maybeSingle();

      if (!isActive) {
        return;
      }

      if (profileError) {
        setError(profileError.message);
        setProfile(null);
      } else {
        setError("");
        setProfile(data);
      }

      setIsLoading(false);
    }

    async function loadInitialUser() {
      const {
        data: { user: currentUser },
      } = await client.auth.getUser();

      await loadProfile(currentUser);
    }

    void loadInitialUser();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      void loadProfile(session?.user ?? null);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  if (!supabase) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Supabase Env Missing</CardTitle>
            <CardDescription>
              Add your Supabase URL and publishable key to .env.local, then
              restart the dev server.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="h-96 animate-pulse rounded-lg bg-neutral-100" />
          <div className="h-96 animate-pulse rounded-lg bg-neutral-100" />
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Admin Login Required</CardTitle>
            <CardDescription>
              Sign in with an account that has profiles.role set to admin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/account">
              <Button>Go To Account</Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldAlert className="size-8" aria-hidden="true" />
              <div>
                <CardTitle>Not Allowed</CardTitle>
                <CardDescription>
                  This account is signed in, but it is not an admin profile.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            {error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold uppercase text-red-700">
                {error}
              </p>
            ) : null}
            <Link href="/account">
              <Button variant="outline">Back To Account</Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:items-start">
        <aside className="rounded-lg border border-neutral-200 bg-white p-4 lg:sticky lg:top-20">
          <div className="flex items-start justify-between gap-3 border-b border-neutral-200 pb-4">
            <div>
              <p className="text-xs font-black uppercase text-neutral-500">
                Admin
              </p>
              <h1 className="mt-1 text-2xl font-black uppercase leading-none tracking-[-0.06em]">
                Local
              </h1>
            </div>
            <Badge>Admin</Badge>
          </div>

          <nav className="mt-4 grid gap-1" aria-label="Admin navigation">
            {adminLinks.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-black uppercase transition",
                    isActive
                      ? "bg-black text-white"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-black",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 rounded-md bg-neutral-100 p-3">
            <p className="text-xs font-black uppercase text-neutral-500">
              Signed In
            </p>
            <p className="mt-1 break-words text-sm font-black uppercase">
              {profile.full_name ?? profile.email}
            </p>
          </div>

          <Link
            href="/"
            className="mt-4 flex items-center justify-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm font-black uppercase transition hover:bg-neutral-100"
          >
            <Store className="size-4" aria-hidden="true" />
            Storefront
          </Link>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}
