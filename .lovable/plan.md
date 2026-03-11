

## Plan: Fix RLS Policies — Add Missing PERMISSIVE Policies

### Problem

Every table in the database has only `RESTRICTIVE` RLS policies. Restrictive policies act as AND filters on top of permissive policies — but since there are zero permissive policies, no rows are ever returned. This is why all data appears missing.

Additionally, the preview bypass lets you into the app without logging in, but the database queries still use the unauthenticated `anon` key, which fails RLS checks requiring `authenticated` role.

### Solution

1. **Add a PERMISSIVE policy** for `authenticated` users on every CRM table (shippers, carriers, loads, contracts, contacts, lanes, activities, follow_ups, outbound_calls, sales_tasks, email_templates, stage_change_logs). The existing RESTRICTIVE policies with `USING (true)` will then correctly allow access.

2. **Add PERMISSIVE policies** for the carrier portal tables (carrier_documents, carrier_onboarding_documents, carrier_portal_users) so the existing RESTRICTIVE policies can filter properly.

3. **Add a PERMISSIVE policy** for user_roles SELECT.

### Database Migration

Single migration adding ~15 permissive policies:

```sql
-- CRM tables: permissive ALL for authenticated
CREATE POLICY "Permissive authenticated" ON public.shippers AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive authenticated" ON public.carriers AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive authenticated" ON public.loads AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- ... (same for contacts, contracts, lanes, activities, follow_ups, outbound_calls, sales_tasks, email_templates, stage_change_logs)

-- Carrier portal tables
CREATE POLICY "Permissive authenticated" ON public.carrier_documents AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive authenticated" ON public.carrier_onboarding_documents AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive authenticated" ON public.carrier_portal_users AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- User roles
CREATE POLICY "Permissive authenticated select" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING (true);
```

The existing RESTRICTIVE policies remain in place and will correctly scope access (e.g., carrier portal users can only see their own documents).

### No Code Changes

The app code is correct — it just needs to be used with an authenticated session. After adding the permissive policies, logging in at `/auth` will restore full data access.

### Files affected

| File | Action |
|------|--------|
| DB migration | **Create** — add permissive policies to all tables |

