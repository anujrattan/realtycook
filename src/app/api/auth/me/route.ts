import { NextResponse } from "next/server";
import { getCrmUserById } from "@/lib/crm-store";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims?.sub) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const userId = String(data.claims.sub);
    const profile = await getCrmUserById(userId);
    if (!profile || !profile.active) {
      return NextResponse.json({ user: null, error: "CRM profile inactive." }, { status: 403 });
    }

    return NextResponse.json({ user: profile });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
