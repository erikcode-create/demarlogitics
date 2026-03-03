

## Alerts System

### New Page & Route
- Create `src/pages/Alerts.tsx` with route `/alerts`
- Add "Alerts" nav item to `AppSidebar.tsx` with `Bell` icon

### Alert Generation Logic
Create `src/utils/alertEngine.ts` that derives alerts from existing data:

1. **Insurance Expiring** — scan carriers where `insuranceExpiry` is within 30 days (warning) or past (critical)
2. **Missing Documents** — scan carriers where `w9Uploaded`, `insuranceCertUploaded`, or `carrierPacketUploaded` is false
3. **Follow-up Reminders** — scan `followUps` where `completed === false` and `date` is today or past
4. **AR Aging** — scan loads with status `invoiced` where `invoiceDate` is 30+ days old (warning) or 45+ days (critical)

Each alert has: `id`, `type`, `severity` (critical/warning/info), `title`, `message`, `entityId`, `entityType`, `date`.

### Alerts Page UI
- Filter tabs: All | Insurance | Documents | Follow-ups | AR Aging
- Alert cards with severity color coding (red = critical, yellow = warning, blue = info)
- Click-through links to the related carrier/shipper/load detail page
- Dismiss/acknowledge action per alert (stored in local state)
- Summary count badges on each tab

### Dashboard Integration
- Add an alerts summary card to the Dashboard showing count by severity
- Link to `/alerts` page

### Sidebar Badge
- Show total active alert count as a badge on the Alerts nav item

