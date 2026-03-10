
-- Drop old permissive policies on all tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['activities','carriers','contacts','contracts','email_templates','follow_ups','lanes','loads','outbound_calls','sales_tasks','shippers','stage_change_logs'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow all access" ON public.%I', tbl);
    EXECUTE format('CREATE POLICY "Authenticated access" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', tbl);
  END LOOP;
END $$;
