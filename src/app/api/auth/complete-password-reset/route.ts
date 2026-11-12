import { NextResponse } from "next/server";
import { clearMustResetPassword } from "@/lib/crm-store";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const userId = String(data.claims.sub);
  const result = await clearMustResetPassword(userId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  // Refresh session so JWT app_metadata.must_reset_password is cleared.
  await supabase.auth.refreshSession();

  return NextResponse.json({ ok: true });
}
