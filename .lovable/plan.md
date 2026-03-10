

## Rate Confirmation & Bill of Lading Builder for Loads

### What We're Building
Two document builders accessible from the Load Detail page — a **Rate Confirmation** (carrier-facing) and a **Bill of Lading** (shipping document). Each generates a professional, printable document pre-filled with load data and can be exported as PDF via browser print.

### Changes

**1. New component: `src/components/documents/RateConBuilder.tsx`**
- Dialog triggered by a "Generate Rate Con" button on Load Detail
- Pre-fills: load number, ref number, broker info (DeMar Transportation), shipper name/address, carrier name/MC#/DOT#, origin, destination, pickup/delivery dates, equipment type, weight, carrier rate, payment terms, special instructions
- Editable fields so user can tweak before exporting
- "Export PDF" button opens print window with styled HTML

**2. New component: `src/components/documents/BolBuilder.tsx`**
- Dialog triggered by a "Generate BOL" button on Load Detail
- Pre-fills: shipper name/address, consignee (destination), carrier name, load number, ref number, pickup date, equipment type, weight
- Includes standard BOL fields: commodity description, NMFC#, class, packaging type, quantity, hazmat checkbox, special instructions
- User can add multiple line items for commodities
- "Export PDF" button with standard BOL layout

**3. Update `src/pages/LoadDetail.tsx`**
- Add a new "Documents" card section with two buttons: "Generate Rate Con" and "Generate BOL"
- Import and render both builder dialogs
- Pass load, shipper, and carrier data as props

### Technical Notes
- No database changes needed — documents are generated on-the-fly and exported via browser print (same pattern as existing ContractDetail PDF export)
- Rate Con reuses logic from `contractTemplates.ts` `generateRateConfirmation()` but in a structured HTML layout instead of plain text
- BOL follows standard VICS BOL format fields
- Both components use existing Dialog, Input, Label, Button components

