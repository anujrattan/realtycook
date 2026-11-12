"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export function createBrowserSupabaseClient() {
  const { url, anonKey, configured } = getSupabasePublicEnv();
  if (!configured) {
    throw new Error("Supabase public env is not configured (URL + anon key).");
  }
  return createBrowserClient(url, anonKey);
}
