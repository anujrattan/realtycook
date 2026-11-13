-- Rename leftover follow-up columns to task-centric names (unified Tasks model)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'crm_leads' and column_name = 'next_followup_at'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'crm_leads' and column_name = 'next_task_due_at'
  ) then
    alter table public.crm_leads rename column next_followup_at to next_task_due_at;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'crm_lead_comments' and column_name = 'followup_scheduled_for'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'crm_lead_comments' and column_name = 'task_scheduled_for'
  ) then
    alter table public.crm_lead_comments rename column followup_scheduled_for to task_scheduled_for;
  end if;
end $$;

comment on column public.crm_leads.next_task_due_at is
  'Denormalized next open task due time for pipeline cards; source of truth is crm_tasks.';

comment on column public.crm_lead_comments.task_scheduled_for is
  'Optional task due stamped on a timeline note when a follow-up task was scheduled with that note.';
