-- Lead tasks (HubSpot-style to-dos with due dates)
create table if not exists public.crm_tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.crm_leads(id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null default 'open' check (status in ('open', 'closed')),
  due_at timestamptz not null,
  assigned_to uuid references public.crm_users(id) on delete set null,
  created_by uuid references public.crm_users(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crm_tasks_lead_id on public.crm_tasks(lead_id);
create index if not exists idx_crm_tasks_assigned_to on public.crm_tasks(assigned_to);
create index if not exists idx_crm_tasks_status_due on public.crm_tasks(status, due_at);
create index if not exists idx_crm_tasks_due_at on public.crm_tasks(due_at);

alter table public.crm_tasks enable row level security;

drop policy if exists "Backend service_role full access on crm_tasks" on public.crm_tasks;
create policy "Backend service_role full access on crm_tasks"
  on public.crm_tasks for all
  to service_role
  using (true)
  with check (true);

-- Bootstrap open tasks from existing lead follow-up times (once)
insert into public.crm_tasks (lead_id, title, description, status, due_at, assigned_to, created_by)
select
  l.id,
  'Follow up with ' || l.name,
  coalesce(nullif(trim(l.notes_summary), ''), 'Migrated from next follow-up.'),
  'open',
  l.next_followup_at,
  l.assigned_to,
  l.assigned_to
from public.crm_leads l
where l.next_followup_at is not null
  and l.stage is distinct from 'closed'
  and not exists (
    select 1 from public.crm_tasks t where t.lead_id = l.id and t.status = 'open'
  );
