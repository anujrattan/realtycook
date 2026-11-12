-- Ensure Karan + Ishan are sales role with SVP Sales designation
-- (SVP Sales can edit inventory; Baljinder / regular Sales cannot).
-- Also repair auth signup trigger if it still targets missing public.users.

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

update public.crm_users
set
  role = 'sales',
  designation = 'SVP Sales'
where id in (
  '1e5c864f-af1d-4349-a4b3-f63946decdba', -- Karan Yadav
  '83949b21-3a79-4927-b645-101c5bbce73c'  -- Ishan Kaushal
);

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
