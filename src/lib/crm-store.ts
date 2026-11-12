/**
 * Server-Only CRM Data Layer & Supabase Edge REST Client
 *
 * Standing Architecture Rules:
 * 1. Frontend NEVER talks to Supabase directly. Frontend calls `/api/crm/*` or `/api/enquiry`.
 * 2. Backend reads `process.env.SUPABASE_URL` and `process.env.SUPABASE_SERVICE_ROLE_KEY` from `.env`.
 * 3. Uses Web-standard `fetch()` against Supabase PostgREST so it is 100% compatible with
 *    Cloudflare Workers / Pages Edge runtime with zero native Node deps.
 * 4. When `SUPABASE_URL` is not yet configured in `.env`, seamlessly uses a persistent in-memory
 *    server store so local testing works immediately out of the box.
 */

export type UserRole = "superadmin" | "admin" | "sales";

/** Inventory create/edit is limited to Superadmin + Admin. */
export function canManageInventory(role: UserRole | null | undefined) {
  return role === "superadmin" || role === "admin";
}

/** Always generate a UUID so memory-store IDs stay compatible with Supabase uuid columns. */
export function newCrmId() {
  return crypto.randomUUID();
}

export type LeadStage =
  | "new_enquiry"
  | "contacted"
  | "meeting"
  | "site_visit_scheduled"
  | "negotiation"
  | "closed";

/**
 * Outcome / disposition tied to a stage choice.
 * Call attempts that need a retry stay on New; denials and deal results use Closed.
 */
export type StageReason =
  | "interested"
  | "no_answer"
  | "switched_off"
  | "busy_rejected"
  | "callback_requested"
  | "not_interested"
  | "already_purchased"
  | "budget_mismatch"
  | "wrong_requirement"
  | "duplicate"
  | "deal_won"
  | "deal_lost"
  | "other";

/** @deprecated Use StageReason */
export type ClosureReason = StageReason;

/** Map legacy stage values onto the current sales funnel. */
export function normalizeLeadStage(stage: string | null | undefined): LeadStage {
  switch (stage) {
    case "contacted":
      return "contacted";
    case "mandate_locked":
    case "shortlist_shared":
    case "qualified":
    case "meeting":
      return "meeting";
    case "site_visit_scheduled":
      return "site_visit_scheduled";
    case "negotiation":
    case "paperwork_registry":
      return "negotiation";
    case "closed_won":
    case "lost_hold":
    case "closed":
      return "closed";
    case "new_enquiry":
    default:
      return "new_enquiry";
  }
}

export function normalizeStageReason(
  reason: string | null | undefined,
  stage?: string | null,
): StageReason | null {
  if (!reason) return null;
  const normalizedStage = normalizeLeadStage(stage);

  const mapped: StageReason | null = (() => {
    switch (reason) {
      case "interested":
      case "no_answer":
      case "switched_off":
      case "busy_rejected":
      case "callback_requested":
      case "not_interested":
      case "already_purchased":
      case "budget_mismatch":
      case "wrong_requirement":
      case "duplicate":
      case "deal_won":
      case "deal_lost":
      case "other":
        return reason;
      case "not_looking":
        return "not_interested";
      case "unreachable":
        return "switched_off";
      case "closed_won":
        return "deal_won";
      case "lost_hold":
        return "deal_lost";
      default:
        return null;
    }
  })();

  if (!mapped) return null;

  // Call-attempt reasons belong on New (retry) or Contacted (spoke / callback).
  if (
    mapped === "no_answer" ||
    mapped === "switched_off" ||
    mapped === "busy_rejected"
  ) {
    return normalizedStage === "new_enquiry" || normalizedStage === "contacted" ? mapped : null;
  }
  if (mapped === "interested" || mapped === "callback_requested") {
    return normalizedStage === "contacted" || normalizedStage === "new_enquiry" ? mapped : null;
  }
  // Closure reasons only on Closed.
  if (normalizedStage === "closed") return mapped;
  return null;
}

