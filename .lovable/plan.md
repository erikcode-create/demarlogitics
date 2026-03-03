

## Sales Landing Page Enhancements -- Implementation Plan

Six new features added to `src/pages/SalesLanding.tsx`, with one new utility file for the rate calculator and mock lane data for the heatmap.

---

### 1. Downloadable Capability Statement PDF

A "Download Capability Statement" button in the Hero section. Since we cannot generate real PDFs client-side without a heavy library, this will create a styled HTML document opened in a new tab with `window.print()` triggered, allowing the user to save as PDF. The content will mirror the key sections: services, coverage area, compliance info, and contact details. Alternatively, a simpler approach: generate a Blob with the capability statement content and trigger a download. Will use a dedicated function `downloadCapabilityStatement()` that builds a formatted HTML string and opens it for print-to-PDF.

### 2. Lane Heatmap Visual

A new section between Solution and Services showing a stylized visual grid/table of West Coast lanes with color-coded intensity. Since we cannot use actual map tiles without an API key, this will be a **lane matrix** -- a grid showing origin cities (rows) vs destination cities (columns) with colored cells indicating volume/demand level (hot/warm/cool). Data sourced from `mockData.ts` lanes plus hardcoded West Coast lane data. Uses Tailwind background colors (red/orange/yellow/green shades) for heat intensity.

### 3. Case Study Section

A new section after "Why Demar" with 2-3 hardcoded case studies. Each card shows: industry, challenge, solution, and result with metrics (e.g., "Reduced transit time by 18%", "99.2% on-time delivery"). Uses the existing Card component.

### 4. Rate Calculator Tool

An interactive section with dropdowns for origin region, destination region, equipment type, and a mileage/weight input. Calculates an estimated rate range using a simple formula (base rate + per-mile rate by equipment type). Shows "Estimated Rate: $X,XXX - $X,XXX" with a CTA to get an exact quote. All client-side with hardcoded rate tables.

### 5. Instant Chat Widget

A floating chat bubble (bottom-right corner, fixed position) that expands into a small chat panel. Since there's no backend, this will be a **pre-chat form** that collects name, company, and question, then submits it as an Activity in the CRM context and shows a confirmation message ("A specialist will respond within 15 minutes"). Includes a few canned quick-reply buttons ("Get a rate quote", "Check capacity", "Speak to someone").

### 6. Retargeting Pixel Placement

Add a dedicated section in the component that renders `<script>` tags for common retargeting pixels (Google Ads, Meta/Facebook) using placeholder IDs. Wrapped in a `useEffect` that fires on mount. The pixel IDs will be clearly marked as placeholders (`YOUR_PIXEL_ID_HERE`) with comments explaining where to add real IDs.

---

### Files Changed

| File | Change |
|------|--------|
| `src/pages/SalesLanding.tsx` | Add all 6 features: capability statement download button, lane heatmap section, case studies section, rate calculator section, chat widget, retargeting pixel useEffect |

### Section Order (updated)

Hero → Problem → Solution → **Lane Heatmap** → Services → Why Demar → **Case Studies** → Process → **Rate Calculator** → Trust → Lead Form → Footer CTA → **Chat Widget (floating)** → **Retargeting Pixels (invisible)**

