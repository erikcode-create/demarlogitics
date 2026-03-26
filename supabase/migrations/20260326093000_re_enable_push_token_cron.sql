-- Re-enable hourly push token cleanup
-- Only deletes tokens where Expo confirms DeviceNotRegistered (app uninstalled)
-- Keeps tokens with InvalidCredentials (config issue, not uninstall)
SELECT cron.schedule(
  'cleanup-stale-push-tokens',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/validate-push-tokens',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.anon_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
