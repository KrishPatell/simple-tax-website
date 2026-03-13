-- Add payment_method and ach_account_type for Card/ACH flow
ALTER TABLE leads ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ach_account_type TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS ach_account_type TEXT;
