-- ============================================================================
-- RealtyCook CRM — Supabase Postgres Schema (with RLS enabled)
-- Run this in your Supabase SQL Editor when connecting your live Supabase DB.
-- Note: All queries run from the Next.js backend using SUPABASE_SERVICE_ROLE_KEY.
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. CRM Users (1 Superadmin, Admins, and Sales Accounts)
create table if not exists public.crm_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
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
  intent text not null check (intent in ('buy', 'sell', 'invest', 'lease')),
  pillar text not null default 'homes' check (pillar in ('homes', 'commercial', 'upcoming', 'land', 'leasing')),
  budget text not null default 'unsure',
  city text not null default '',
  stage text not null default 'new' check (
    stage in ('new', 'mandate', 'shortlist', 'site_visit', 'negotiation', 'registry', 'closed')
  ),
  source text not null default 'Website Form',
  assigned_to uuid references public.crm_users(id) on delete set null,
  next_followup_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.crm_leads enable row level security;

-- 3. Lead Conversation Comments & Activity Log
create table if not exists public.crm_comments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.crm_leads(id) on delete cascade,
  author_id uuid references public.crm_users(id) on delete set null,
  author_name text not null,
  author_role text not null,
  body text not null,
  followup_scheduled_for timestamptz,
  created_at timestamptz not null default now()
);

alter table public.crm_comments enable row level security;

-- Seed default Superadmin, Admin (Karan Yadav), and initial Sales accounts
insert into public.crm_users (name, email, phone, role, designation)
values
  ('Anuj Rattan', 'anuj@realtycook.com', '919800000001', 'superadmin', 'Founder & Superadmin'),
  ('Karan Yadav', 'karan@realtycook.com', '919056050813', 'admin', 'VP - Sales'),
  ('Amanpreet Singh', 'aman@realtycook.com', '919876543210', 'sales', 'Senior Sales Associate'),
  ('Neha Sharma', 'neha@realtycook.com', '919876543211', 'sales', 'Leasing & Commercial Specialist')
on conflict (email) do nothing;
