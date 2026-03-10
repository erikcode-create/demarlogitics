

## Plan: Add "Preview as Carrier" button to Carrier Detail page

**What**: Add a button on the CarrierDetail page that opens the carrier portal in a new tab/modal, simulating the carrier's view. Since the portal normally requires auth + carrier_portal_users linking, we'll create a preview route that accepts a carrier ID as a query param and renders the portal with mock/direct data.

### Approach

1. **Add a new route** `/portal/preview/:carrierId` that renders the CarrierPortalDashboard in "preview mode" — fetching documents directly by carrier_id instead of requiring auth-based carrier lookup.

2. **Create a `CarrierPortalPreview` page** that:
   - Takes `carrierId` from URL params
   - Fetches carrier name from `carriers` table and documents from `carrier_documents` table filtered by `carrier_id`
   - Renders the same UI as `CarrierPortalDashboard` but without auth checks
   - Shows a banner at top: "Preview Mode — Viewing as [Carrier Name]"
   - Only accessible in preview/dev mode (reuses `isPreviewMode` check)

3. **Add "Preview Portal" button** on `CarrierDetail.tsx` page — an eye icon button that links to `/portal/preview/{carrierId}` (opens in new tab or navigates).

4. **Add route** in `App.tsx` for `/portal/preview/:carrierId`.

### Files to change
- `src/pages/CarrierPortalPreview.tsx` — new file, based on CarrierPortalDashboard but with direct carrier_id fetching and preview banner
- `src/pages/CarrierDetail.tsx` — add "Preview Portal" button
- `src/App.tsx` — add route for `/portal/preview/:carrierId`

