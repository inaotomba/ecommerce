"use client";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

let browserClient: ReturnType<typeof createClient<Database>> | null = null;

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return { key, url };
}

export function createSupabaseBrowserClient() {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  browserClient ??= createClient<Database>(config.url, config.key);

  return browserClient;
}