/** @deprecated Use normalizeStageReason */
export const normalizeClosureReason = normalizeStageReason;

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
  site_visit_date?: string | null;
  site_visit_time?: string | null;
  site_visit_property?: string | null;
  closure_reason?: StageReason | null;
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
  added_by_id: string;
  added_by_name: string;
  added_by_role: UserRole;
  created_at: string;
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
    id: "6605a758-8ee3-470d-ad64-14865ddae023",
    name: "Anuj Rattan",
    email: "rattan.anuj@gmail.com",
    phone: "918558887123",
    role: "superadmin",
    designation: "Super Admin",
    active: true,
    created_at: "2026-10-01T09:00:00.000Z",
  },
  {
    id: "4eb4d5ac-6d70-4774-935f-006ee270b58d",
    name: "Sahil Vaid",
    email: "realtycookadmin@gmail.com",
    phone: "917986000813",
    role: "superadmin",
    designation: "Super Admin",
    active: true,
    created_at: "2026-10-01T09:05:00.000Z",
  },
  {
    id: "1e5c864f-af1d-4349-a4b3-f63946decdba",
    name: "Karan Yadav",
    email: "karanrealtycook@gmail.com",
    phone: "919056050813",
    role: "sales",
    designation: "SVP Sales",
    active: true,
    created_at: "2026-10-01T09:10:00.000Z",
  },
  {
    id: "83949b21-3a79-4927-b645-101c5bbce73c",
    name: "Ishan Kaushal",
    email: "ishanrealtycook@gmail.com",
    phone: "919056060813",
    role: "sales",
    designation: "SVP Sales",
    active: true,
    created_at: "2026-10-01T09:15:00.000Z",
  },
  {
    id: "b7e2c914-6a5f-4d8e-9c1b-3f8a0d2e5c71",
    name: "Baljinder Kaur",
    email: "realtycookbaljinder@gmail.com",
    phone: "919056030813",
    role: "sales",
    designation: "Sales",
    active: true,
    created_at: "2026-11-12T10:00:00.000Z",
  },
];

