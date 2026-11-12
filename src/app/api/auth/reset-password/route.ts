import { NextResponse } from "next/server";
import { clearMustResetPassword } from "@/lib/crm-store";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const password = String(body.password ?? "");
  if (password.length < 8) {
    return NextResponse.json({ error: "Use at least 8 characters." }, { status: 422 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims?.sub) {
    return NextResponse.json({ error: "You must be signed in to reset your password." }, { status: 401 });
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const userId = String(claimsData.claims.sub);
  const cleared = await clearMustResetPassword(userId);
  if (!cleared.ok) {
    return NextResponse.json({ error: cleared.error }, { status: 500 });
  }

  await supabase.auth.refreshSession();
  return NextResponse.json({ ok: true });
}
