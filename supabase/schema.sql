-- ============================================================================
-- RealtyCook CRM — Supabase Postgres Schema (with RLS enabled)
-- Prefer running: supabase/migrations/20261112135000_reset_and_create_crm_schema.sql
-- Note: All queries run from the Next.js backend using SUPABASE_SERVICE_ROLE_KEY.
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. CRM Users
create table if not exists public.crm_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text not null,
  role text not null check (role in ('superadmin', 'admin', 'sales')),
  designation text not null default 'Sales Advisor',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.crm_users enable row level security;

-- 2. Leads
create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text not null default '',
  city text not null default '',
  intent text not null check (intent in ('buy', 'sell', 'invest', 'lease')),
  pillar text not null default 'homes' check (pillar in ('homes', 'commercial', 'upcoming', 'land', 'leasing')),
  budget text not null default 'unsure',
  stage text not null default 'new_enquiry' check (
    stage in (
      'new_enquiry',
      'contacted',
      'meeting',
      'site_visit_scheduled',
      'negotiation',
      'closed'
    )
  ),
  source text not null default 'Website Form',
  assigned_to uuid references public.crm_users(id) on delete set null,
  next_followup_at timestamptz,
  site_visit_date text,
  site_visit_time text,
  site_visit_property text,
  closure_reason text check (
    closure_reason is null or closure_reason in (
      'interested',
      'no_answer',
      'switched_off',
      'busy_rejected',
      'callback_requested',
      'not_interested',
      'already_purchased',
      'budget_mismatch',
      'wrong_requirement',
      'duplicate',
      'deal_won',
      'deal_lost',
      'other'
    )
  ),
  notes_summary text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crm_leads_stage on public.crm_leads(stage);
create index if not exists idx_crm_leads_assigned_to on public.crm_leads(assigned_to);
create index if not exists idx_crm_leads_phone on public.crm_leads(phone);
create index if not exists idx_crm_leads_updated_at on public.crm_leads(updated_at desc);

alter table public.crm_leads enable row level security;

-- 3. Lead comments / activity
create table if not exists public.crm_lead_comments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.crm_leads(id) on delete cascade,
  author_id uuid references public.crm_users(id) on delete set null,
  author_name text not null,
  author_role text not null,
  body text not null,
  followup_scheduled_for timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_crm_lead_comments_lead_id on public.crm_lead_comments(lead_id);
create index if not exists idx_crm_lead_comments_created_at on public.crm_lead_comments(created_at desc);

alter table public.crm_lead_comments enable row level security;

-- 4. Verified inventory (Inventory Master sheet)
-- Seed + column expansion: supabase/migrations/20261112170000_inventory_master_schema_and_seed.sql
-- `specs` also keeps JSON { summary, inventory } for UI compatibility.
create table if not exists public.crm_properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  pillar text not null default 'homes' check (pillar in ('homes', 'commercial', 'upcoming', 'land', 'leasing')),
  intent text not null default 'buy' check (intent in ('buy', 'sell', 'invest', 'lease')),
  locality text not null,
  price_label text not null,
  budget_bracket text not null default '1-3cr',
  specs text not null default '',
  verification_badge text not null default 'Ground Verified',
  added_by_id uuid references public.crm_users(id) on delete set null,
  added_by_name text not null default 'System',
  added_by_role text not null default 'admin',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  project_name text,
  property_type text,
  city text,
  locality_area text,
  developer_name text,
  rera_number text,
  listing_link text,
  configuration text,
  unit_details text,
  super_area_sqft numeric,
  builtup_area_sqft numeric,
  carpet_area_sqft numeric,
  bathrooms numeric,
  availability_status text,
  possession_status text,
  expected_possession_date date,
  quoted_price numeric,
  price_per_sqft numeric,
  plc_notes text,
  ifms_amount numeric,
  club_charges numeric,
  other_charges numeric,
  charges_included text,
  price_list_link text,
  parking_included text,
  additional_parking_cost numeric,
  furnishing_status text,
  appliances_included text,
  power_backup text,
  gas_pipeline text,
  amenities text,
  verification_status text,
  price_verified_date date,
  availability_verified_date date,
  source_links text,
  assigned_to_email text,
  internal_notes text,
  last_updated timestamptz
);

create index if not exists idx_crm_properties_active on public.crm_properties(active);
create index if not exists idx_crm_properties_created_at on public.crm_properties(created_at desc);
create index if not exists idx_crm_properties_city on public.crm_properties(city);
create index if not exists idx_crm_properties_project_name on public.crm_properties(project_name);

alter table public.crm_properties enable row level security;

-- Seed CRM users (+ Auth) via the reset migration only:
--   supabase/migrations/20261112135000_reset_and_create_crm_schema.sql
-- That file creates matching auth.users / auth.identities rows with the same UUIDs.
-- Temp password: RealtyCook#ChangeMe1
