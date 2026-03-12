-- SympleTax Leads Table Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/pmjtjmoekakaguovyndq/sql

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- Debt Information
  debt_range TEXT,
  debt_type TEXT,
  irs_notice TEXT,
  tax_situation TEXT,
  
  -- Tax Years
  federal_years TEXT[],
  state_years TEXT[],
  
  -- Financial Details
  income TEXT,
  expenses TEXT,
  assets TEXT,
  equity TEXT,
  
  -- Calculated Values
  estimated_debt INTEGER,
  estimated_settlement INTEGER,
  estimated_savings INTEGER,
  
  -- Case Information
  case_number TEXT UNIQUE,
  payment_plan TEXT DEFAULT 'full',
  payment_status TEXT DEFAULT 'pending',
  payment_amount INTEGER,
  payment_date TIMESTAMPTZ,
  
  -- Status & Tracking
  status TEXT DEFAULT 'new',
  source TEXT DEFAULT 'portal',
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_case_number ON leads(case_number);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at 
  BEFORE UPDATE ON leads 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create policy for service role (full access)
CREATE POLICY "Service role has full access" ON leads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policy for anon (insert only - for public form submissions)
CREATE POLICY "Anyone can insert leads" ON leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create payments table for tracking payment history
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  plan TEXT NOT NULL,
  status TEXT DEFAULT 'completed',
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_lead_id ON payments(lead_id);

-- Enable RLS on payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access on payments" ON payments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create a view for easy lead display with calculated fields
CREATE OR REPLACE VIEW leads_view AS
SELECT 
  id,
  first_name,
  last_name,
  email,
  phone,
  debt_range,
  debt_type,
  irs_notice,
  tax_situation,
  federal_years,
  state_years,
  income,
  estimated_debt,
  estimated_settlement,
  estimated_savings,
  case_number,
  payment_plan,
  payment_status,
  status,
  created_at,
  updated_at,
  CONCAT(first_name, ' ', last_name) as full_name,
  CASE 
    WHEN irs_notice IN ('levy', 'garnishment') THEN true 
    ELSE false 
  END as is_urgent
FROM leads;

-- Grant access to the view
GRANT SELECT ON leads_view TO service_role;

-- Insert a test lead (optional - remove in production)
-- INSERT INTO leads (first_name, last_name, email, phone, debt_range, debt_type, irs_notice, tax_situation, federal_years, income, estimated_debt)
-- VALUES ('Test', 'User', 'test@example.com', '(555) 123-4567', 's25to50', 'federal', 'none', 'back_taxes', ARRAY['2023', '2022'], 's50to75', 37500);