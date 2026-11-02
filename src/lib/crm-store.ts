/**
 * Server-Only CRM Data Layer & Supabase Edge REST Client
 *
 * Standing Architecture Rules:
 * 1. Frontend NEVER talks to Supabase directly. Frontend calls `/api/crm/*` or `/api/enquiry`.
 * 2. Backend reads `process.env.SUPABASE_URL` and `process.env.SUPABASE_SERVICE_ROLE_KEY` from `.env`.
 * 3. Uses Web-standard `fetch()` against Supabase PostgREST so it is 100% compatible with
 *    Cloudflare Workers / Pages Edge runtime (`@opennextjs/cloudflare`) with zero native Node deps.
 * 4. When `SUPABASE_URL` is not yet configured in `.env`, seamlessly uses a persistent in-memory
 *    server store so local testing works immediately out of the box.
 */

export type UserRole = "superadmin" | "admin" | "sales";

export type LeadStage =
  | "new_enquiry"
  | "mandate_locked"
  | "shortlist_shared"
  | "site_visit_scheduled"
  | "negotiation"
  | "paperwork_registry"
  | "closed_won"
  | "lost_hold";

export type ServicePillar = "homes" | "commercial" | "upcoming" | "land" | "leasing";
export type LeadIntent = "buy" | "sell" | "invest" | "lease";

export interface CrmUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  designation: string;
  active: boolean;
  created_at: string;
}

export interface CrmLeadComment {
  id: string;
  lead_id: string;
  author_id: string;
  author_name: string;
  author_role: UserRole;
  body: string;
  followup_scheduled_for: string | null;
  created_at: string;
}

export interface CrmLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  intent: LeadIntent;
  pillar: ServicePillar;
  budget: string;
  stage: LeadStage;
  source: string;
  assigned_to: string | null;
  next_followup_at: string | null;
  notes_summary: string;
  created_at: string;
  updated_at: string;
}

export interface CrmProperty {
  id: string;
  title: string;
  pillar: ServicePillar;
  intent: LeadIntent;
  locality: string;
  price_label: string;
  budget_bracket: string;
  specs: string;
  verification_badge: string;
  active: boolean;
}

export interface CrmStateSnapshot {
  storageMode: "supabase" | "memory_fallback";
  whatsappNumber: string;
  users: CrmUser[];
  leads: CrmLead[];
  comments: CrmLeadComment[];
  properties: CrmProperty[];
}

/* -------------------------------------------------------------------------- */
/* Seed Data for Immediate Testing                                            */
/* -------------------------------------------------------------------------- */

const SEED_USERS: CrmUser[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Anuj (Superadmin)",
    email: "founder@realtycook.com",
    phone: "919056050813",
    role: "superadmin",
    designation: "Founder & Superadmin",
    active: true,
    created_at: "2026-10-01T09:00:00.000Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Karan Yadav",
    email: "karan@realtycook.com",
    phone: "919056050813",
    role: "admin",
    designation: "VP - Sales",
    active: true,
    created_at: "2026-10-01T09:05:00.000Z",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Riya Sharma",
    email: "riya@realtycook.com",
    phone: "919876543210",
    role: "sales",
    designation: "Sales Advisor — Homes & Kothis",
    active: true,
    created_at: "2026-10-05T10:00:00.000Z",
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "Aman Verma",
    email: "aman@realtycook.com",
    phone: "919876543211",
    role: "sales",
    designation: "Sales Advisor — Commercial & Leasing",
    active: true,
    created_at: "2026-10-06T10:00:00.000Z",
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    name: "Vikram Singh",
    email: "vikram@realtycook.com",
    phone: "919876543212",
    role: "sales",
    designation: "Sales Advisor — Plots & New Launches",
    active: true,
    created_at: "2026-10-07T10:00:00.000Z",
  },
];

