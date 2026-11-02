import { NextResponse } from "next/server";
import {
  addCrmUserWithRbac,
  addLeadComment,
  assignLeadWithRbac,
  createOrMergeLead,
  getCrmSnapshot,
  type LeadIntent,
  type LeadStage,
  removeCrmUserWithRbac,
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

  if (action === "create_lead") {
    const name = String(payload.name ?? "").trim();
    const phone = String(payload.phone ?? "").trim();
    if (name.length < 2 || phone.replace(/\D/g, "").length < 10) {
      return NextResponse.json(
        { error: "Name and a valid 10-digit phone number are required." },
        { status: 422 },
      );
    }
    const lead = await createOrMergeLead({
      name,
      phone,
      email: String(payload.email ?? "").trim(),
      city: String(payload.city ?? "").trim(),
      intent: (payload.intent as LeadIntent) ?? "buy",
      pillar: (payload.pillar as ServicePillar) ?? "homes",
      budget: String(payload.budget ?? "1-3cr"),
      message: String(payload.message ?? "").trim(),
      source: String(payload.source ?? "Direct Entry"),
      assigned_to: payload.assignedTo ? String(payload.assignedTo) : null,
    });
    const snapshot = await getCrmSnapshot();
    return NextResponse.json({ ok: true, lead, snapshot });
  }

  if (action === "assign_lead") {
    const result = await assignLeadWithRbac({
      actorId,
      leadId: String(payload.leadId ?? ""),
      targetUserId: payload.targetUserId ? String(payload.targetUserId) : null,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }
    const snapshot = await getCrmSnapshot();
    return NextResponse.json({ ok: true, lead: result.lead, snapshot });
  }

  if (action === "update_stage") {
    const result = await updateLeadStageOrFollowup({
      actorId,
      leadId: String(payload.leadId ?? ""),
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
    return NextResponse.json({ ok: true, lead: result.lead, snapshot });
  }

  if (action === "add_comment") {
    const result = await addLeadComment({
      actorId,
      leadId: String(payload.leadId ?? ""),
      body: String(payload.body ?? ""),
      nextFollowupAt: payload.nextFollowupAt ? String(payload.nextFollowupAt) : null,
      newStage: payload.newStage ? (payload.newStage as LeadStage) : undefined,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    const snapshot = await getCrmSnapshot();
    return NextResponse.json({ ok: true, comment: result.comment, snapshot });
  }

  if (action === "add_user") {
    const result = await addCrmUserWithRbac({
      actorId,
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
    return NextResponse.json({ ok: true, user: result.user, snapshot });
  }

  if (action === "remove_user") {
    const result = await removeCrmUserWithRbac({
      actorId,
      targetUserId: String(payload.targetUserId ?? ""),
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }
    const snapshot = await getCrmSnapshot();
    return NextResponse.json({ ok: true, snapshot });
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
