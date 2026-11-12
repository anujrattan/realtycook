import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CrmDashboard } from "@/components/crm/crm-dashboard";
import { getCrmSnapshot } from "@/lib/crm-store";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "RealtyCook CRM — Lead & Pipeline Command Desk",
  description: "Internal CRM for RealtyCook Superadmin, Admin, and Sales advisors.",
};

/** Always render on the Worker so live Supabase fetches are allowed. */
export const dynamic = "force-dynamic";

export default async function CrmPage() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub ? String(data.claims.sub) : null;
  if (error || !userId) {
    redirect("/login?next=/crm");
  }

  const initialSnapshot = await getCrmSnapshot();
  const sessionUser = initialSnapshot.users.find((u) => u.id === userId);
  if (!sessionUser) {
    redirect("/login?error=no_crm_profile");
  }

  return <CrmDashboard initialSnapshot={initialSnapshot} sessionUserId={userId} />;
}
