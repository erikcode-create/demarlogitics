-- Remove the hourly push token validation cron job
SELECT cron.unschedule('validate-push-tokens-hourly');

-- Drop the validation columns - no longer needed
ALTER TABLE driver_push_tokens DROP COLUMN IF EXISTS is_active;
ALTER TABLE driver_push_tokens DROP COLUMN IF EXISTS last_validated;
