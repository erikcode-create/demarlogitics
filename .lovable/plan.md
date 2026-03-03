

## Demar Branding Overhaul -- Implementation Plan

Rebrand the entire app and sales page to match the Demar Transportation brand identity from the uploaded logo and business cards: **gold/yellow primary color, dark backgrounds, black accents**.

### Brand Colors (extracted from images)

| Role | Current (teal) | New (Demar gold) | HSL |
|------|---------------|-------------------|-----|
| Primary | `174 60% 45%` (teal) | `~45 90% 51%` (gold #EAB308) | Gold yellow |
| Primary foreground | dark navy | `0 0% 0%` (black) | Black text on gold |
| Sidebar primary | teal | gold | Match primary |
| Ring | teal | gold | Match primary |
| Chart-1 | teal | gold | Match primary |

### Changes

**1. `src/index.css`** -- Update all CSS custom properties:
- `--primary` → gold/yellow (`45 93% 47%`)
- `--primary-foreground` → black (`0 0% 0%`)
- All sidebar-primary, ring, chart-1 variables → gold
- `--warning` stays as-is (already similar) or shifts slightly to avoid conflict

**2. Logo asset** -- Copy `user-uploads://Untitled_design.png` (the clean logo on white/transparent bg) to `src/assets/demar-logo.png`. This gets used in the navbar and sidebar.

**3. `src/pages/SalesLanding.tsx`**:
- Import the logo image and display it in the top nav instead of text "DEMAR TRANSPORTATION"
- Update the capability statement HTML to use gold branding colors instead of blue (`#2563eb` → `#D97706`/gold)

**4. `src/components/layout/AppSidebar.tsx`**:
- Import and display the logo image in the sidebar header (sized down for sidebar)

**5. `public/favicon.ico`** -- Optionally update, but the logo is PNG not ICO. We can add a `<link rel="icon">` pointing to the logo in `index.html`.

### Files Changed

| File | Change |
|------|--------|
| `src/assets/demar-logo.png` | New -- copied from uploaded logo |
| `src/index.css` | Update primary color from teal to gold across all variables |
| `src/pages/SalesLanding.tsx` | Add logo image in nav; update capability statement colors |
| `src/components/layout/AppSidebar.tsx` | Add logo image in sidebar header |

