import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SESSION_ACTIVITY_COOKIE } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_ACTIVITY_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
