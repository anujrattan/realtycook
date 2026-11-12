-- Bootstrap auth.users for all active crm_users + first-login password reset flag.
-- Default password (change on first login): Cook1234
-- auth.users.id === public.crm_users.id

alter table public.crm_users
  add column if not exists must_reset_password boolean not null default true;

-- Ensure Baljinder and any existing auth users also require reset until they change it
update public.crm_users
set must_reset_password = true
where active = true;

-- Repair signup trigger to keep crm_users in sync (crm_users, not public.users)
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

  insert into public.crm_users (id, name, email, phone, role, designation, active, must_reset_password)
  values (
    new.id,
    display_name,
    new.email,
    coalesce(contact_phone, ''),
    user_role,
    user_designation,
    true,
    coalesce((new.raw_app_meta_data->>'must_reset_password')::boolean, true)
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

do $$
declare
  seed_password text := crypt('Cook1234', gen_salt('bf'));
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
          'sales',
          'SVP Sales'
        ),
        (
          '83949b21-3a79-4927-b645-101c5bbce73c'::uuid,
          'Ishan Kaushal',
          'ishanrealtycook@gmail.com',
          '919056060813',
          'sales',
          'SVP Sales'
        ),
        (
          'b7e2c914-6a5f-4d8e-9c1b-3f8a0d2e5c71'::uuid,
          'Baljinder Kaur',
          'realtycookbaljinder@gmail.com',
          '919056030813',
          'sales',
          'Sales'
        )
    ) as t(id, name, email, phone, role, designation)
  loop
    -- Upsert auth user
    if exists (select 1 from auth.users where id = u.id or lower(email) = lower(u.email)) then
      update auth.users
      set
        email = u.email,
        encrypted_password = seed_password,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_app_meta_data =
          coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
            'provider', 'email',
            'providers', jsonb_build_array('email'),
            'role', u.role,
            'must_reset_password', true
          ),
        raw_user_meta_data =
          coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
            'name', u.name,
            'designation', u.designation,
            'phone', u.phone
          ),
        updated_at = now()
      where id = u.id or lower(email) = lower(u.email);
    else
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
        jsonb_build_object(
          'provider', 'email',
          'providers', jsonb_build_array('email'),
          'role', u.role,
          'must_reset_password', true
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
    end if;

    -- Ensure identity row for email provider
    delete from auth.identities
    where user_id = u.id and provider = 'email';

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

    insert into public.crm_users (id, name, email, phone, role, designation, active, must_reset_password)
    values (u.id, u.name, u.email, u.phone, u.role, u.designation, true, true)
    on conflict (id) do update
    set
      name = excluded.name,
      email = excluded.email,
      phone = excluded.phone,
      role = excluded.role,
      designation = excluded.designation,
      active = true,
      must_reset_password = true;
  end loop;
end $$;
