-- Expand crm_properties to hold Inventory Master sheet fields.
-- Existing CRM display columns (title, locality, price_label, …) stay as denormalized
-- summary fields for lead matching / WhatsApp share cards.

alter table public.crm_properties
  add column if not exists project_name text,
  add column if not exists property_type text,
  add column if not exists city text,
  add column if not exists locality_area text,
  add column if not exists developer_name text,
  add column if not exists rera_number text,
  add column if not exists listing_link text,
  add column if not exists configuration text,
  add column if not exists unit_details text,
  add column if not exists super_area_sqft numeric,
  add column if not exists builtup_area_sqft numeric,
  add column if not exists carpet_area_sqft numeric,
  add column if not exists bathrooms numeric,
  add column if not exists availability_status text,
  add column if not exists possession_status text,
  add column if not exists expected_possession_date date,
  add column if not exists quoted_price numeric,
  add column if not exists price_per_sqft numeric,
  add column if not exists plc_notes text,
  add column if not exists ifms_amount numeric,
  add column if not exists club_charges numeric,
  add column if not exists other_charges numeric,
  add column if not exists charges_included text,
  add column if not exists price_list_link text,
  add column if not exists parking_included text,
  add column if not exists additional_parking_cost numeric,
  add column if not exists furnishing_status text,
  add column if not exists appliances_included text,
  add column if not exists power_backup text,
  add column if not exists gas_pipeline text,
  add column if not exists amenities text,
  add column if not exists verification_status text,
  add column if not exists price_verified_date date,
  add column if not exists availability_verified_date date,
  add column if not exists source_links text,
  add column if not exists assigned_to_email text,
  add column if not exists internal_notes text,
  add column if not exists last_updated timestamptz;

create index if not exists idx_crm_properties_city on public.crm_properties(city);
create index if not exists idx_crm_properties_property_type on public.crm_properties(property_type);
create index if not exists idx_crm_properties_configuration on public.crm_properties(configuration);
create index if not exists idx_crm_properties_possession on public.crm_properties(possession_status);
create index if not exists idx_crm_properties_furnishing on public.crm_properties(furnishing_status);
create index if not exists idx_crm_properties_verification_status on public.crm_properties(verification_status);
create index if not exists idx_crm_properties_quoted_price on public.crm_properties(quoted_price);
create index if not exists idx_crm_properties_project_name on public.crm_properties(project_name);
