-- Add monthly income columns to leads table
alter table public.leads add column if not exists monthly_income int default 0;
alter table public.leads add column if not exists additional_income int default 0;
