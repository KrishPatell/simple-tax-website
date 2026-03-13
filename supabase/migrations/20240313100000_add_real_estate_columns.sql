-- Add real estate columns to leads table
alter table public.leads add column if not exists owns_real_estate text;
alter table public.leads add column if not exists home_value int default 0;
alter table public.leads add column if not exists home_mortgage int default 0;
