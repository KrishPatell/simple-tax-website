-- ============================================================
--  qualify_leads table
--  Source: /get-started page qualification form (7 steps)
--  Different from `leads` table — no payment, simpler questions
-- ============================================================

create table if not exists qualify_leads (
  id              uuid        default gen_random_uuid() primary key,
  case_number     text        unique not null,

  -- Contact (Step 7 — final step)
  first_name      text        not null,
  last_name       text        not null,
  email           text        not null,
  phone           text        not null,

  -- Step 1: What prompted them to seek relief (checkbox, multiple values)
  -- Values: 'irs_notice', 'garnishment', 'unpaid_taxes', 'other'
  prompted        text[]      default '{}',

  -- Step 2: Do you have unfiled tax years?
  -- Values: 'yes', 'no', 'not_sure'
  unfiled_years   text,

  -- Step 3: How much tax debt?
  -- Values: 'under5k', '5k-10k', '10k-25k', '25k-50k', '50k-75k', '75k-plus'
  debt_amount     text,

  -- Step 4: Federal or state taxes?
  -- Values: 'federal', 'state', 'both'
  tax_type        text,

  -- Step 5: Type of tax issue
  -- Values: 'personal', 'business', 'both'
  issue_type      text,

  -- Step 6: Currently in bankruptcy?
  -- Values: 'yes', 'no'
  bankruptcy      text,

  -- Terms & privacy agreed (Step 7 checkbox)
  terms_agreed    boolean     default false,

  -- CRM / pipeline status
  -- Values: 'new', 'contacted', 'qualified', 'enrolled', 'disqualified'
  status          text        default 'new',

  -- Source tracking
  source          text        default 'get-started',

  -- Tech metadata
  ip_address      text,
  user_agent      text,

  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Auto-update updated_at on any row change
create or replace function update_qualify_leads_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger qualify_leads_updated_at
  before update on qualify_leads
  for each row execute function update_qualify_leads_updated_at();

-- Indexes for common queries
create index if not exists qualify_leads_email_idx   on qualify_leads (email);
create index if not exists qualify_leads_status_idx  on qualify_leads (status);
create index if not exists qualify_leads_created_idx on qualify_leads (created_at desc);