const SEED_LEADS: CrmLead[] = [
  {
    id: "b9a84b14-518e-47e4-a205-a9da7150b2b0",
    name: "Rajesh Malhotra",
    phone: "919811223344",
    email: "rajesh.m@example.com",
    city: "Sector 65, Gurugram",
    intent: "buy",
    pillar: "homes",
    budget: "3-10cr",
    stage: "site_visit_scheduled",
    source: "Website Hero",
    assigned_to: "1e5c864f-af1d-4349-a4b3-f63946decdba",
    next_followup_at: "2026-11-03T11:00:00.000Z",
    site_visit_date: "2026-11-07",
    site_visit_time: "11:00",
    site_visit_property: "Park-Facing 4 BHK Residence (Sector 65, Gurugram)",
    closure_reason: null,
    notes_summary: "Looking for 4 BHK park-facing apartment or independent kothi. Follow-up call pending after site visit.",
    created_at: "2026-10-30T10:00:00.000Z",
    updated_at: "2026-11-03T10:00:00.000Z",
  },
  {
    id: "d16a7fe7-dcd2-4a00-8cc1-9cbf3a43640c",
    name: "Saurabh Bansal",
    phone: "919822334455",
    email: "saurabh@bansalretail.in",
    city: "Airport Road, Mohali",
    intent: "invest",
    pillar: "commercial",
    budget: "3-10cr",
    stage: "meeting",
    source: "Website Contact",
    assigned_to: "83949b21-3a79-4927-b645-101c5bbce73c",
    next_followup_at: "2026-11-04T10:30:00.000Z",
    closure_reason: null,
    notes_summary: "Wants a main-road double-height showroom with clear parking. Shared 2 verified options on WhatsApp.",
    created_at: "2026-10-31T10:00:00.000Z",
    updated_at: "2026-11-04T06:00:00.000Z",
  },
  {
    id: "098949f1-a975-4035-abcb-5cb00b6d00d9",
    name: "Neha Kapoor",
    phone: "919833445566",
    email: "neha.kapoor@example.com",
    city: "New Chandigarh",
    intent: "invest",
    pillar: "land",
    budget: "1-3cr",
    stage: "contacted",
    source: "WhatsApp Bubble",
    assigned_to: "83949b21-3a79-4927-b645-101c5bbce73c",
    next_followup_at: "2026-11-04T12:30:00.000Z",
    closure_reason: null,
    notes_summary: "Looking for 250–300 sq.yd approved plot on 30m sector road for 5-year hold.",
    created_at: "2026-11-01T10:00:00.000Z",
    updated_at: "2026-11-04T07:00:00.000Z",
  },
  {
    id: "d91b8aea-8683-44e3-8188-48fd8464cee7",
    name: "Dr. Vivek Arora",
    phone: "919844556677",
    email: "dr.vivek@aroraclinic.com",
    city: "Sector 82, Mohali",
    intent: "lease",
    pillar: "leasing",
    budget: "50l-1cr",
    stage: "negotiation",
    source: "Direct Referral",
    assigned_to: "83949b21-3a79-4927-b645-101c5bbce73c",
    next_followup_at: "2026-11-05T11:00:00.000Z",
    closure_reason: null,
    notes_summary: "Need 1,800 sq.ft ground-floor space on 9-year lease with 3-year lock-in. Finalising LOI terms.",
    created_at: "2026-10-29T10:00:00.000Z",
    updated_at: "2026-11-04T08:00:00.000Z",
  },
  {
    id: "40f093f8-0c1e-4696-9b35-3a7811fc880d",
    name: "Harpreet Gill",
    phone: "919855667788",
    email: "harpreet.g@example.com",
    city: "Sector 150, Noida",
    intent: "buy",
    pillar: "upcoming",
    budget: "1-3cr",
    stage: "new_enquiry",
    source: "Website Contact",
    assigned_to: "1e5c864f-af1d-4349-a4b3-f63946decdba",
    next_followup_at: "2026-11-03T15:00:00.000Z",
    closure_reason: null,
    notes_summary: "Enquired about RERA-verified 3 BHK new launch with construction-linked payment plan.",
    created_at: "2026-11-02T14:00:00.000Z",
    updated_at: "2026-11-02T14:00:00.000Z",
  },
  {
    id: "23e5df67-84a6-4892-afa6-e2ab53a1e2b6",
    name: "Vikramaditya Sodhi",
    phone: "919877001122",
    email: "vsodhi@sodhigroup.com",
    city: "Sector 9, Chandigarh",
    intent: "buy",
    pillar: "homes",
    budget: "10cr-plus",
    stage: "negotiation",
    source: "Direct Referral",
    assigned_to: "1e5c864f-af1d-4349-a4b3-f63946decdba",
    next_followup_at: "2026-11-06T10:00:00.000Z",
    closure_reason: null,
    notes_summary: "1 Kanal freehold kothi requirement. Reviewing title search and mutation history with legal desk.",
    created_at: "2026-11-01T11:30:00.000Z",
    updated_at: "2026-11-04T07:30:00.000Z",
  },
  {
    id: "e14e3f7f-9104-480f-9671-13662a227422",
    name: "Meera Chopra",
    phone: "919866778899",
    email: "meera.chopra@example.com",
    city: "Sector 70, Mohali",
    intent: "buy",
    pillar: "homes",
    budget: "1-3cr",
    stage: "closed",
    source: "Website Contact",
    assigned_to: "1e5c864f-af1d-4349-a4b3-f63946decdba",
    next_followup_at: null,
    closure_reason: "already_purchased",
    notes_summary: "Called back — already booked a flat last week. Closed after first conversation.",
    created_at: "2026-10-28T09:00:00.000Z",
    updated_at: "2026-11-03T16:00:00.000Z",
  },
];

