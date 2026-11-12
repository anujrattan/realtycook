-- Ensure Karan + Ishan show as SVP Sales (still sales role; cannot edit inventory).
-- Baljinder remains designation Sales.

update public.crm_users
set designation = 'SVP Sales'
where id in (
  '1e5c864f-af1d-4349-a4b3-f63946decdba', -- Karan Yadav
  '83949b21-3a79-4927-b645-101c5bbce73c'  -- Ishan Kaushal
);

update auth.users
set
  raw_user_meta_data =
    coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('designation', 'SVP Sales'),
  updated_at = now()
where id in (
  '1e5c864f-af1d-4349-a4b3-f63946decdba',
  '83949b21-3a79-4927-b645-101c5bbce73c'
);
