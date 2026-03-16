

# Make Workers Compensation Optional in Carrier Onboarding

## Problem
Workers Compensation is currently listed as a required document in the carrier onboarding gate, blocking carriers from proceeding if they don't upload it. It should be optional.

## Changes

### 1. `src/pages/CarrierPortalDashboard.tsx`
- Remove `workers_comp` from the `REQUIRED_DOCS` array
- Add a separate `OPTIONAL_DOCS` array containing workers comp
- Keep the upload UI for workers comp but mark it as optional (not blocking the onboarding gate)

### 2. `src/pages/CarrierPortalPreview.tsx`
- Same changes: remove `workers_comp` from `REQUIRED_DOCS`, add as optional

### 3. `src/pages/CarrierPortalDocument.tsx`
- Update the message text to remove "Workers Comp" from the list of required documents

## Result
Carriers can complete onboarding and access documents after uploading only W-9, COI, MC Authority Letter, and Notice of Assignment. Workers Comp remains available to upload but is not mandatory.