const SEED_LEADS: CrmLead[] = [
  {
    id: "lead-101",
    name: "Rajesh Malhotra",
    phone: "919811223344",
    email: "rajesh.m@example.com",
    city: "Sector 65, Gurugram",
    intent: "buy",
    pillar: "homes",
    budget: "3-10cr",
    stage: "site_visit_scheduled",
    source: "Website Hero",
    assigned_to: "33333333-3333-4333-8333-333333333333",
    next_followup_at: "2026-11-03T06:00:00.000Z",
    notes_summary: "Looking for 4 BHK park-facing apartment or independent kothi. Site walk fixed for Saturday 11 AM.",
    created_at: "2026-10-30T10:00:00.000Z",
    updated_at: "2026-11-02T10:00:00.000Z",
  },
  {
    id: "lead-102",
    name: "Saurabh Bansal",
    phone: "919822334455",
    email: "saurabh@bansalretail.in",
    city: "Airport Road, Mohali",
    intent: "invest",
    pillar: "commercial",
    budget: "3-10cr",
    stage: "shortlist_shared",
    source: "Website Contact",
    assigned_to: "44444444-4444-4444-8444-444444444444",
    next_followup_at: "2026-11-03T09:00:00.000Z",
    notes_summary: "Wants a main-road double-height showroom with clear parking. Shared 2 verified options on WhatsApp.",
    created_at: "2026-10-31T10:00:00.000Z",
    updated_at: "2026-11-02T08:00:00.000Z",
  },
  {
    id: "lead-103",
    name: "Neha Kapoor",
    phone: "919833445566",
    email: "neha.kapoor@example.com",
    city: "New Chandigarh",
    intent: "invest",
    pillar: "land",
    budget: "1-3cr",
    stage: "mandate_locked",
    source: "WhatsApp Bubble",
    assigned_to: "55555555-5555-4555-8555-555555555555",
    next_followup_at: "2026-11-03T12:00:00.000Z",
    notes_summary: "Looking for 250–300 sq.yd approved plot on 30m sector road for 5-year hold.",
    created_at: "2026-11-01T10:00:00.000Z",
    updated_at: "2026-11-02T12:00:00.000Z",
  },
  {
    id: "lead-104",
    name: "Dr. Vivek Arora",
    phone: "919844556677",
    email: "dr.vivek@aroraclinic.com",
    city: "Sector 82, Mohali",
    intent: "lease",
    pillar: "leasing",
    budget: "50l-1cr",
    stage: "negotiation",
    source: "Direct Referral",
    assigned_to: "44444444-4444-4444-8444-444444444444",
    next_followup_at: "2026-11-03T05:30:00.000Z",
    notes_summary: "Need 1,800 sq.ft ground-floor space on 9-year lease with 3-year lock-in. Finalising LOI terms.",
    created_at: "2026-10-29T10:00:00.000Z",
    updated_at: "2026-11-02T13:00:00.000Z",
  },
  {
    id: "lead-105",
    name: "Harpreet Gill",
    phone: "919855667788",
    email: "harpreet.g@example.com",
    city: "Sector 150, Noida",
    intent: "buy",
    pillar: "upcoming",
    budget: "1-3cr",
    stage: "new_enquiry",
    source: "Website Contact",
    assigned_to: null,
    next_followup_at: "2026-11-02T18:00:00.000Z",
    notes_summary: "Enquired about RERA-verified 3 BHK new launch with construction-linked payment plan.",
    created_at: "2026-11-02T14:00:00.000Z",
    updated_at: "2026-11-02T14:00:00.000Z",
  },
];

const SEED_COMMENTS: CrmLeadComment[] = [
  {
    id: "c-1",
    lead_id: "lead-101",
    author_id: "22222222-2222-4222-8222-222222222222",
    author_name: "Karan Yadav",
    author_role: "admin",
    body: "Spoke to Mr. Malhotra. He prefers a ready-to-move 4 BHK with OC received. Assigned to Riya for Saturday site walk.",
    followup_scheduled_for: "2026-11-03T06:00:00.000Z",
    created_at: "2026-10-31T10:00:00.000Z",
  },
  {
    id: "c-2",
    lead_id: "lead-101",
    author_id: "33333333-3333-4333-8333-333333333333",
    author_name: "Riya Sharma",
    author_role: "sales",
    body: "Shared floor plans and real sun-path video on WhatsApp. Confirmed Saturday 11:00 AM visit with society manager.",
    followup_scheduled_for: "2026-11-03T06:00:00.000Z",
    created_at: "2026-11-02T10:00:00.000Z",
  },
  {
    id: "c-3",
    lead_id: "lead-104",
    author_id: "44444444-4444-4444-8444-444444444444",
    author_name: "Aman Verma",
    author_role: "sales",
    body: "Landlord agreed to 45-day rent-free fit-out period and 15% escalation every 3 years. Sending draft LOI today.",
    followup_scheduled_for: "2026-11-03T05:30:00.000Z",
    created_at: "2026-11-02T13:00:00.000Z",
  },
];

