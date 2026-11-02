import { NextResponse } from "next/server";
import {
  addCrmUser,
  addLeadComment,
  assignLeadToUser,
  createLeadFromEnquiry,
  getCrmSnapshot,
  type LeadIntent,
  type LeadStage,
  removeCrmUser,
  type ServicePillar,
  type UserRole,
  updateLeadStageOrFollowup,
} from "@/lib/crm-store";

export async function GET() {
  const snapshot = await getCrmSnapshot();
  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const action = String(payload.action ?? "");
  const actorId = String(payload.actorId ?? "");
  const initialSnapshot = await getCrmSnapshot();
  const actor =
    initialSnapshot.users.find((u) => u.id === actorId) ?? initialSnapshot.users[0];

  if (!actor) {
    return NextResponse.json({ error: "Actor user not found." }, { status: 403 });
  }

  if (action === "create_lead") {
    const name = String(payload.name ?? "").trim();
    const phone = String(payload.phone ?? "").trim();
    if (name.length < 2 || phone.replace(/\D/g, "").length < 10) {
      return NextResponse.json(
        { error: "Name and a valid 10-digit phone number are required." },
        { status: 422 },
      );
    }
    const lead = await createLeadFromEnquiry({
      name,
      phone,
      email: String(payload.email ?? "").trim(),
      city: String(payload.city ?? "").trim(),
      intent: (payload.intent as LeadIntent) ?? "buy",
      pillar: (payload.pillar as ServicePillar) ?? "homes",
      budget: String(payload.budget ?? "1-3cr"),
      message: String(payload.message ?? "").trim(),
      source: String(payload.source ?? "CRM Manual Entry"),
    });
    const snapshot = await getCrmSnapshot();
    return NextResponse.json({ ok: true, lead, ...snapshot });
  }

  if (action === "assign_lead") {
    const result = await assignLeadToUser(
      actor,
      String(payload.leadId ?? ""),
      payload.targetUserId ? String(payload.targetUserId) : null,
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }
    const snapshot = await getCrmSnapshot();
    return NextResponse.json({ ok: true, ...snapshot });
  }

  if (action === "update_stage") {
    const result = await updateLeadStageOrFollowup(actor, String(payload.leadId ?? ""), {
      stage: payload.stage as LeadStage | undefined,
      nextFollowupAt:
        payload.nextFollowupAt !== undefined
          ? (payload.nextFollowupAt as string | null)
          : undefined,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }
    const snapshot = await getCrmSnapshot();
    return NextResponse.json({ ok: true, ...snapshot });
  }

  if (action === "add_comment") {
    const result = await addLeadComment(
      actor,
      String(payload.leadId ?? ""),
      String(payload.body ?? ""),
      payload.followupScheduledFor ? String(payload.followupScheduledFor) : null,
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    const snapshot = await getCrmSnapshot();
    return NextResponse.json({ ok: true, ...snapshot });
  }

  if (action === "add_user") {
    const result = await addCrmUser(actor, {
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
      phone: String(payload.phone ?? ""),
      role: (payload.role as UserRole) ?? "sales",
      designation: String(payload.designation ?? "Sales Advisor"),
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }
    const snapshot = await getCrmSnapshot();
    return NextResponse.json({ ok: true, ...snapshot });
  }

  if (action === "remove_user") {
    const result = await removeCrmUser(actor, String(payload.targetUserId ?? ""));
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }
    const snapshot = await getCrmSnapshot();
    return NextResponse.json({ ok: true, ...snapshot });
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