const SEED_COMMENTS: CrmLeadComment[] = [
  {
    id: "dedcd6ac-ac06-4c33-a391-a625f477a91b",
    lead_id: "b9a84b14-518e-47e4-a205-a9da7150b2b0",
    author_id: "1e5c864f-af1d-4349-a4b3-f63946decdba",
    author_name: "Karan Yadav",
    author_role: "admin",
    body: "Spoke to Mr. Malhotra. He prefers a ready-to-move 4 BHK with OC received. Site walk locked for Saturday.",
    followup_scheduled_for: "2026-11-03T11:00:00.000Z",
    created_at: "2026-10-31T10:00:00.000Z",
  },
  {
    id: "35fb1986-379b-4d13-a3c7-f2c5a0c554b2",
    lead_id: "b9a84b14-518e-47e4-a205-a9da7150b2b0",
    author_id: "83949b21-3a79-4927-b645-101c5bbce73c",
    author_name: "Ishan Kaushal",
    author_role: "admin",
    body: "Shared floor plans and real sun-path video on WhatsApp. Confirmed site visit with society manager.",
    followup_scheduled_for: "2026-11-03T11:00:00.000Z",
    created_at: "2026-11-02T10:00:00.000Z",
  },
  {
    id: "ed78a69f-e901-40e4-b19b-ab724d7e2a2b",
    lead_id: "d91b8aea-8683-44e3-8188-48fd8464cee7",
    author_id: "83949b21-3a79-4927-b645-101c5bbce73c",
    author_name: "Ishan Kaushal",
    author_role: "admin",
    body: "Landlord agreed to 45-day rent-free fit-out period and 15% escalation every 3 years. Sending draft LOI today.",
    followup_scheduled_for: "2026-11-05T11:00:00.000Z",
    created_at: "2026-11-04T08:00:00.000Z",
  },
];

