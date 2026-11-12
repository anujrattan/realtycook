import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim();
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 422 });
  }

  const origin = request.headers.get("origin") || getSiteUrl();
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/reset-password?type=recovery")}`;

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