const SEED_PROPERTIES: CrmProperty[] = [
  {
    id: "prop-1",
    title: "Park-Facing 4 BHK Residence",
    pillar: "homes",
    intent: "buy",
    locality: "Sector 65, Gurugram",
    price_label: "₹3.45 Cr",
    budget_bracket: "3-10cr",
    specs: "2,180 sq.ft carpet · OC Received · 2 Parking",
    verification_badge: "OC & Title Verified",
    active: true,
  },
  {
    id: "prop-2",
    title: "Independent Freehold Kothi",
    pillar: "homes",
    intent: "buy",
    locality: "Sector 79, Mohali",
    price_label: "₹4.80 Cr",
    budget_bracket: "3-10cr",
    specs: "300 sq.yd plot · 4,100 sq.ft built · Park facing",
    verification_badge: "Freehold & Walked",
    active: true,
  },
  {
    id: "prop-3",
    title: "Double-Height Corner Showroom",
    pillar: "commercial",
    intent: "invest",
    locality: "Airport Road, Mohali",
    price_label: "₹4.90 Cr",
    budget_bracket: "3-10cr",
    specs: "1,850 sq.ft · 28 ft frontage · Main road parking",
    verification_badge: "Frontage & NOC Checked",
    active: true,
  },
  {
    id: "prop-4",
    title: "East-Facing Corner Villa Plot",
    pillar: "land",
    intent: "invest",
    locality: "New Chandigarh",
    price_label: "₹2.45 Cr",
    budget_bracket: "1-3cr",
    specs: "265 sq.yd · 30m road approach · Approved layout",
    verification_badge: "Boundary Pillars Walked",
    active: true,
  },
  {
    id: "prop-5",
    title: "RERA Low-Density 3 BHK Launch",
    pillar: "upcoming",
    intent: "buy",
    locality: "Sector 150, Noida",
    price_label: "₹1.85 Cr",
    budget_bracket: "1-3cr",
    specs: "1,640 sq.ft carpet · 30:40:30 payment plan",
    verification_badge: "RERA & Escrow Audited",
    active: true,
  },
  {
    id: "prop-6",
    title: "Grade-A Ground Retail & Clinic Space",
    pillar: "leasing",
    intent: "lease",
    locality: "Sector 82, Mohali",
    price_label: "₹1.45 L / mo",
    budget_bracket: "50l-1cr",
    specs: "1,800 sq.ft · Wet point · 9-yr registered lease",
    verification_badge: "Ready for Fit-Out",
    active: true,
  },
];

interface MemoryStore {
  users: CrmUser[];
  leads: CrmLead[];
  comments: CrmLeadComment[];
  properties: CrmProperty[];
}

const globalForCrm = globalThis as unknown as { __realtyCookCrmStore?: MemoryStore };

function getMemoryStore(): MemoryStore {
  if (!globalForCrm.__realtyCookCrmStore) {
    globalForCrm.__realtyCookCrmStore = {
      users: [...SEED_USERS],
      leads: [...SEED_LEADS],
      comments: [...SEED_COMMENTS],
      properties: [...SEED_PROPERTIES],
    };
  }
  return globalForCrm.__realtyCookCrmStore;
}

