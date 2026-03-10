

## Change Sales Page Route to Root Path

Since the sales/landing page is the public-facing website, it makes sense to serve it at `/` (the root) — the natural "homepage" URL.

### Changes

**1. `src/App.tsx`** — Change the route from `/sales-page` to `/`; move the CRM app routes under a `/app/*` or `/crm/*` prefix, or keep them as-is with the sales page taking priority at `/`.

Actually, looking at the current routing: the `Index` page currently lives at `/` inside the AppLayout. The simplest approach:
- Move `SalesLanding` to `/` 
- Change `/sales-page` → `/`
- Keep the CRM routes as they are (they all have specific paths like `/dashboard`, `/loads`, etc.)
- Update the `Index` redirect or remove it

**2. `src/components/layout/AppSidebar.tsx`** — Update the logo link from `/sales-page` to `/`.

| File | Change |
|------|--------|
| `src/App.tsx` | Route `/sales-page` → `/`, adjust Index route |
| `src/components/layout/AppSidebar.tsx` | Logo link href `/sales-page` → `/` |

