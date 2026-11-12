import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SESSION_ACTIVITY_COOKIE, SESSION_IDLE_MS } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 422 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  const mustReset =
    data.user?.app_metadata?.must_reset_password === true ||
    data.user?.app_metadata?.must_reset_password === "true";

  const res = NextResponse.json({
    ok: true,
    mustResetPassword: mustReset,
    userId: data.user?.id ?? null,
  });
  res.cookies.set(SESSION_ACTIVITY_COOKIE, String(Date.now()), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: Math.floor(SESSION_IDLE_MS / 1000),
  });
  return res;
}
