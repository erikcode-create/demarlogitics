

## Bulk Rate Confirmation Creation

### Overview
Add a "Bulk Create" flow to the Contracts page that lets users select multiple booked loads and generate rate confirmations for all of them at once, with a single e-sign step.

### Changes

**New file: `src/pages/ContractBulkCreate.tsx`**
- Page with 3 steps: Select Loads → Review → Sign All
- Step 1: Checkbox table of all booked/in-transit loads that don't already have a rate confirmation. Show load number, origin → destination, carrier, and rate. "Select All" toggle at top.
- Step 2: Summary list showing the generated title for each selected load (e.g., "Rate Confirmation — DT-2026-001"). Expandable preview of each contract's terms.
- Step 3: Single e-sign (checkbox + name input) that applies to all contracts at once.
- On sign: generate one `Contract` object per load using `generateRateConfirmation`, add all to context, show success toast with count, navigate to `/contracts`.

**`src/pages/Contracts.tsx`**
- Add a "Bulk Create" button next to "New Contract" that links to `/contracts/bulk-create`.

**`src/App.tsx`**
- Add route `/contracts/bulk-create` → `ContractBulkCreate`.

### Filtering Logic
To avoid duplicates, the load selection table filters out loads that already have a rate confirmation contract (match by `loadId` in existing contracts).

### Technical Notes
- Reuses `generateRateConfirmation` from `contractTemplates.ts` — no template changes needed.
- Each generated contract gets a unique ID (`ct${Date.now()}-${index}`), individual `terms`, and shares the same `signedByName`/`signedAt`/`expiresAt`.

