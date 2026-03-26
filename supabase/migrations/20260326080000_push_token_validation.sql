-- Add validation columns to driver_push_tokens
ALTER TABLE driver_push_tokens ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE driver_push_tokens ADD COLUMN IF NOT EXISTS last_validated timestamptz;
