"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AuthNavLink() {
  const supabase = createSupabaseBrowserClient();
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const client = supabase;
    let isActive = true;

    async function loadSession() {
      const {
        data: { user },
      } = await client.auth.getUser();

      if (isActive) {
        setIsSignedIn(Boolean(user));
      }
    }

    void loadSession();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session?.user));
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <Link
      href="/account"
      className="inline-flex size-9 items-center justify-center border border-neutral-200 text-black transition hover:bg-neutral-100"
      aria-label={isSignedIn ? "Open account" : "Sign in"}
      title={isSignedIn ? "Account" : "Sign in"}
    >
      <UserRound className="size-5" aria-hidden="true" />
      <span className="sr-only">{isSignedIn ? "Account" : "Sign in"}</span>
    </Link>
  );
}
