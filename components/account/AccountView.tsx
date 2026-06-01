"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AuthMode = "login" | "register";
type Notice = {
  tone: "error" | "success";
  message: string;
};
type Profile = {
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
};

const accountBlocks = [
  {
    href: "/wishlist",
    text: "Review products saved to your account-backed wishlist.",
    title: "Wishlist",
  },
  {
    href: "/account/addresses",
    text: "Manage shipping and billing addresses stored in Supabase for this account.",
    title: "Saved Addresses",
  },
  {
    href: "/account/orders",
    text: "View unpaid and completed orders saved from checkout.",
    title: "Order History",
  },
];

export function AccountView() {
  const supabase = createSupabaseBrowserClient();
  const [mode, setMode] = useState<AuthMode>("login");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(Boolean(supabase));
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setIsLoadingSession(false);
        return;
      }

      const { data, error } = await client
        .from("profiles")
        .select("full_name,email,phone,role")
        .eq("id", nextUser.id)
        .maybeSingle();

      if (!isActive) {
        return;
      }

      if (error) {
        setNotice({
          message:
            "Signed in, but the matching profile could not be loaded. Check the profiles row and RLS policy.",
          tone: "error",
        });
      }

      const metadataFullName = nextUser.user_metadata.full_name;

      setProfile(
        data ?? {
          email: nextUser.email ?? "No email",
          full_name:
            typeof metadataFullName === "string" ? metadataFullName : null,
          phone: null,
          role: "customer",
        },
      );
      setIsLoadingSession(false);
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

  async function createProfile(nextUser: User, nextFullName: string, nextEmail: string) {
    if (!supabase) {
      return;
    }

    const { error } = await supabase.from("profiles").upsert({
      email: nextEmail,
      full_name: nextFullName,
      id: nextUser.id,
      role: "customer",
    });

    if (error) {
      setNotice({
        message:
          "Account created, but profile creation failed. If email confirmation is enabled, log in after confirming your email.",
        tone: "error",
      });
      return;
    }

    setProfile({
      email: nextEmail,
      full_name: nextFullName,
      phone: null,
      role: "customer",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setNotice({
        message:
          "Supabase is not configured yet. Fill .env.local and restart the dev server.",
        tone: "error",
      });
      return;
    }

    setNotice(null);
    setIsSubmitting(true);

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedFullName = fullName.trim();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      setIsSubmitting(false);

      if (error) {
        setNotice({ message: error.message, tone: "error" });
        return;
      }

      setEmail(normalizedEmail);
      setPassword("");
      setNotice({ message: "Signed in successfully.", tone: "success" });
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      options: {
        data: {
          full_name: normalizedFullName,
        },
      },
      password,
    });

    setIsSubmitting(false);

    if (error) {
      setNotice({ message: error.message, tone: "error" });
      return;
    }

    if (data.user && data.session) {
      await createProfile(data.user, normalizedFullName, normalizedEmail);
      setNotice({ message: "Account created and signed in.", tone: "success" });
    } else {
      setNotice({
        message:
          "Account created. Check your email if confirmation is enabled, then sign in.",
        tone: "success",
      });
    }

    setEmail(normalizedEmail);
    setPassword("");
  }

  async function handleLogout() {
    if (!supabase) {
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.signOut();
    setIsSubmitting(false);

    if (error) {
      setNotice({ message: error.message, tone: "error" });
      return;
    }

    setNotice({ message: "Signed out.", tone: "success" });
  }

  if (!supabase) {
    return (
      <div className="border border-neutral-200 p-6">
        <p className="text-xs font-black uppercase text-neutral-500">
          (Setup Required)
        </p>
        <h2 className="mt-3 text-3xl font-black uppercase leading-none">
          Supabase Env Missing
        </h2>
        <p className="mt-5 text-sm font-bold uppercase leading-5 text-neutral-500">
          Add your project URL and publishable key to .env.local, then restart
          the dev server.
        </p>
      </div>
    );
  }

  if (isLoadingSession) {
    return (
      <div className="border border-neutral-200 p-6">
        <p className="text-xs font-black uppercase text-neutral-500">
          (Checking Session)
        </p>
        <div className="mt-4 h-10 max-w-sm animate-pulse bg-neutral-200" />
        <div className="mt-4 h-24 animate-pulse bg-neutral-100" />
      </div>
    );
  }

  if (user) {
    const visibleAccountBlocks =
      profile?.role === "admin"
        ? [
            {
              href: "/admin",
              text: "Open the protected admin dashboard for products, orders, inventory, and messages.",
              title: "Admin Dashboard",
            },
            ...accountBlocks,
          ]
        : accountBlocks;

    return (
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border border-neutral-200 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase text-neutral-500">
                (Signed In)
              </p>
              <h2 className="mt-3 text-3xl font-black uppercase leading-none">
                {profile?.full_name ?? user.email}
              </h2>
            </div>
            {profile?.role === "admin" ? (
              <span className="inline-flex items-center gap-2 bg-black px-3 py-2 text-xs font-black uppercase text-white">
                <ShieldCheck className="size-4" aria-hidden="true" />
                Admin
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 border border-neutral-200 px-3 py-2 text-xs font-black uppercase">
                <UserRound className="size-4" aria-hidden="true" />
                Customer
              </span>
            )}
          </div>

          <div className="mt-8 grid gap-4 border-t border-neutral-200 pt-6 text-sm font-bold uppercase text-neutral-500">
            <div className="flex items-center justify-between gap-4">
              <span>Email</span>
              <span className="text-right text-black">{profile?.email ?? user.email}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Phone</span>
              <span className="text-black">{profile?.phone ?? "Not added"}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Role</span>
              <span className="text-black">{profile?.role ?? "customer"}</span>
            </div>
          </div>

          {notice ? (
            <p
              className={`mt-6 border px-4 py-3 text-sm font-bold uppercase leading-5 ${
                notice.tone === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-neutral-200 bg-neutral-100 text-black"
              }`}
            >
              {notice.message}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleLogout}
            disabled={isSubmitting}
            className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 bg-black px-6 text-sm font-black uppercase text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
          >
            <LogOut className="size-4" aria-hidden="true" />
            {isSubmitting ? "Signing Out" : "Sign Out"}
          </button>
        </div>

        <div className="grid gap-4">
          {visibleAccountBlocks.map((block) => (
            <div key={block.title} className="border border-neutral-200 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black uppercase leading-none">
                    {block.title}
                  </h2>
                  <p className="mt-4 text-sm font-bold uppercase leading-5 text-neutral-500">
                    {block.text}
                  </p>
                </div>
                {block.href ? (
                  <Link
                    href={block.href}
                    className="text-xs font-black uppercase underline decoration-2 underline-offset-4"
                  >
                    Open
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="border border-neutral-200 p-6">
        <div className="flex gap-2 border-b border-neutral-200 pb-4">
          {(["login", "register"] as AuthMode[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setMode(item);
                setNotice(null);
              }}
              className={`h-10 px-4 text-xs font-black uppercase ${
                mode === item
                  ? "bg-black text-white"
                  : "border border-neutral-200 text-black"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
          {mode === "register" ? (
            <label>
              <span className="text-xs font-black uppercase text-neutral-500">
                Full Name
              </span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                placeholder="Jane Smith"
                className="mt-3 h-12 w-full bg-neutral-100 px-3 text-sm font-bold uppercase text-black outline-none placeholder:text-neutral-400"
              />
            </label>
          ) : null}

          <label>
            <span className="text-xs font-black uppercase text-neutral-500">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="name@example.com"
              className="mt-3 h-12 w-full bg-neutral-100 px-3 text-sm font-bold uppercase text-black outline-none placeholder:text-neutral-400"
            />
          </label>

          <label>
            <span className="text-xs font-black uppercase text-neutral-500">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              placeholder="Password"
              className="mt-3 h-12 w-full bg-neutral-100 px-3 text-sm font-bold uppercase text-black outline-none placeholder:text-neutral-400"
            />
          </label>

          {notice ? (
            <p
              className={`border px-4 py-3 text-sm font-bold uppercase leading-5 ${
                notice.tone === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-neutral-200 bg-neutral-100 text-black"
              }`}
            >
              {notice.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-12 bg-black text-sm font-black uppercase text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
          >
            {isSubmitting
              ? "Please Wait"
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>
      </div>

      <div className="border border-neutral-200 p-6">
        <p className="text-xs font-black uppercase text-neutral-500">
          (Account Access)
        </p>
        <h2 className="mt-3 text-3xl font-black uppercase leading-none">
          Customer Login
        </h2>
        <p className="mt-5 text-sm font-bold uppercase leading-5 text-neutral-500">
          Sign in with the customer test account you created in Supabase Auth.
          The matching row in profiles controls whether the user is a customer
          or admin.
        </p>
      </div>
    </div>
  );
}
