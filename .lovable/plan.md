

## Contract Expiration Alerts

### Changes

**`src/utils/alertEngine.ts`**
- Add `'contract_expiry'` to the `AlertType` union
- Add `'contract'` to the `entityType` union in the `Alert` interface
- Import `Contract` type
- Accept `contracts: Contract[]` as a new parameter to `generateAlerts`
- Add Section 5: scan signed contracts where `expiresAt` is past (critical) or within 30 days (warning)

**`src/pages/Alerts.tsx`**
- Add a "Contracts" tab to `tabConfig` with `FileText` icon
- Update `useAppContext` to pull `contracts`
- Pass `contracts` to `generateAlerts`
- Handle `contract` entity type in `handleNavigate` → `/contracts/${id}`

**`src/components/layout/AppSidebar.tsx`**
- Pass `contracts` to `generateAlerts` in the sidebar badge count

**`src/pages/Dashboard.tsx`**
- Pass `contracts` to `generateAlerts` in the dashboard alerts summary

