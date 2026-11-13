-- Product images for inventory units
alter table public.crm_properties
  add column if not exists image_urls text[] not null default '{}'::text[],
  add column if not exists cover_image_url text;

-- Public bucket for inventory product photos (reads are public; writes via service role)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'inventory-images',
  'inventory-images',
  true,
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read for objects in this bucket (uploads still use service role)
drop policy if exists "Public read inventory images" on storage.objects;
create policy "Public read inventory images"
  on storage.objects
  for select
  to public
  using (bucket_id = 'inventory-images');