function getSupabaseConfig() {
  const url = (process.env.SUPABASE_URL ?? "").trim().replace(/\/$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  const enabled = Boolean(url && key && url.startsWith("http") && !url.includes("your-project-ref"));
  return { url, key, enabled };
}

async function sbFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { url, key } = getSupabaseConfig();
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase error (${res.status}): ${text}`);
  }
  return (await res.json()) as T;
}

export async function getCrmSnapshot(): Promise<CrmStateSnapshot> {
  const cfg = getSupabaseConfig();
  const whatsappNumber = (process.env.REALTYCOOK_WHATSAPP_NUMBER ?? "919056050813").replace(/\D/g, "");

  if (cfg.enabled) {
    try {
      const [users, leads, comments, properties] = await Promise.all([
        sbFetch<CrmUser[]>("crm_users?active=eq.true&order=created_at.asc"),
        sbFetch<CrmLead[]>("crm_leads?order=updated_at.desc"),
        sbFetch<CrmLeadComment[]>("crm_lead_comments?order=created_at.desc"),
        sbFetch<CrmProperty[]>("crm_properties?active=eq.true&order=created_at.asc"),
      ]);
      return {
        storageMode: "supabase",
        whatsappNumber,
        users,
        leads,
        comments,
        properties: properties.length ? properties : SEED_PROPERTIES,
      };
    } catch (err) {
      console.warn("[crm-store] Supabase query failed, falling back to memory store:", err);
    }
  }

  const mem = getMemoryStore();
  return {
    storageMode: "memory_fallback",
    whatsappNumber,
    users: mem.users.filter((u) => u.active),
    leads: [...mem.leads].sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    comments: [...mem.comments].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    properties: mem.properties.filter((p) => p.active),
  };
}

export async function createOrMergeLead(input: {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  intent: LeadIntent;
  pillar?: ServicePillar;
  budget?: string;
  message?: string;
  source?: string;
  assigned_to?: string | null;
}): Promise<CrmLead> {
  const cleanPhone = input.phone.replace(/\D/g, "");
  const normalizedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const inferredPillar: ServicePillar =
    input.pillar ??
    (input.intent === "lease"
      ? "leasing"
      : input.intent === "invest"
        ? "commercial"
        : "homes");

  const cfg = getSupabaseConfig();
  if (cfg.enabled) {
    try {
      const created = await sbFetch<CrmLead[]>("crm_leads", {
        method: "POST",
        body: JSON.stringify({
          name: input.name,
          phone: normalizedPhone,
          email: input.email ?? "",
          city: input.city ?? "",
          intent: input.intent,
          pillar: inferredPillar,
          budget: input.budget ?? "unsure",
          stage: "new_enquiry",
          source: input.source ?? "Website Contact",
          assigned_to: input.assigned_to ?? null,
          next_followup_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
          notes_summary: input.message ?? "",
        }),
      });
      if (created[0]) return created[0];
    } catch (err) {
      console.warn("[crm-store] Supabase insert failed, using memory store:", err);
    }
  }

  const mem = getMemoryStore();
  const existing = mem.leads.find((l) => l.phone.endsWith(cleanPhone.slice(-10)));
  const now = new Date().toISOString();

  if (existing) {
    existing.intent = input.intent;
    existing.budget = input.budget || existing.budget;
    existing.city = input.city || existing.city;
    existing.updated_at = now;
    if (input.message) {
      existing.notes_summary = input.message;
      mem.comments.unshift({
        id: `c-${Date.now()}`,
        lead_id: existing.id,
        author_id: "system",
        author_name: "Website Enquiry",
        author_role: "admin",
        body: `Repeat enquiry (${input.intent.toUpperCase()}): ${input.message}`,
        followup_scheduled_for: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        created_at: now,
      });
    }
    return existing;
  }

  const newLead: CrmLead = {
    id: `lead-${Date.now()}`,
    name: input.name,
    phone: normalizedPhone,
    email: input.email ?? "",
    city: input.city ?? "",
    intent: input.intent,
    pillar: inferredPillar,
    budget: input.budget ?? "unsure",
    stage: "new_enquiry",
    source: input.source ?? "Website Contact",
    assigned_to: input.assigned_to ?? null,
    next_followup_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    notes_summary: input.message ?? "New enquiry received from website.",
    created_at: now,
    updated_at: now,
  };
  mem.leads.unshift(newLead);
  return newLead;
}

export async function assignLeadWithRbac(params: {
  actorId: string;
  leadId: string;
  targetUserId: string | null;
}): Promise<{ ok: true; lead: CrmLead } | { ok: false; error: string }> {
  const snap = await getCrmSnapshot();
  const actor = snap.users.find((u) => u.id === params.actorId);
  if (!actor) return { ok: false, error: "Unauthorized actor." };

  if (params.targetUserId) {
    const targetUser = snap.users.find((u) => u.id === params.targetUserId);
    if (!targetUser) return { ok: false, error: "Target user not found." };

    if (actor.role === "sales" && targetUser.role !== "sales") {
      return {
        ok: false,
        error: "Sales accounts can only assign leads to themselves or other Sales accounts.",
      };
    }
  } else if (actor.role === "sales") {
    return {
      ok: false,
      error: "Sales accounts must assign the lead to themselves or another Sales account.",
    };
  }

  const cfg = getSupabaseConfig();
  const now = new Date().toISOString();

  if (cfg.enabled) {
    try {
      const updated = await sbFetch<CrmLead[]>(`crm_leads?id=eq.${encodeURIComponent(params.leadId)}`, {
        method: "PATCH",
        body: JSON.stringify({ assigned_to: params.targetUserId, updated_at: now }),
      });
      if (updated[0]) return { ok: true, lead: updated[0] };
    } catch (err) {
      console.warn("[crm-store] Supabase assign failed, using memory store:", err);
    }
  }

  const mem = getMemoryStore();
  const lead = mem.leads.find((l) => l.id === params.leadId);
  if (!lead) return { ok: false, error: "Lead not found." };

  const targetName = snap.users.find((u) => u.id === params.targetUserId)?.name ?? "Unassigned";
  lead.assigned_to = params.targetUserId;
  lead.updated_at = now;

  mem.comments.unshift({
    id: `c-${Date.now()}`,
    lead_id: lead.id,
    author_id: actor.id,
    author_name: actor.name,
    author_role: actor.role,
    body: `Assigned lead to ${targetName}.`,
    followup_scheduled_for: null,
    created_at: now,
  });

  return { ok: true, lead };
}

export async function updateLeadStageOrFollowup(params: {
  actorId: string;
  leadId: string;
  stage?: LeadStage;
  nextFollowupAt?: string | null;
}): Promise<{ ok: true; lead: CrmLead } | { ok: false; error: string }> {
  const snap = await getCrmSnapshot();
  const actor = snap.users.find((u) => u.id === params.actorId);
  if (!actor) return { ok: false, error: "Unauthorized actor." };

  const now = new Date().toISOString();
  const cfg = getSupabaseConfig();

  if (cfg.enabled) {
    try {
      const patch: Record<string, unknown> = { updated_at: now };
      if (params.stage) patch.stage = params.stage;
      if (params.nextFollowupAt !== undefined) patch.next_followup_at = params.nextFollowupAt;
      const updated = await sbFetch<CrmLead[]>(`crm_leads?id=eq.${encodeURIComponent(params.leadId)}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      if (updated[0]) return { ok: true, lead: updated[0] };
    } catch (err) {
      console.warn("[crm-store] Supabase stage update failed, using memory store:", err);
    }
  }

  const mem = getMemoryStore();
  const lead = mem.leads.find((l) => l.id === params.leadId);
  if (!lead) return { ok: false, error: "Lead not found." };

  if (params.stage) lead.stage = params.stage;
  if (params.nextFollowupAt !== undefined) lead.next_followup_at = params.nextFollowupAt;
  lead.updated_at = now;

  return { ok: true, lead };
}

