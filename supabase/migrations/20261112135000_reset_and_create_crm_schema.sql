-- ============================================================================
-- RealtyCook CRM — full reset + fresh schema
-- WARNING: Drops EVERY table in public schema, then recreates CRM tables.
-- Safe to run in Supabase SQL Editor on an empty or disposable project.
-- Backend uses SUPABASE_SERVICE_ROLE_KEY (RLS policies for service_role only).
-- ============================================================================

create extension if not exists "pgcrypto";

-- --------------------------------------------------------------------------
-- 1) Drop all existing public tables (cascade dependencies)
-- --------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select tablename
    from pg_tables
    where schemaname = 'public'
    order by tablename
  loop
    execute format('drop table if exists public.%I cascade', r.tablename);
  end loop;
end $$;

-- --------------------------------------------------------------------------
-- 2) CRM users
-- --------------------------------------------------------------------------
create table public.crm_users (
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

create policy "Backend service_role full access on crm_users"
  on public.crm_users for all
  to service_role
  using (true)
  with check (true);

-- --------------------------------------------------------------------------
-- 3) Leads
-- --------------------------------------------------------------------------
create table public.crm_leads (
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

create index idx_crm_leads_stage on public.crm_leads(stage);
create index idx_crm_leads_assigned_to on public.crm_leads(assigned_to);
create index idx_crm_leads_phone on public.crm_leads(phone);
create index idx_crm_leads_updated_at on public.crm_leads(updated_at desc);

alter table public.crm_leads enable row level security;

create policy "Backend service_role full access on crm_leads"
  on public.crm_leads for all
  to service_role
  using (true)
  with check (true);

-- --------------------------------------------------------------------------
-- 4) Lead comments / activity
-- --------------------------------------------------------------------------
create table public.crm_lead_comments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.crm_leads(id) on delete cascade,
  author_id uuid references public.crm_users(id) on delete set null,
  author_name text not null,
  author_role text not null,
  body text not null,
  followup_scheduled_for timestamptz,
  created_at timestamptz not null default now()
);

create index idx_crm_lead_comments_lead_id on public.crm_lead_comments(lead_id);
create index idx_crm_lead_comments_created_at on public.crm_lead_comments(created_at desc);

alter table public.crm_lead_comments enable row level security;

create policy "Backend service_role full access on crm_lead_comments"
  on public.crm_lead_comments for all
  to service_role
  using (true)
  with check (true);

-- --------------------------------------------------------------------------
-- 5) Verified inventory
-- --------------------------------------------------------------------------
create table public.crm_properties (
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
  created_at timestamptz not null default now()
);

create index idx_crm_properties_active on public.crm_properties(active);
create index idx_crm_properties_created_at on public.crm_properties(created_at desc);

alter table public.crm_properties enable row level security;

create policy "Backend service_role full access on crm_properties"
  on public.crm_properties for all
  to service_role
  using (true)
  with check (true);

-- --------------------------------------------------------------------------
-- 6) Seed Auth users (auth.users + auth.identities) then CRM profiles
--     IDs are shared: auth.users.id === public.crm_users.id
--     Temp password for all: RealtyCook#ChangeMe1  (change after first login)
-- --------------------------------------------------------------------------

-- Remove prior copies of these accounts so the migration is re-runnable
delete from auth.identities
where user_id in (
  '6605a758-8ee3-470d-ad64-14865ddae023',
  '4eb4d5ac-6d70-4774-935f-006ee270b58d',
  '1e5c864f-af1d-4349-a4b3-f63946decdba',
  '83949b21-3a79-4927-b645-101c5bbce73c'
)
or provider_id in (
  '6605a758-8ee3-470d-ad64-14865ddae023',
  '4eb4d5ac-6d70-4774-935f-006ee270b58d',
  '1e5c864f-af1d-4349-a4b3-f63946decdba',
  '83949b21-3a79-4927-b645-101c5bbce73c'
);

delete from auth.users
where id in (
  '6605a758-8ee3-470d-ad64-14865ddae023',
  '4eb4d5ac-6d70-4774-935f-006ee270b58d',
  '1e5c864f-af1d-4349-a4b3-f63946decdba',
  '83949b21-3a79-4927-b645-101c5bbce73c'
)
or email in (
  'rattan.anuj@gmail.com',
  'realtycookadmin@gmail.com',
  'karanrealtycook@gmail.com',
  'ishanrealtycook@gmail.com'
);

do $$
declare
  seed_password text := crypt('RealtyCook#ChangeMe1', gen_salt('bf'));
  u record;
begin
  for u in
    select *
    from (
      values
        (
          '6605a758-8ee3-470d-ad64-14865ddae023'::uuid,
          'Anuj Rattan',
          'rattan.anuj@gmail.com',
          '918558887123',
          'superadmin',
          'Super Admin'
        ),
        (
          '4eb4d5ac-6d70-4774-935f-006ee270b58d'::uuid,
          'Sahil Vaid',
          'realtycookadmin@gmail.com',
          '917986000813',
          'superadmin',
          'Super Admin'
        ),
        (
          '1e5c864f-af1d-4349-a4b3-f63946decdba'::uuid,
          'Karan Yadav',
          'karanrealtycook@gmail.com',
          '919056050813',
          'admin',
          'SVP Sales'
        ),
        (
          '83949b21-3a79-4927-b645-101c5bbce73c'::uuid,
          'Ishan Kaushal',
          'ishanrealtycook@gmail.com',
          '919056060813',
          'admin',
          'SVP Sales'
        )
    ) as t(id, name, email, phone, role, designation)
  loop
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      email_change_token_current,
      phone_change,
      phone_change_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      u.id,
      'authenticated',
      'authenticated',
      u.email,
      seed_password,
      now(),
      -- role lives in app_metadata (not user_metadata) for authorization
      jsonb_build_object(
        'provider', 'email',
        'providers', jsonb_build_array('email'),
        'role', u.role
      ),
      jsonb_build_object(
        'name', u.name,
        'designation', u.designation,
        'phone', u.phone
      ),
      now(),
      now(),
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    );

    insert into auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      gen_random_uuid(),
      u.id,
      u.id::text,
      jsonb_build_object(
        'sub', u.id::text,
        'email', u.email,
        'email_verified', true
      ),
      'email',
      now(),
      now(),
      now()
    );

    insert into public.crm_users (id, name, email, phone, role, designation)
    values (u.id, u.name, u.email, u.phone, u.role, u.designation);
  end loop;
end $$;