const SEED_PROPERTIES: CrmProperty[] = [
  {
    id: "f2dd3c93-962e-45f6-bfd8-8c77d0e628a0",
    title: "Park-Facing 4 BHK Residence",
    pillar: "homes",
    intent: "buy",
    locality: "Sector 65, Gurugram",
    price_label: "₹3.45 Cr",
    budget_bracket: "3-10cr",
    specs: "2,180 sq.ft carpet · OC Received · 2 Parking",
    verification_badge: "OC & Title Verified",
    added_by_id: "1e5c864f-af1d-4349-a4b3-f63946decdba",
    added_by_name: "Karan Yadav",
    added_by_role: "sales",
    created_at: "2026-10-12T10:00:00.000Z",
    active: true,
  },
  {
    id: "e17b891a-d855-4bf9-904e-a778e455e5c5",
    title: "Independent Freehold Kothi",
    pillar: "homes",
    intent: "buy",
    locality: "Sector 79, Mohali",
    price_label: "₹4.80 Cr",
    budget_bracket: "3-10cr",
    specs: "300 sq.yd plot · 4,100 sq.ft built · Park facing",
    verification_badge: "Freehold & Walked",
    added_by_id: "1e5c864f-af1d-4349-a4b3-f63946decdba",
    added_by_name: "Karan Yadav",
    added_by_role: "sales",
    created_at: "2026-10-15T14:20:00.000Z",
    active: true,
  },
  {
    id: "dd81fe4a-ff32-4a9d-beb5-1a6b776300bd",
    title: "Double-Height Corner Showroom",
    pillar: "commercial",
    intent: "invest",
    locality: "Airport Road, Mohali",
    price_label: "₹4.90 Cr",
    budget_bracket: "3-10cr",
    specs: "1,850 sq.ft · 28 ft frontage · Main road parking",
    verification_badge: "Frontage & NOC Checked",
    added_by_id: "83949b21-3a79-4927-b645-101c5bbce73c",
    added_by_name: "Ishan Kaushal",
    added_by_role: "sales",
    created_at: "2026-10-18T11:30:00.000Z",
    active: true,
  },
  {
    id: "9ff04dd3-31c4-4c3a-a09e-c0f1813a50aa",
    title: "East-Facing Corner Villa Plot",
    pillar: "land",
    intent: "invest",
    locality: "New Chandigarh",
    price_label: "₹2.45 Cr",
    budget_bracket: "1-3cr",
    specs: "265 sq.yd · 30m road approach · Approved layout",
    verification_badge: "Boundary Pillars Walked",
    added_by_id: "83949b21-3a79-4927-b645-101c5bbce73c",
    added_by_name: "Ishan Kaushal",
    added_by_role: "sales",
    created_at: "2026-10-21T09:45:00.000Z",
    active: true,
  },
  {
    id: "6c194e22-c4d2-41c2-a983-b28ae675d8d4",
    title: "RERA Low-Density 3 BHK Launch",
    pillar: "upcoming",
    intent: "buy",
    locality: "Sector 150, Noida",
    price_label: "₹1.85 Cr",
    budget_bracket: "1-3cr",
    specs: "1,640 sq.ft carpet · 30:40:30 payment plan",
    verification_badge: "RERA & Escrow Audited",
    added_by_id: "6605a758-8ee3-470d-ad64-14865ddae023",
    added_by_name: "Anuj Rattan",
    added_by_role: "superadmin",
    created_at: "2026-10-25T16:10:00.000Z",
    active: true,
  },
  {
    id: "399f4b2c-e733-42cc-8990-68d14119a5c0",
    title: "Grade-A Ground Retail & Clinic Space",
    pillar: "leasing",
    intent: "lease",
    locality: "Sector 82, Mohali",
    price_label: "₹1.45 L / mo",
    budget_bracket: "50l-1cr",
    specs: "1,800 sq.ft · Wet point · 9-yr registered lease",
    verification_badge: "Ready for Fit-Out",
    added_by_id: "83949b21-3a79-4927-b645-101c5bbce73c",
    added_by_name: "Ishan Kaushal",
    added_by_role: "sales",
    created_at: "2026-10-28T12:00:00.000Z",
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
  const hasCreds = Boolean(url && key && url.startsWith("http") && !url.includes("your-project-ref"));
  // Cloudflare Pages ships a static HTML shell. Never hit Supabase during `next build`
  // prerender — that hangs the build once SUPABASE_* env vars are present.
  const duringProductionBuild = process.env.NEXT_PHASE === "phase-production-build";
  return { url, key, enabled: hasCreds && !duringProductionBuild };
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
        sbFetch<CrmProperty[]>("crm_properties?active=eq.true&order=created_at.desc"),
      ]);
      return {
        storageMode: "supabase",
        whatsappNumber,
        users,
        leads: leads.map((lead) => ({
          ...lead,
          stage: normalizeLeadStage(lead.stage),
          closure_reason: normalizeStageReason(lead.closure_reason, lead.stage),
        })),
        comments,
        // Prefer live inventory rows. Only fall back to demo seed when the table is empty.
        properties: properties.length ? properties : [],
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
    leads: [...mem.leads]
      .map((lead) => ({
        ...lead,
        stage: normalizeLeadStage(lead.stage),
        closure_reason: normalizeStageReason(lead.closure_reason, lead.stage),
      }))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    comments: [...mem.comments].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    properties: [...mem.properties].filter((p) => p.active).sort((a, b) => b.created_at.localeCompare(a.created_at)),
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
  next_followup_at?: string | null;
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

  const followupIso = input.next_followup_at ?? new Date(Date.now() + 2 * 3600 * 1000).toISOString();

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
          next_followup_at: followupIso,
          closure_reason: null,
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
        id: newCrmId(),
        lead_id: existing.id,
        author_id: "00000000-0000-4000-8000-000000000001",
        author_name: "Lead Intake",
        author_role: "admin",
        body: `Updated / Repeat enquiry (${input.intent.toUpperCase()}): ${input.message}`,
        followup_scheduled_for: followupIso,
        created_at: now,
      });
    }
    return existing;
  }

  const newLead: CrmLead = {
    id: newCrmId(),
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
    next_followup_at: followupIso,
    site_visit_date: null,
    site_visit_time: null,
    site_visit_property: null,
    closure_reason: null,
    notes_summary: input.message ?? "New enquiry received.",
    created_at: now,
    updated_at: now,
  };
  mem.leads.unshift(newLead);
  return newLead;
}

