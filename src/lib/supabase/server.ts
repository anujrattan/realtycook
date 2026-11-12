import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function createServerSupabaseClient() {
  const { url, anonKey, configured } = getSupabasePublicEnv();
  if (!configured) {
    throw new Error("Supabase public env is not configured (URL + anon key).");
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component — proxy/route handler will refresh cookies.
        }
      },
    },
  });
}
