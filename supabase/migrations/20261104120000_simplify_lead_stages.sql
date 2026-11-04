-- Align lead stages to the sales funnel and status-specific reasons.
alter table public.crm_leads
  add column if not exists closure_reason text;

update public.crm_leads
set
  stage = case stage
    when 'mandate_locked' then 'meeting'
    when 'shortlist_shared' then 'meeting'
    when 'qualified' then 'meeting'
    when 'paperwork_registry' then 'negotiation'
    when 'closed_won' then 'closed'
    when 'lost_hold' then 'closed'
    else stage
  end,
  closure_reason = case
    when stage = 'closed_won' then 'deal_won'
    when stage = 'lost_hold' then 'deal_lost'
    when closure_reason = 'not_looking' then 'not_interested'
    when closure_reason = 'unreachable' then 'switched_off'
    when stage = 'closed' and closure_reason is null then 'other'
    else closure_reason
  end
where stage in (
  'mandate_locked',
  'shortlist_shared',
  'qualified',
  'paperwork_registry',
  'closed_won',
  'lost_hold',
  'closed'
)
or closure_reason in ('not_looking', 'unreachable');

alter table public.crm_leads drop constraint if exists crm_leads_stage_check;
alter table public.crm_leads drop constraint if exists crm_leads_closure_reason_check;

alter table public.crm_leads
  add constraint crm_leads_stage_check check (
    stage in (
      'new_enquiry',
      'contacted',
      'meeting',
      'site_visit_scheduled',
      'negotiation',
      'closed'
    )
  );

alter table public.crm_leads
  add constraint crm_leads_closure_reason_check check (
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
  );
