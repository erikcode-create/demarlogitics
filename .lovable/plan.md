

## Freight Brokerage Sales Page -- Implementation Plan

A new public-facing landing page at `/sales` (or `/`) that serves as a high-converting sales page for Demar Transportation. The page will be a single long-scroll page with all requested sections, and the lead capture form will integrate directly with the existing CRM by creating a Shipper record, triggering the 14-day cadence, and assigning sales stage = `prospect`.

### Architecture

- **New file: `src/pages/SalesLanding.tsx`** -- Single component containing all sections (Hero, Problem, Solution, Services, Why Demar, Process, Trust, Lead Capture Form, Footer CTA)
- **New route: `/sales-page`** added to `src/App.tsx` -- Rendered *outside* `AppLayout` (no sidebar/topbar) so it looks like a standalone marketing page
- **CRM Integration** -- The lead capture form uses `useAppContext()` to:
  - Check if a shipper with the same company name exists; if not, create one with `salesStage: 'prospect'`
  - Call `triggerCadence(shipperId)` to fire the 14-day automation
  - Log an activity noting the form submission
  - Show a toast confirmation

### Page Sections (top to bottom)

1. **Hero** -- Full-width gradient/dark background. Headline, subheadline, two CTA buttons (scroll-to-form anchors). Truck/freight imagery via CSS gradients.
2. **Problem** -- 4 bullet points with icons (Lucide icons: AlertTriangle, MapPin, MessageSquareOff, ShieldAlert)
3. **Solution** -- 4 capability cards in a grid
4. **Services** -- 6 service blocks (Dry Van, Reefer, Flatbed, Power-Only, Dedicated Lanes, Overflow) in a responsive grid with icons
5. **Why Demar** -- 5 differentiators with check icons
6. **Process** -- 4-step horizontal timeline (Request Quote → Capacity Secured → Live Tracking → On-Time Delivery)
7. **Trust** -- 3 trust badges/icons
8. **Lead Capture Form** -- React Hook Form with zod validation. Fields: Company Name, Contact Name, Email, Phone, Origin, Destination, Equipment Type (dropdown), Est. Weekly Volume, Message. On submit: creates shipper + triggers cadence
9. **Footer CTA** -- Dark section with headline and "Get a Rate Now" button

### Technical Details

- **Routing**: The sales page route renders without `AppLayout` wrapping. All other CRM routes keep their layout. This requires restructuring `App.tsx` slightly -- the `AppLayout` wrapper moves inside the CRM routes, and `/sales-page` sits outside it.
- **Form validation**: Uses zod schema for required fields (company, contact, email, phone, origin, destination, equipment type). Phone validated with regex. Email validated with `.email()`.
- **Responsive**: Tailwind responsive classes throughout. Mobile-first grid layouts (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
- **No new dependencies** -- uses existing Tailwind, Lucide icons, shadcn components (Button, Input, Select, Textarea, Card), react-hook-form + zod.

### Files Changed

| File | Change |
|------|--------|
| `src/pages/SalesLanding.tsx` | New -- full landing page component |
| `src/App.tsx` | Add `/sales-page` route outside AppLayout, restructure layout wrapping |