export async function bulkCreateLeads(params: {
  actorId: string;
  leads: Array<{
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
  }>;
}): Promise<{ ok: true; importedCount: number } | { ok: false; error: string }> {
  const snap = await getCrmSnapshot();
  const actor = snap.users.find((u) => u.id === params.actorId);
  if (!actor) return { ok: false, error: "Unauthorized actor." };

  let importedCount = 0;
  for (const row of params.leads) {
    const cleanName = String(row.name ?? "").trim();
    const cleanPhone = String(row.phone ?? "").replace(/\D/g, "");
    if (cleanName.length < 2 || cleanPhone.length < 10) continue;

    const assignedTo =
      row.assigned_to !== undefined
        ? row.assigned_to
        : actor.role === "sales"
          ? actor.id
          : null;

    const created = await createOrMergeLead({
      name: cleanName,
      phone: cleanPhone,
      email: String(row.email ?? "").trim(),
      city: String(row.city ?? "").trim(),
      intent: (row.intent as LeadIntent) ?? "buy",
      pillar: (row.pillar as ServicePillar) ?? "homes",
      budget: String(row.budget ?? "1-3cr"),
      message: String(row.notes_summary ?? "Imported via Excel Bulk Upload").trim(),
      source: `Excel Upload (${actor.name})`,
      assigned_to: assignedTo,
      next_followup_at: row.next_followup_at ?? new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    });

    const mem = getMemoryStore();
    mem.comments.unshift({
      id: newCrmId(),
      lead_id: created.id,
      author_id: actor.id,
      author_name: actor.name,
      author_role: actor.role,
      body: `Bulk imported lead via Excel sheet.`,
      followup_scheduled_for: created.next_followup_at,
      created_at: new Date().toISOString(),
    });

    importedCount++;
  }

  return { ok: true, importedCount };
}

export async function addCrmProperty(params: {
  actorId: string;
  title: string;
  pillar: ServicePillar;
  intent: LeadIntent;
  locality: string;
  price_label: string;
  budget_bracket: string;
  specs: string;
  verification_badge: string;
}): Promise<{ ok: true; property: CrmProperty } | { ok: false; error: string }> {
  const snap = await getCrmSnapshot();
  const actor = snap.users.find((u) => u.id === params.actorId);
  if (!actor) return { ok: false, error: "Unauthorized actor." };
  if (!canManageInventory(actor.role)) {
    return { ok: false, error: "Only Superadmin and Admin can add inventory." };
  }

  const title = params.title.trim();
  const locality = params.locality.trim();
  const price_label = params.price_label.trim();
  if (title.length < 3 || locality.length < 2 || !price_label) {
    return { ok: false, error: "Property title, locality, and price label are required." };
  }

  const now = new Date().toISOString();
  const cfg = getSupabaseConfig();

  if (cfg.enabled) {
    try {
      const inserted = await sbFetch<CrmProperty[]>("crm_properties", {
        method: "POST",
        body: JSON.stringify({
          title,
          pillar: params.pillar,
          intent: params.intent,
          locality,
          price_label,
          budget_bracket: params.budget_bracket || "1-3cr",
          specs: params.specs.trim() || "Verified RealtyCook Mandate",
          verification_badge: params.verification_badge.trim() || "Ground Verified",
          added_by_id: actor.id,
          added_by_name: actor.name,
          added_by_role: actor.role,
          active: true,
        }),
      });
      if (inserted[0]) return { ok: true, property: inserted[0] };
    } catch (err) {
      console.warn("[crm-store] Supabase property insert failed, using memory store:", err);
    }
  }

  const mem = getMemoryStore();
  const newProp: CrmProperty = {
    id: newCrmId(),
    title,
    pillar: params.pillar,
    intent: params.intent,
    locality,
    price_label,
    budget_bracket: params.budget_bracket || "1-3cr",
    specs: params.specs.trim() || "Verified RealtyCook Mandate",
    verification_badge: params.verification_badge.trim() || "Ground Verified",
    added_by_id: actor.id,
    added_by_name: actor.name,
    added_by_role: actor.role,
    created_at: now,
    active: true,
  };
  mem.properties.unshift(newProp);
  return { ok: true, property: newProp };
}

export type CrmPropertyUpdateInput = {
  title?: string;
  pillar?: ServicePillar;
  intent?: LeadIntent;
  locality?: string;
  price_label?: string;
  budget_bracket?: string;
  verification_badge?: string;
  active?: boolean;
  // Inventory Master fields (also synced into specs JSON)
  project_name?: string | null;
  property_type?: string | null;
  city?: string | null;
  locality_area?: string | null;
  developer_name?: string | null;
  rera_number?: string | null;
  configuration?: string | null;
  unit_details?: string | null;
  possession_status?: string | null;
  availability_status?: string | null;
  furnishing_status?: string | null;
  verification_status?: string | null;
  quoted_price?: number | null;
  price_per_sqft?: number | null;
  amenities?: string | null;
  internal_notes?: string | null;
  parking_included?: string | null;
  power_backup?: string | null;
  summary?: string | null;
};

