

## Contracts Module

### Data Layer
Add to `src/types/index.ts`:
- `ContractType`: `'shipper_agreement' | 'carrier_agreement' | 'rate_confirmation'`
- `ContractStatus`: `'draft' | 'sent' | 'signed' | 'expired'`
- `Contract` interface with: `id`, `type`, `status`, `entityId`, `entityType` (shipper/carrier), `loadId?` (for rate confirmations), `title`, `terms`, `signedByName`, `signedAt`, `createdAt`, `expiresAt`

Add `contracts` state array to `AppContext` with mock data.

### Templates
Create `src/utils/contractTemplates.ts` with three functions that auto-fill from CRM data:
- **Shipper Agreement** — pulls company name, address, payment terms, credit limit
- **Carrier Agreement** — pulls MC#, DOT#, insurance info, equipment types
- **Rate Confirmation** — pulls load details (origin, dest, rates, dates) plus shipper/carrier info

Each returns structured sections (parties, terms, rates, liability, etc.) as template data.

### Pages & Routes
1. **`/contracts`** — list view with tabs by type, status badges, search/filter
2. **`/contracts/new`** — create contract: select type → select entity → review auto-filled template → checkbox e-sign → save
3. **`/contracts/:id`** — view signed contract with signature details and status

### Checkbox E-Sign Flow
- Review generated contract text
- "I agree" checkbox + typed full name field
- On submit: saves `signedByName` and `signedAt` timestamp, sets status to `signed`

### Navigation
Add `FileText` icon "Contracts" nav item to sidebar between Loads and Alerts.

### Files to create/edit
- `src/types/index.ts` — add contract types
- `src/data/mockData.ts` — add mock contracts
- `src/context/AppContext.tsx` — add contracts state
- `src/utils/contractTemplates.ts` — template generators
- `src/pages/Contracts.tsx` — list page
- `src/pages/ContractNew.tsx` — create/sign flow
- `src/pages/ContractDetail.tsx` — view signed contract
- `src/components/layout/AppSidebar.tsx` — add nav item
- `src/App.tsx` — add routes

