-- Profile fields for CRM users
alter table public.crm_users
  add column if not exists first_name text not null default '',
  add column if not exists last_name text not null default '',
  add column if not exists address text not null default '',
  add column if not exists avatar_url text;

-- Backfill first/last from existing full name
update public.crm_users
set
  first_name = case
    when coalesce(nullif(trim(first_name), ''), '') <> '' then first_name
    else split_part(trim(name), ' ', 1)
  end,
  last_name = case
    when coalesce(nullif(trim(last_name), ''), '') <> '' then last_name
    else trim(regexp_replace(trim(name), '^\S+\s*', ''))
  end
where coalesce(nullif(trim(first_name), ''), '') = ''
   or coalesce(nullif(trim(last_name), ''), '') = '';
