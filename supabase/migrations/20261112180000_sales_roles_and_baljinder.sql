-- Demote Karan + Ishan to sales, add Baljinder Kaur (sales).
-- Temp password for new auth user: RealtyCook#ChangeMe1

-- 1) Role updates on CRM profiles
update public.crm_users
set
  role = 'sales',
  designation = 'Sales'
where id in (
  '1e5c864f-af1d-4349-a4b3-f63946decdba', -- Karan Yadav
  '83949b21-3a79-4927-b645-101c5bbce73c'  -- Ishan Kaushal
);

-- Keep auth app_metadata.role in sync (used for authorization)
update auth.users
set
  raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'sales'),
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
  );
end $$;
