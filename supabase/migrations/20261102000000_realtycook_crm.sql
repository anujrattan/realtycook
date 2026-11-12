-- ============================================================================
-- RealtyCook CRM Schema for Supabase (Postgres)
-- Security: RLS enabled on all public tables. Backend accesses via service_role
-- key (Frontend -> Next.js Backend API -> Supabase).
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. CRM Users & Roles (superadmin | admin | sales)
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

-- 2. Leads Table
create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text default '',
  city text default '',
  intent text not null check (intent in ('buy', 'sell', 'invest', 'lease')),
  pillar text not null default 'homes' check (pillar in ('homes', 'commercial', 'upcoming', 'land', 'leasing')),
  budget text default 'unsure',
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
  source text not null default 'website',
  assigned_to uuid references public.crm_users(id) on delete set null,
  next_followup_at timestamptz,
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
  notes_summary text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crm_leads_stage on public.crm_leads(stage);
create index if not exists idx_crm_leads_assigned_to on public.crm_leads(assigned_to);
create index if not exists idx_crm_leads_phone on public.crm_leads(phone);

alter table public.crm_leads enable row level security;

-- 3. Lead Comments & Conversation History
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

alter table public.crm_lead_comments enable row level security;

-- 4. Verified Property Inventory ("Ingredients Vault")
create table if not exists public.crm_properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  pillar text not null check (pillar in ('homes', 'commercial', 'upcoming', 'land', 'leasing')),
  intent text not null check (intent in ('buy', 'invest', 'lease')),
  locality text not null,
  price_label text not null,
  budget_bracket text not null,
  specs text not null,
  verification_badge text not null default 'Walked & Verified',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.crm_properties enable row level security;

-- RLS Policies: Only service_role (our backend server) or authenticated staff via app_metadata
create policy "Backend service_role full access on crm_users"
  on public.crm_users for all
  to service_role
  using (true)
  with check (true);

create policy "Backend service_role full access on crm_leads"
  on public.crm_leads for all
  to service_role
  using (true)
  with check (true);

create policy "Backend service_role full access on crm_lead_comments"
  on public.crm_lead_comments for all
  to service_role
  using (true)
  with check (true);

create policy "Backend service_role full access on crm_properties"
  on public.crm_properties for all
  to service_role
  using (true)
  with check (true);

-- Seed Super Admins and SVP Sales accounts
insert into public.crm_users (id, name, email, phone, role, designation)
values
  ('6605a758-8ee3-470d-ad64-14865ddae023', 'Anuj Rattan', 'rattan.anuj@gmail.com', '918558887123', 'superadmin', 'Super Admin'),
  ('4eb4d5ac-6d70-4774-935f-006ee270b58d', 'Sahil Vaid', 'realtycookadmin@gmail.com', '917986000813', 'superadmin', 'Super Admin'),
  ('1e5c864f-af1d-4349-a4b3-f63946decdba', 'Karan Yadav', 'karanrealtycook@gmail.com', '919056050813', 'admin', 'SVP Sales'),
  ('83949b21-3a79-4927-b645-101c5bbce73c', 'Ishan Kaushal', 'ishanrealtycook@gmail.com', '919056060813', 'admin', 'SVP Sales')
on conflict (email) do nothing;
