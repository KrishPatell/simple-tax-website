-- ═══════════════════════════════════════════════════════════════
-- SympleTax: Schema matching submit-lead Edge Function
-- Use this if you need to recreate the leads table from scratch
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  debt_range TEXT,
  debt_type TEXT,
  irs_notice TEXT,
  tax_situation TEXT,
  federal_years TEXT[],
  state_years TEXT[],
  income TEXT,
  expenses TEXT,
  assets TEXT,
  equity TEXT,
  estimated_debt INTEGER,
  estimated_settlement INTEGER,
  estimated_savings INTEGER,
  case_number TEXT UNIQUE,
  payment_plan TEXT DEFAULT 'full',
  payment_method TEXT,
  ach_account_type TEXT,
  payment_status TEXT DEFAULT 'pending',
  payment_amount INTEGER,
  payment_date TIMESTAMPTZ,
  status TEXT DEFAULT 'new',
  source TEXT DEFAULT 'portal',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_case_number ON leads(case_number);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role has full access" ON leads;
CREATE POLICY "Service role has full access" ON leads
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert leads" ON leads;
CREATE POLICY "Anyone can insert leads" ON leads
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  plan TEXT NOT NULL,
  payment_method TEXT,
  ach_account_type TEXT,
  status TEXT DEFAULT 'completed',
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_lead_id ON payments(lead_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role has full access on payments" ON payments;
CREATE POLICY "Service role has full access on payments" ON payments
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
