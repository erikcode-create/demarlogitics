

## Remove All Mock Data

Clear out every fake/demo record from `src/data/mockData.ts` so the app starts with empty state.

### Changes

**`src/data/mockData.ts`** — Replace all populated arrays with empty arrays:
- `mockShippers: Shipper[] = []`
- `mockContacts: Contact[] = []`
- `mockLanes: Lane[] = []`
- `mockFollowUps: FollowUp[] = []`
- `mockActivities: Activity[] = []`
- `mockCarriers: Carrier[] = []`
- `mockLoads: Load[] = []`
- `mockContracts: Contract[] = []`
- `mockEmailTemplates: EmailTemplate[] = []`

No other files need changes — the context provider and components already reference these arrays, so they'll simply render empty states.

