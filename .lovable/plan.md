

## Outbound Sales System -- Implementation Plan

This is a large system spanning 9 modules. Since there is no backend yet (all data is React state/context), everything will be built as client-side state with the existing pattern. User roles will be UI-only (no auth enforcement). "Automation" will run as deterministic logic on state changes rather than background jobs.

The work breaks into 4 phases across ~15 files.

---

### Phase 1: Data Foundation

**`src/types/index.ts`** -- New types and updated enums:

- Expand `SalesStage` to: `prospect | contacted | engaged | lane_discussed | quoting | contract_sent | active | dormant | closed_lost`
- New `CallOutcome` type: `no_answer | left_voicemail | gatekeeper | spoke_not_interested | spoke_send_info | spoke_quote_requested`
- New `TaskNextStep` type: `follow_up_call | send_email | quote_lane | schedule_meeting | close`
- New `CadenceTaskType`: `call | email | linkedin_reminder`
- New `OutboundCall` interface: `id, shipperId, contactName, contactTitle, directPhone, email, callAttemptNumber, callDate, callOutcome, painPoint, notes, nextStep, nextFollowUpDate, assignedSalesRep, createdAt`
- New `SalesTask` interface: `id, shipperId, type (call/email/linkedin), title, description, dueDate, completed, completedAt, templateId?, cadenceDay?, createdAt`
- New `EmailTemplate` interface: `id, name, subject, body (with {{placeholders}}), createdAt`
- New `StageChangeLog` interface: `id, shipperId, fromStage, toStage, changedAt, changedBy`

**`src/data/mockData.ts`**:
- Update `salesStageLabels` map for new stages
- Add 4 default `EmailTemplate` records (Intro, Lane Question, Backup Capacity, Close the Loop)
- Add sample `OutboundCall` and `SalesTask` records for existing shippers

**`src/context/AppContext.tsx`**:
- Add state arrays: `outboundCalls`, `salesTasks`, `emailTemplates`, `stageChangeLogs`
- Add helper functions: `logStageChange()` (auto-logs when salesStage changes on a shipper), `generateCadenceTasks()` (creates the 14-day task sequence for a prospect)

---

### Phase 2: Call Activity Module + Sales Pipeline

**`src/pages/OutboundCalls.tsx`** -- New page:
- Fast call logging form at top (company dropdown linked to shippers, pre-fills region/industry/equipment from shipper notes, contact fields, outcome dropdown, pain point, notes, next step)
- Call log table below with filters by date, outcome, rep
- Auto-stamps timestamp on save
- When outcome = `spoke_quote_requested`: auto-changes shipper stage to `quoting`, creates a 24-hour follow-up task

**`src/pages/SalesPipeline.tsx`** -- New page:
- Kanban board view with columns for each stage (Prospect through Closed-Lost)
- Cards show company name, contact, last activity date, est. monthly loads
- Drag-and-drop between columns logs a `StageChangeLog` entry
- Summary counts per column

**`src/pages/Shippers.tsx`** + **`src/pages/ShipperDetail.tsx`**:
- Update stage filter dropdown and badge colors for new 9-stage values
- Add "Call History" tab on detail page showing filtered outbound calls
- Add "Stage History" tab showing timeline of stage changes
- Add "Tasks" tab showing open/completed sales tasks

---

### Phase 3: Cadence Engine, Email Templates, Automation

**`src/utils/cadenceEngine.ts`** -- New utility:
- `generateCadenceTasks(shipperId)`: Creates 7 tasks at days 1,1,3,5,7,10,14 per the spec
- `evaluateAutomationRules(context)`: Runs the 5 automation rules against current state:
  - Rule 1: Quote requested → stage to Quoting + 24h task
  - Rule 2: Active → recurring 14-day follow-up
  - Rule 3: No activity in 30 days on Active → alert
  - Rule 4: (Email open tracking not available without backend -- skip or mark as placeholder)
  - Rule 5: Contract sent + not signed in 5 days → reminder task

**`src/pages/EmailTemplates.tsx`** -- New page:
- List/edit the 4 templates
- Preview with variable substitution (Contact_Name, Company_Name, Equipment_Type, Region)
- "Copy to Clipboard" for use in external email client

**`src/pages/SalesTasks.tsx`** -- New page:
- Task list with filters: overdue, today, upcoming, completed
- Group by shipper or by type
- Quick-complete checkbox
- Shows cadence tasks and automation-generated tasks

---

### Phase 4: Sales Dashboard + KPI Tracker

**`src/pages/SalesDashboard.tsx`** -- New page (or extend existing Dashboard):
- Widget cards: Calls Made Today, Conversations Today, Quotes This Week, New Prospects, Active Accounts, Dormant Accounts
- Pipeline funnel chart (Prospect → Active conversion)
- Revenue per rep (derived from loads linked to shippers by rep)

**`src/pages/PerformanceTracker.tsx`** -- New page:
- KPI table per sales rep with color-coding:
  - Red if below: 40 dials/day, 10 conversations/day, 5 lane discussions/week, 1 new account/month
- Conversion % calculation: shippers that moved from Prospect to Active / total prospects

---

### Navigation & Routing

**`src/components/layout/AppSidebar.tsx`**: Add "Sales" group with sub-items:
- Outbound Calls, Pipeline, Tasks, Email Templates, Sales Dashboard, Performance

**`src/App.tsx`**: Add routes:
- `/sales/calls`, `/sales/pipeline`, `/sales/tasks`, `/sales/templates`, `/sales/dashboard`, `/sales/performance`

---

### User Roles -- Deferred

Roles (Sales Rep / Operations / Admin) require authentication and a backend to enforce. The current app has no auth. The UI will be built as if the user is Admin (full access). Role-based access control can be layered in when Lovable Cloud or Supabase is connected.

---

### What Won't Work Without a Backend

- Email open tracking (Rule 4) -- requires email service integration
- Real notifications to Operations -- will show as in-app alerts instead
- Persistent automation timers -- cadence tasks are generated on stage change, not via cron
- True multi-user rep assignment -- single-user for now, rep name is a text field

