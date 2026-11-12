import type { Metadata } from "next";
import { CrmDashboard } from "@/components/crm/crm-dashboard";
import { getCrmSnapshot } from "@/lib/crm-store";

export const metadata: Metadata = {
  title: "RealtyCook CRM — Lead & Pipeline Command Desk",
  description: "Internal CRM for RealtyCook Superadmin, Admin, and Sales advisors.",
};

/** Always render on the Worker so live Supabase fetches are allowed. */
export const dynamic = "force-dynamic";

export default async function CrmPage() {
  const initialSnapshot = await getCrmSnapshot();
  return <CrmDashboard initialSnapshot={initialSnapshot} />;
}
