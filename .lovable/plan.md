

# Add Rate Con Deletion on Carrier Detail Page

## Problem
Carriers accumulate too many rate confirmations and there's no way to delete them from the Carrier Detail page. Deletion exists on LoadDetail but not on the carrier view.

## Changes

### `src/pages/CarrierDetail.tsx`
1. Add a new **"Rate Confirmations"** tab that fetches `carrier_documents` (type = `rate_con`) for the carrier
2. Display each rate con with its load ID, status, date, and a **Delete** button with confirmation dialog
3. Reuse the same delete pattern from `LoadDetail.tsx` — call `supabase.from('carrier_documents').delete().eq('id', docId)` and update local state
4. Show document count in the tab label

This is a single-file change. The RLS policies already allow authenticated non-carrier-portal users full access to `carrier_documents`, so no database changes are needed.