function mergePropertySpecs(existingSpecs: string, patch: CrmPropertyUpdateInput) {
  let summary = patch.summary?.trim() || "";
  let inventory: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(existingSpecs || "{}") as { summary?: string; inventory?: Record<string, unknown> };
    if (parsed && typeof parsed === "object") {
      summary = summary || parsed.summary || "";
      inventory = { ...(parsed.inventory || {}) };
    }
  } catch {
    summary = summary || existingSpecs || "";
  }

  const invKeys: Array<keyof CrmPropertyUpdateInput> = [
    "project_name",
    "property_type",
    "city",
    "locality_area",
    "developer_name",
    "rera_number",
    "configuration",
    "unit_details",
    "possession_status",
    "availability_status",
    "furnishing_status",
    "verification_status",
    "quoted_price",
    "price_per_sqft",
    "amenities",
    "internal_notes",
    "parking_included",
    "power_backup",
  ];
  for (const key of invKeys) {
    if (patch[key] !== undefined) inventory[key] = patch[key];
  }
  if (!summary) {
    summary = [inventory.configuration, inventory.possession_status, inventory.furnishing_status]
      .filter(Boolean)
      .join(" · ");
  }
  return JSON.stringify({ summary: summary || "Inventory unit", inventory });
}

export async function updateCrmProperty(params: {
  actorId: string;
  propertyId: string;
  patch: CrmPropertyUpdateInput;
}): Promise<{ ok: true; property: CrmProperty } | { ok: false; error: string }> {
  const snap = await getCrmSnapshot();
  const actor = snap.users.find((u) => u.id === params.actorId);
  if (!actor) return { ok: false, error: "Unauthorized actor." };
  if (!canManageInventory(actor.role)) {
    return { ok: false, error: "Only Superadmin and Admin can edit inventory." };
  }

  const existing = snap.properties.find((p) => p.id === params.propertyId);
  if (!existing) return { ok: false, error: "Inventory unit not found." };

  const title = (params.patch.title ?? existing.title).trim();
  const locality = (params.patch.locality ?? existing.locality).trim();
  const price_label = (params.patch.price_label ?? existing.price_label).trim();
  if (title.length < 3 || locality.length < 2 || !price_label) {
    return { ok: false, error: "Property title, locality, and price label are required." };
  }

  const specs = mergePropertySpecs(existing.specs, params.patch);
  const body: Record<string, unknown> = {
    title,
    locality,
    price_label,
    pillar: params.patch.pillar ?? existing.pillar,
    intent: params.patch.intent ?? existing.intent,
    budget_bracket: params.patch.budget_bracket ?? existing.budget_bracket,
    verification_badge: (params.patch.verification_badge ?? existing.verification_badge).trim(),
    specs,
    active: params.patch.active ?? existing.active,
  };

  // Persist first-class inventory columns when present in DB.
  const columnKeys: Array<keyof CrmPropertyUpdateInput> = [
    "project_name",
    "property_type",
    "city",
    "locality_area",
    "developer_name",
    "rera_number",
    "configuration",
    "unit_details",
    "possession_status",
    "availability_status",
    "furnishing_status",
    "verification_status",
    "quoted_price",
    "price_per_sqft",
    "amenities",
    "internal_notes",
    "parking_included",
    "power_backup",
  ];
  for (const key of columnKeys) {
    if (params.patch[key] !== undefined) body[key] = params.patch[key];
  }

  const cfg = getSupabaseConfig();
  if (cfg.enabled) {
    try {
      const updated = await sbFetch<CrmProperty[]>(
        `crm_properties?id=eq.${encodeURIComponent(params.propertyId)}`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
          headers: { Prefer: "return=representation" },
        },
      );
      if (updated[0]) return { ok: true, property: updated[0] };
    } catch (err) {
      console.warn("[crm-store] Supabase property update failed, using memory store:", err);
    }
  }

  const mem = getMemoryStore();
  const idx = mem.properties.findIndex((p) => p.id === params.propertyId);
  if (idx < 0) return { ok: false, error: "Inventory unit not found." };
  const next: CrmProperty = {
    ...mem.properties[idx],
    title,
    locality,
    price_label,
    pillar: (params.patch.pillar ?? existing.pillar) as ServicePillar,
    intent: (params.patch.intent ?? existing.intent) as LeadIntent,
    budget_bracket: params.patch.budget_bracket ?? existing.budget_bracket,
    verification_badge: (params.patch.verification_badge ?? existing.verification_badge).trim(),
    specs,
    active: params.patch.active ?? existing.active,
  };
  mem.properties[idx] = next;
  return { ok: true, property: next };
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
    id: newCrmId(),
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
  closureReason?: StageReason | null;
  nextFollowupAt?: string | null;
  siteVisitDate?: string | null;
  siteVisitTime?: string | null;
  siteVisitProperty?: string | null;
}): Promise<{ ok: true; lead: CrmLead } | { ok: false; error: string }> {
  const snap = await getCrmSnapshot();
  const actor = snap.users.find((u) => u.id === params.actorId);
  if (!actor) return { ok: false, error: "Unauthorized actor." };

  if ((params.stage === "closed" || params.stage === "contacted") && !params.closureReason) {
    return { ok: false, error: "Pick a reason for this status before saving." };
  }

  const now = new Date().toISOString();
  const cfg = getSupabaseConfig();
  const nextClosureReason =
    params.closureReason !== undefined
      ? params.closureReason
      : params.stage && params.stage !== "closed" && params.stage !== "contacted" && params.stage !== "new_enquiry"
        ? null
        : undefined;

  if (cfg.enabled) {
    try {
      const patch: Record<string, unknown> = { updated_at: now };
      if (params.stage) patch.stage = params.stage;
      if (nextClosureReason !== undefined) patch.closure_reason = nextClosureReason;
      if (params.nextFollowupAt !== undefined) patch.next_followup_at = params.nextFollowupAt;
      if (params.siteVisitDate !== undefined) patch.site_visit_date = params.siteVisitDate;
      if (params.siteVisitTime !== undefined) patch.site_visit_time = params.siteVisitTime;
      if (params.siteVisitProperty !== undefined) patch.site_visit_property = params.siteVisitProperty;
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

  const previousStage = lead.stage;
  if (params.stage) lead.stage = params.stage;
  if (nextClosureReason !== undefined) lead.closure_reason = nextClosureReason;
  if (params.nextFollowupAt !== undefined) lead.next_followup_at = params.nextFollowupAt;
  if (params.siteVisitDate !== undefined) lead.site_visit_date = params.siteVisitDate;
  if (params.siteVisitTime !== undefined) lead.site_visit_time = params.siteVisitTime;
  if (params.siteVisitProperty !== undefined) lead.site_visit_property = params.siteVisitProperty;
  lead.updated_at = now;

  if (params.siteVisitDate) {
    const timeLabel = params.siteVisitTime ? ` at ${params.siteVisitTime}` : " (time flexible)";
    const propLabel = params.siteVisitProperty ? ` for ${params.siteVisitProperty}` : "";
    mem.comments.unshift({
      id: newCrmId(),
      lead_id: lead.id,
      author_id: actor.id,
      author_name: actor.name,
      author_role: actor.role,
      body: `Scheduled Site Visit on ${params.siteVisitDate}${timeLabel}${propLabel}.`,
      followup_scheduled_for: lead.next_followup_at,
      created_at: now,
    });
  } else if (params.stage && params.stage !== previousStage) {
    const reasonNote =
      params.stage === "closed" && params.closureReason
        ? ` Reason: ${params.closureReason.replace(/_/g, " ")}.`
        : "";
    mem.comments.unshift({
      id: newCrmId(),
      lead_id: lead.id,
      author_id: actor.id,
      author_name: actor.name,
      author_role: actor.role,
      body: `Moved stage from ${previousStage.replace(/_/g, " ")} → ${params.stage.replace(/_/g, " ")}.${reasonNote}`,
      followup_scheduled_for: lead.next_followup_at,
      created_at: now,
    });
  }

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
    id: newCrmId(),
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
    id: newCrmId(),
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
