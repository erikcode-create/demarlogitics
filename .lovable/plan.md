

## Carrier Portal with Document Storage and E-Signatures

### Overview
A separate carrier-facing portal at `/portal/*` where carriers log in via magic link, view all their rate confirmations and BOLs, and digitally sign rate cons (checkbox + typed name).

### Database Changes

**New table: `carrier_documents`**
- `id` uuid PK
- `carrier_id` uuid (references carriers)
- `load_id` uuid (references loads)  
- `type` text ('rate_con' | 'bol')
- `document_data` jsonb (stores all the fields from the builders)
- `status` text ('pending' | 'signed') default 'pending'
- `signed_by_name` text
- `signed_at` timestamptz
- `created_at` timestamptz default now()

RLS: Authenticated users can do everything (internal team). Add a separate SELECT policy so carrier users (matched by email) can read their own documents, plus an UPDATE policy so they can sign.

**New table: `carrier_portal_users`**
- `id` uuid PK
- `user_id` uuid (auth user from magic link)
- `carrier_id` uuid (linked carrier)
- `created_at` timestamptz default now()

This maps magic-link-authenticated users to their carrier record.

### New Pages & Components

**1. `/portal` — Carrier Login Page** (`src/pages/CarrierPortalLogin.tsx`)
- Simple page with DeMar branding
- Email input + "Send Magic Link" button
- Calls `supabase.auth.signInWithOtp({ email })` 
- Shows confirmation message after sending

**2. `/portal/documents` — Carrier Document Dashboard** (`src/pages/CarrierPortalDashboard.tsx`)
- Lists all rate cons and BOLs for the carrier (matched via `carrier_portal_users`)
- Shows status badges (Pending Signature / Signed)
- Click to view individual document

**3. `/portal/documents/:id` — Document View & Sign** (`src/pages/CarrierPortalDocument.tsx`)
- Renders the rate con or BOL as a styled, read-only document
- For rate cons with status "pending": shows signature section at bottom
  - Typed name input + checkbox ("I agree to the terms") + Sign button
  - On sign: updates `carrier_documents` with signed_by_name and signed_at, sets status to 'signed'
- For already-signed docs: shows signature info
- Export PDF button (same print approach)

**4. Portal Layout** (`src/components/layout/CarrierPortalLayout.tsx`)
- Minimal layout with DeMar logo, carrier name, and sign-out button
- No sidebar — clean, simple interface

### Changes to Existing Code

**`src/pages/LoadDetail.tsx`** — Add "Save & Send Rate Con" and "Save & Send BOL" buttons
- Saves document data to `carrier_documents` table
- Optionally sends magic link to carrier's email if they haven't logged in before

**`src/components/documents/RateConBuilder.tsx`** and **`BolBuilder.tsx`**
- Add a "Save to Portal" button alongside "Export PDF"
- Inserts into `carrier_documents` with the current field values as JSON

**`src/App.tsx`** — Add portal routes
- `/portal` → CarrierPortalLogin (public if not authed as carrier)
- `/portal/*` → Protected carrier portal routes

### Auth Flow

1. Internal user generates a rate con/BOL and clicks "Save & Send to Carrier"
2. Document is saved to `carrier_documents`
3. Magic link email sent to carrier's email address
4. Carrier clicks link → authenticated via Supabase magic link
5. On first login, a `carrier_portal_users` record is created linking auth user to carrier
6. Carrier sees all their documents, can sign pending rate cons

### Edge Function: `send-carrier-magic-link`
- Accepts carrier_id + document_id
- Looks up carrier email
- Calls `supabase.auth.admin.generateLink({ type: 'magiclink', email })` with redirect to `/portal/documents/:id`
- Returns success/failure

### File Summary
- **New files**: CarrierPortalLogin.tsx, CarrierPortalDashboard.tsx, CarrierPortalDocument.tsx, CarrierPortalLayout.tsx, send-carrier-magic-link edge function
- **Modified files**: App.tsx (routes), RateConBuilder.tsx (save button), BolBuilder.tsx (save button), LoadDetail.tsx (send button)
- **DB migration**: carrier_documents table, carrier_portal_users table, RLS policies