export async function addLeadComment(params: {
  actorId: string;
  leadId: string;
  body: string;
  nextFollowupAt?: string | null;
  newStage?: LeadStage;
}): Promise<{ ok: true; comment: CrmLeadComment } | { ok: false; error: string }> {
  const snap = await getCrmSnapshot();
  const actor = snap.users.find((u) => u.id === params.actorId);
  if (!actor) return { ok: false, error: "Unauthorized actor." };

  const cleanBody = params.body.trim();
  if (!cleanBody) return { ok: false, error: "Comment cannot be empty." };

  const now = new Date().toISOString();
  const cfg = getSupabaseConfig();

  if (cfg.enabled) {
    try {
      const inserted = await sbFetch<CrmLeadComment[]>("crm_lead_comments", {
        method: "POST",
        body: JSON.stringify({
          lead_id: params.leadId,
          author_id: actor.id,
          author_name: actor.name,
          author_role: actor.role,
          body: cleanBody,
          followup_scheduled_for: params.nextFollowupAt ?? null,
        }),
      });
      const leadPatch: Record<string, unknown> = {
        notes_summary: cleanBody,
        updated_at: now,
      };
      if (params.nextFollowupAt) leadPatch.next_followup_at = params.nextFollowupAt;
      if (params.newStage) leadPatch.stage = params.newStage;
      await sbFetch(`crm_leads?id=eq.${encodeURIComponent(params.leadId)}`, {
        method: "PATCH",
        body: JSON.stringify(leadPatch),
      });
      if (inserted[0]) return { ok: true, comment: inserted[0] };
    } catch (err) {
      console.warn("[crm-store] Supabase comment insert failed, using memory store:", err);
    }
  }

  const mem = getMemoryStore();
  const lead = mem.leads.find((l) => l.id === params.leadId);
  if (!lead) return { ok: false, error: "Lead not found." };

  const comment: CrmLeadComment = {
    id: `c-${Date.now()}`,
    lead_id: lead.id,
    author_id: actor.id,
    author_name: actor.name,
    author_role: actor.role,
    body: cleanBody,
    followup_scheduled_for: params.nextFollowupAt ?? null,
    created_at: now,
  };
  mem.comments.unshift(comment);

  lead.notes_summary = cleanBody;
  if (params.nextFollowupAt) lead.next_followup_at = params.nextFollowupAt;
  if (params.newStage) lead.stage = params.newStage;
  lead.updated_at = now;

  return { ok: true, comment };
}

