-- Karan + Ishan: sales role with SVP Sales designation (can edit inventory via designation).
-- Baljinder Kaur: sales (strict sales; no inventory edit).
-- Temp password for new auth user: RealtyCook#ChangeMe1
--
-- NOTE: Prefer running 20261112191000_fix_auth_trigger_and_seed_baljinder.sql
-- if the auth trigger still references public.users.

-- Fix broken signup trigger that targeted missing public.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
  contact_phone text;
  user_role text;
  user_designation text;
begin
  display_name := nullif(trim(coalesce(new.raw_user_meta_data->>'name', '')), '');
  if display_name is null then
    display_name := split_part(coalesce(new.email, 'user'), '@', 1);
  end if;

  contact_phone := nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), '');
  user_role := lower(nullif(trim(coalesce(
    new.raw_app_meta_data->>'role',
    new.raw_user_meta_data->>'role',
    'sales'
  )), ''));
  if user_role not in ('superadmin', 'admin', 'sales') then
    user_role := 'sales';
  end if;

  user_designation := nullif(trim(coalesce(new.raw_user_meta_data->>'designation', '')), '');
  if user_designation is null then
    user_designation := case user_role
      when 'superadmin' then 'Super Admin'
      when 'admin' then 'Admin'
      else 'Sales'
    end;
  end if;

  insert into public.crm_users (id, name, email, phone, role, designation, active)
  values (
    new.id,
    display_name,
    new.email,
    coalesce(contact_phone, ''),
    user_role,
    user_designation,
    true
  )
  on conflict (id) do update
  set
    email = excluded.email,
    name = coalesce(excluded.name, public.crm_users.name),
    role = excluded.role,
    designation = coalesce(excluded.designation, public.crm_users.designation),
    phone = case
      when excluded.phone = '' then public.crm_users.phone
      else excluded.phone
    end,
    active = true;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 1) Role updates on CRM profiles
update public.crm_users
set
  role = 'sales',
  designation = 'SVP Sales'
where id in (
  '1e5c864f-af1d-4349-a4b3-f63946decdba', -- Karan Yadav
  '83949b21-3a79-4927-b645-101c5bbce73c'  -- Ishan Kaushal
);

-- Keep auth app_metadata.role in sync (used for authorization)
update auth.users
set
  raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'sales'),
  raw_user_meta_data =
    coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('designation', 'SVP Sales'),
  updated_at = now()
where id in (
  '1e5c864f-af1d-4349-a4b3-f63946decdba',
  '83949b21-3a79-4927-b645-101c5bbce73c'
);

-- 2) Seed Baljinder Kaur (idempotent)
delete from auth.identities
where user_id = 'b7e2c914-6a5f-4d8e-9c1b-3f8a0d2e5c71'
   or provider_id = 'b7e2c914-6a5f-4d8e-9c1b-3f8a0d2e5c71';

delete from public.crm_users
where id = 'b7e2c914-6a5f-4d8e-9c1b-3f8a0d2e5c71'
   or lower(email) = 'realtycookbaljinder@gmail.com';

delete from auth.users
where id = 'b7e2c914-6a5f-4d8e-9c1b-3f8a0d2e5c71'
   or lower(email) = 'realtycookbaljinder@gmail.com';

do $$
declare
  seed_password text := crypt('RealtyCook#ChangeMe1', gen_salt('bf'));
  uid uuid := 'b7e2c914-6a5f-4d8e-9c1b-3f8a0d2e5c71';
begin
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
    uid,
    'authenticated',
    'authenticated',
    'realtycookbaljinder@gmail.com',
    seed_password,
    now(),
    jsonb_build_object(
      'provider', 'email',
      'providers', jsonb_build_array('email'),
      'role', 'sales'
    ),
    jsonb_build_object(
      'name', 'Baljinder Kaur',
      'designation', 'Sales',
      'phone', '919056030813'
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
    uid,
    uid::text,
    jsonb_build_object(
      'sub', uid::text,
      'email', 'realtycookbaljinder@gmail.com',
      'email_verified', true
    ),
    'email',
    now(),
    now(),
    now()
  );

  insert into public.crm_users (id, name, email, phone, role, designation, active)
  values (
    uid,
    'Baljinder Kaur',
    'realtycookbaljinder@gmail.com',
    '919056030813',
    'sales',
    'Sales',
    true
  )
  on conflict (id) do update
  set
    name = excluded.name,
    email = excluded.email,
    phone = excluded.phone,
    role = excluded.role,
    designation = excluded.designation,
    active = true;
end $$;
