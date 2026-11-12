/** Public Supabase env for browser + SSR auth clients. */

export function getSupabasePublicEnv() {
  const url = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ""
  )
    .trim()
    .replace(/\/$/, "");

  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ""
  ).trim();

  return { url, anonKey, configured: Boolean(url && anonKey) };
}

export function getSiteUrl() {
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") return "https://realtycook.com";
  return "http://localhost:3000";
}

export const SESSION_ACTIVITY_COOKIE = "rc_session_activity";
export const SESSION_IDLE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