export async function addCrmUserWithRbac(params: {
  actorId: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  designation: string;
}): Promise<{ ok: true; user: CrmUser } | { ok: false; error: string }> {
  const snap = await getCrmSnapshot();
  const actor = snap.users.find((u) => u.id === params.actorId);
  if (!actor) return { ok: false, error: "Unauthorized actor." };

  if (actor.role === "sales") {
    return { ok: false, error: "Sales accounts do not have permission to add users." };
  }
  if (actor.role === "admin" && params.role === "superadmin") {
    return { ok: false, error: "Only Superadmin can create another Superadmin." };
  }

  const cleanPhone = params.phone.replace(/\D/g, "");
  const normalizedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const now = new Date().toISOString();
  const cfg = getSupabaseConfig();

  if (cfg.enabled) {
    try {
      const inserted = await sbFetch<CrmUser[]>("crm_users", {
        method: "POST",
        body: JSON.stringify({
          name: params.name.trim(),
          email: params.email.trim().toLowerCase(),
          phone: normalizedPhone,
          role: params.role,
          designation: params.designation.trim() || "Sales Advisor",
          active: true,
        }),
      });
      if (inserted[0]) return { ok: true, user: inserted[0] };
    } catch (err) {
      console.warn("[crm-store] Supabase user insert failed, using memory store:", err);
    }
  }

  const mem = getMemoryStore();
  const newUser: CrmUser = {
    id: `user-${Date.now()}`,
    name: params.name.trim(),
    email: params.email.trim().toLowerCase(),
    phone: normalizedPhone,
    role: params.role,
    designation: params.designation.trim() || "Sales Advisor",
    active: true,
    created_at: now,
  };
  mem.users.push(newUser);
  return { ok: true, user: newUser };
}

export async function removeCrmUserWithRbac(params: {
  actorId: string;
  targetUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const snap = await getCrmSnapshot();
  const actor = snap.users.find((u) => u.id === params.actorId);
  const target = snap.users.find((u) => u.id === params.targetUserId);

  if (!actor || !target) return { ok: false, error: "User not found." };
  if (actor.role === "sales") {
    return { ok: false, error: "Sales accounts cannot remove users from the system." };
  }
  if (target.role === "superadmin") {
    return { ok: false, error: "The Superadmin account cannot be removed." };
  }
  if (actor.role === "admin" && target.role !== "sales") {
    return { ok: false, error: "Admins can only remove Sales accounts." };
  }

  const cfg = getSupabaseConfig();
  if (cfg.enabled) {
    try {
      await sbFetch(`crm_users?id=eq.${encodeURIComponent(params.targetUserId)}`, {
        method: "PATCH",
        body: JSON.stringify({ active: false }),
      });
      return { ok: true };
    } catch (err) {
      console.warn("[crm-store] Supabase user remove failed, using memory store:", err);
    }
  }

  const mem = getMemoryStore();
  const u = mem.users.find((x) => x.id === params.targetUserId);
  if (u) u.active = false;
  for (const lead of mem.leads) {
    if (lead.assigned_to === params.targetUserId) {
      lead.assigned_to = null;
    }
  }
  return { ok: true };
}
