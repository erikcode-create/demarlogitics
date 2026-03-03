

## Contract Statistics Dashboard Widget

### What
Add a new card to the Dashboard that shows contract statistics: total signed, expiring soon (within 30 days), and recently created (last 7 days), with a click-through to the Contracts page.

### Changes

**`src/pages/Dashboard.tsx`**
- Import `FileText` icon from lucide-react
- Add computed values from `contracts` array:
  - `signedCount`: contracts with `status === 'signed'`
  - `expiringSoonCount`: signed contracts where `expiresAt` is within 30 days from now
  - `recentCount`: contracts created in the last 7 days
- Add a new Contract Statistics card in the bottom row (change the grid from `lg:grid-cols-3` to `lg:grid-cols-4`, or insert a new card alongside Alerts). The card will be clickable → navigates to `/contracts`.
- Display the three stats as labeled rows with counts and badges (e.g., warning badge for expiring soon).

### Layout
The Alerts + Recent Activity row currently uses `lg:grid-cols-3` (1 col alerts, 2 col activity). Update to `lg:grid-cols-4` — Alerts (1 col), Contracts (1 col), Recent Activity (2 col).

