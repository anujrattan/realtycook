import { NextResponse } from "next/server";
import {
  addCrmProperty,
  addCrmUserWithRbac,
  addLeadComment,
  assignLeadWithRbac,
  bulkCreateLeads,
  createCrmTask,
  createOrMergeLead,
  getCrmSnapshot,
  type CrmTaskStatus,
  type LeadIntent,
  type LeadStage,
  type StageReason,
  removeCrmUserWithRbac,
  type ServicePillar,
  type UserRole,
  updateCrmLead,
  updateCrmProperty,
  updateCrmTask,
  updateCrmUserProfile,
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
      next_followup_at: payload.nextFollowupAt ? String(payload.nextFollowupAt) : null,
    });
    const snapshot = await getCrmSnapshot();
    return NextResponse.json({ ok: true, lead, snapshot });
  }

  if (action === "bulk_create_leads") {
    const rawLeads = Array.isArray(payload.leads) ? payload.leads : [];
    if (rawLeads.length === 0) {
      return NextResponse.json({ error: "No valid leads found in uploaded sheet." }, { status: 422 });
    }
    const result = await bulkCreateLeads({
      actorId,
      leads: rawLeads as Array<{
        name: string;
        phone: string;
        email?: string;
        city?: string;
        intent?: LeadIntent;
        pillar?: ServicePillar;
        budget?: string;
        notes_summary?: string;
        assigned_to?: string | null;
        next_followup_at?: string | null;
      }>,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }
    const snapshot = await getCrmSnapshot();
    return NextResponse.json({ ok: true, importedCount: result.importedCount, snapshot });
  }

  if (action === "add_property") {
    const result = await addCrmProperty({
      actorId,
      title: String(payload.title ?? ""),
      pillar: (payload.pillar as ServicePillar) ?? "homes",
      intent: (payload.intent as LeadIntent) ?? "buy",
      locality: String(payload.locality ?? ""),
      price_label: String(payload.price_label ?? ""),
      budget_bracket: String(payload.budget_bracket ?? "1-3cr"),
      specs: String(payload.specs ?? ""),
      verification_badge: String(payload.verification_badge ?? "Ground Verified"),
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }
    const snapshot = await getCrmSnapshot();
    return NextResponse.json({ ok: true, property: result.property, snapshot });
  }

  if (action === "update_property") {
    const result = await updateCrmProperty({
      actorId,
      propertyId: String(payload.propertyId ?? ""),
      patch: {
        title: payload.title !== undefined ? String(payload.title) : undefined,
        pillar: payload.pillar !== undefined ? (payload.pillar as ServicePillar) : undefined,
        intent: payload.intent !== undefined ? (payload.intent as LeadIntent) : undefined,
        locality: payload.locality !== undefined ? String(payload.locality) : undefined,
        price_label: payload.price_label !== undefined ? String(payload.price_label) : undefined,
        budget_bracket:
          payload.budget_bracket !== undefined ? String(payload.budget_bracket) : undefined,
        verification_badge:
          payload.verification_badge !== undefined ? String(payload.verification_badge) : undefined,
        active: payload.active !== undefined ? Boolean(payload.active) : undefined,
        project_name: payload.project_name !== undefined ? String(payload.project_name || "") || null : undefined,
        property_type: payload.property_type !== undefined ? String(payload.property_type || "") || null : undefined,
        city: payload.city !== undefined ? String(payload.city || "") || null : undefined,
        locality_area:
          payload.locality_area !== undefined ? String(payload.locality_area || "") || null : undefined,
        developer_name:
          payload.developer_name !== undefined ? String(payload.developer_name || "") || null : undefined,
        rera_number: payload.rera_number !== undefined ? String(payload.rera_number || "") || null : undefined,
        configuration:
          payload.configuration !== undefined ? String(payload.configuration || "") || null : undefined,
        unit_details:
          payload.unit_details !== undefined ? String(payload.unit_details || "") || null : undefined,
        possession_status:
          payload.possession_status !== undefined
            ? String(payload.possession_status || "") || null
            : undefined,
        availability_status:
          payload.availability_status !== undefined
            ? String(payload.availability_status || "") || null
            : undefined,
        furnishing_status:
          payload.furnishing_status !== undefined
            ? String(payload.furnishing_status || "") || null
            : undefined,
        verification_status:
          payload.verification_status !== undefined
            ? String(payload.verification_status || "") || null
            : undefined,
        quoted_price:
          payload.quoted_price !== undefined && payload.quoted_price !== ""
            ? Number(payload.quoted_price)
            : payload.quoted_price === "" || payload.quoted_price === null
              ? null
              : undefined,
        price_per_sqft:
          payload.price_per_sqft !== undefined && payload.price_per_sqft !== ""
            ? Number(payload.price_per_sqft)
            : payload.price_per_sqft === "" || payload.price_per_sqft === null
              ? null
              : undefined,
        amenities: payload.amenities !== undefined ? String(payload.amenities || "") || null : undefined,
        internal_notes:
          payload.internal_notes !== undefined ? String(payload.internal_notes || "") || null : undefined,
        parking_included:
          payload.parking_included !== undefined
            ? String(payload.parking_included || "") || null
            : undefined,
        power_backup:
          payload.power_backup !== undefined ? String(payload.power_backup || "") || null : undefined,
        summary: payload.summary !== undefined ? String(payload.summary || "") || null : undefined,
      },
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }
    const snapshot = await getCrmSnapshot();
    return NextResponse.json({ ok: true, property: result.property, snapshot });
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
      closureReason:
        payload.closureReason !== undefined
          ? (payload.closureReason as StageReason | null)
          : undefined,
      nextFollowupAt:
        payload.nextFollowupAt !== undefined
          ? (payload.nextFollowupAt as string | null)
          : undefined,
      siteVisitDate:
        payload.siteVisitDate !== undefined
          ? (payload.siteVisitDate as string | null)
          : undefined,
      siteVisitTime:
        payload.siteVisitTime !== undefined
          ? (payload.siteVisitTime as string | null)
          : undefined,
      siteVisitProperty:
        payload.siteVisitProperty !== undefined
          ? (payload.siteVisitProperty as string | null)
          : undefined,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }
    const snapshot = await getCrmSnapshot();
    return NextResponse.json({ ok: true, lead: result.lead, snapshot });
  }

  if (action === "update_lead") {
    const result = await updateCrmLead({
      actorId,
      leadId: String(payload.leadId ?? ""),
      patch: {
        name: payload.name !== undefined ? String(payload.name) : undefined,
        phone: payload.phone !== undefined ? String(payload.phone) : undefined,
        email: payload.email !== undefined ? String(payload.email) : undefined,
        city: payload.city !== undefined ? String(payload.city) : undefined,
        intent: payload.intent !== undefined ? (payload.intent as LeadIntent) : undefined,
        pillar: payload.pillar !== undefined ? (payload.pillar as ServicePillar) : undefined,
        budget: payload.budget !== undefined ? String(payload.budget) : undefined,
        notes_summary:
          payload.notes_summary !== undefined ? String(payload.notes_summary) : undefined,
      },
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

  if (action === "update_profile") {
    const result = await updateCrmUserProfile({
      actorId,
      firstName: String(payload.firstName ?? ""),
      lastName: String(payload.lastName ?? ""),
      email: String(payload.email ?? ""),
      phone: String(payload.phone ?? ""),
      address: String(payload.address ?? ""),
      avatarUrl:
        payload.avatarUrl === undefined
          ? undefined
          : payload.avatarUrl === null
            ? null
            : String(payload.avatarUrl),
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    const snapshot = await getCrmSnapshot();
    return NextResponse.json({ ok: true, user: result.user, snapshot });
  }

  if (action === "create_task") {
    const result = await createCrmTask({
      actorId,
      leadId: String(payload.leadId ?? ""),
      title: String(payload.title ?? ""),
      description: payload.description !== undefined ? String(payload.description) : "",
      dueAt: String(payload.dueAt ?? ""),
      assignedTo:
        payload.assignedTo === undefined
          ? undefined
          : payload.assignedTo
            ? String(payload.assignedTo)
            : null,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    const snapshot = await getCrmSnapshot();
    return NextResponse.json({ ok: true, task: result.task, snapshot });
  }

  if (action === "update_task") {
    const result = await updateCrmTask({
      actorId,
      taskId: String(payload.taskId ?? ""),
      patch: {
        title: payload.title !== undefined ? String(payload.title) : undefined,
        description: payload.description !== undefined ? String(payload.description) : undefined,
        dueAt: payload.dueAt !== undefined ? String(payload.dueAt) : undefined,
        status: payload.status !== undefined ? (payload.status as CrmTaskStatus) : undefined,
        assignedTo:
          payload.assignedTo === undefined
            ? undefined
            : payload.assignedTo
              ? String(payload.assignedTo)
              : null,
      },
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }
    const snapshot = await getCrmSnapshot();
    return NextResponse.json({ ok: true, task: result.task, snapshot });
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
