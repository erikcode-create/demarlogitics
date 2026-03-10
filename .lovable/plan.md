

## Plan: Carrier Onboarding, Resend Email, and Document Gating

### What we're building

1. **Carrier onboarding document uploads** in the portal (W9, Workers Comp, Certificate of Insurance, MC Authority Letter, Notice of Assignment)
2. **Resend email integration** to send rate con notifications from `carriers@demartransportation.com`
3. **Onboarding gate** — carriers cannot view or sign rate cons until all 5 documents are uploaded
4. Digital signature is already implemented

---

### Database Changes

**New table: `carrier_onboarding_documents`**
- `id` (uuid, PK)
- `carrier_id` (uuid, NOT NULL)
- `document_type` (text — `w9`, `workers_comp`, `certificate_of_insurance`, `mc_authority_letter`, `notice_of_assignment`)
- `file_path` (text — storage path)
- `file_name` (text — original file name)
- `uploaded_at` (timestamptz, default now())
- Unique constraint on `(carrier_id, document_type)`
- RLS: carrier portal users can read/insert their own; internal team has full access

**New storage bucket: `carrier-onboarding-docs`** (private)
- RLS: carriers can upload to their own folder; internal team can read all

---

### Edge Function: `send-ratecon-email`

Uses Resend API with the `RESEND_API_KEY` secret to send a branded email from `carriers@demartransportation.com` containing the magic link. Replaces the current `send-carrier-magic-link` function's delivery mechanism (which generates a link but doesn't actually email it via a custom sender).

Flow: RateConBuilder "Save & Send" → inserts `carrier_documents` row → calls `send-ratecon-email` edge function → function generates magic link via admin API + sends email via Resend.

---

### Carrier Portal Changes

**New: Onboarding page (`CarrierPortalDashboard` restructure)**
- When carrier logs in, check if all 5 documents are uploaded
- If incomplete: show onboarding checklist with upload buttons for each doc type
- Progress bar showing X/5 complete
- Each upload goes to `carrier-onboarding-docs/{carrier_id}/{doc_type}`
- If complete: show existing documents/rate cons view

**Gating on `CarrierPortalDocument`**
- Before rendering rate con details + signature form, check onboarding status
- If incomplete: show message "Complete your onboarding documents before viewing rate confirmations" with link back to dashboard

---

### Files to create/modify

| File | Action |
|------|--------|
| `supabase/functions/send-ratecon-email/index.ts` | **Create** — Resend email + magic link generation |
| `src/pages/CarrierPortalDashboard.tsx` | **Modify** — Add onboarding checklist with file uploads |
| `src/pages/CarrierPortalDocument.tsx` | **Modify** — Add onboarding gate check |
| `src/components/documents/RateConBuilder.tsx` | **Modify** — Call `send-ratecon-email` instead of `send-carrier-magic-link` |
| `src/pages/CarrierPortalPreview.tsx` | **Modify** — Show onboarding status in preview |
| DB migration | **Create** — `carrier_onboarding_documents` table + storage bucket + RLS |

---

### Secret needed

- `RESEND_API_KEY` — will prompt you to enter your Resend API key before proceeding with implementation

