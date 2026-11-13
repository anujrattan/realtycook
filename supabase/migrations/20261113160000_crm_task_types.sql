-- HubSpot-style task types on crm_tasks (unifies follow-ups + to-dos)
alter table public.crm_tasks
  add column if not exists task_type text not null default 'todo';

alter table public.crm_tasks
  drop constraint if exists crm_tasks_task_type_check;

alter table public.crm_tasks
  add constraint crm_tasks_task_type_check
  check (task_type in ('follow_up', 'call', 'email', 'todo', 'meeting'));

-- Existing seeded "Follow up with …" rows → follow_up; everything else stays todo
update public.crm_tasks
set task_type = 'follow_up'
where task_type = 'todo'
  and title ilike 'follow up%';

create index if not exists idx_crm_tasks_task_type on public.crm_tasks (task_type);
