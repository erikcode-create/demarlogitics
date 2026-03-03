

# Demar Transportation — Freight Brokerage CRM + TMS (Phase 1)

## Design
- Dark professional theme: navy/charcoal backgrounds, white text, blue/teal accent colors
- Sidebar navigation with collapsible sections
- Clean data tables, card-based dashboards, modern form layouts

## Phase 1 Scope

### 1. App Shell & Navigation
- Sidebar with sections: Dashboard, Shippers, Carriers, Loads
- Top bar with user avatar, notifications bell, search
- Responsive layout

### 2. Dashboard
- Revenue & margin summary cards
- Load pipeline chart (by status)
- AR/AP aging overview
- Recent activity feed
- Quick-action buttons (New Load, New Shipper, New Carrier)

### 3. Shipper CRM
- **List view**: Searchable/filterable table of shippers
- **Company profile page**: Company info, contacts, sales stage, notes
- **Contact management**: Add/edit contacts per shipper
- **Sales stages**: Lead → Prospect → Quoted → Active → Inactive
- **Lane tracking**: Origin/destination lanes with rates per shipper
- **Follow-up scheduling**: Date picker + reminder notes
- **Activity log**: Timestamped log of calls, emails, notes

### 4. Carrier CRM
- **List view**: Searchable/filterable table of carriers
- **Carrier profile page**: MC#, DOT#, insurance info, equipment types
- **Insurance tracking**: Expiration dates with visual indicators (green/yellow/red)
- **Document uploads**: Upload area for W9, insurance cert, carrier packet docs
- **Carrier packet status**: Not Started → In Progress → Complete → Expired
- **Factoring info**: Factoring company, remit-to details

### 5. Load Management
- **Load board**: Table/kanban of all loads with status filters
- **Load creation form**: Origin, destination, pickup/delivery dates, rate, weight, equipment type
- **Assign shipper & carrier**: Select from CRM data
- **Auto-calculated margin**: Shipper rate minus carrier rate, shown as $ and %
- **Status tracking**: Available → Booked → In Transit → Delivered → Invoiced → Paid
- **POD upload**: File upload for proof of delivery
- **Invoice & payment tracking**: Invoice #, date, amount, payment status

### 6. Data Layer (Mock/Local State)
- All data stored in React state/context with realistic mock data
- Structured to mirror a relational database (shippers, contacts, carriers, loads, etc.)
- Ready for future Supabase integration

## What's Deferred to Phase 2
- User authentication & role-based access
- Contracts module (templates, auto-fill, e-sign)
- Alerts system (insurance, documents, follow-ups, AR aging)
- Sales rep performance metrics
- Database backend (Supabase)

