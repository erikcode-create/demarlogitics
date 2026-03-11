-- CRM tables: permissive ALL for authenticated
CREATE POLICY "Permissive authenticated" ON public.shippers AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive authenticated" ON public.carriers AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive authenticated" ON public.loads AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive authenticated" ON public.contacts AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive authenticated" ON public.contracts AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive authenticated" ON public.lanes AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive authenticated" ON public.activities AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive authenticated" ON public.follow_ups AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive authenticated" ON public.outbound_calls AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive authenticated" ON public.sales_tasks AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive authenticated" ON public.email_templates AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive authenticated" ON public.stage_change_logs AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Carrier portal tables
CREATE POLICY "Permissive authenticated" ON public.carrier_documents AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive authenticated" ON public.carrier_onboarding_documents AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive authenticated" ON public.carrier_portal_users AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- User roles
CREATE POLICY "Permissive authenticated select" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING (true);