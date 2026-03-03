

## Import Shipper Prospect Data

### What
Add the 82 companies from the provided CSV as new shipper records in the mock data, and add corresponding lanes based on their freight/equipment info.

### Data Mapping
The CSV fields map to the `Shipper` type as follows:
- `Company` → `companyName`
- `City` → `city`
- `State` → `state`
- `Industry`, `Primary_Freight_Type`, `Region` → combined into `notes` (e.g., "Region: Reno | Industry: Automotive Manufacturing | Freight: Components & Batteries")
- `salesStage` → `'lead'` for all (these are prospects to pursue)
- `address`, `zip`, `phone`, `email` → empty/placeholder defaults
- `creditLimit` → `0`, `paymentTerms` → `'TBD'`
- `Equipment_Type` → mapped to the closest `EquipmentType` enum value and stored in a lane record per shipper

### Changes

**`src/data/mockData.ts`**
- Append 82 new `Shipper` entries (IDs `s100`–`s181`) to `mockShippers`
- Append one `Lane` per shipper to `mockLanes` with origin set to `"{City}, {State}"`, empty destination, rate `0`, and the mapped equipment type. For entries with dual equipment (e.g., "Dry Van / Reefer"), create two lanes.

### Equipment Mapping
| CSV Value | Mapped `EquipmentType` |
|---|---|
| Dry Van | `dry_van` |
| Reefer | `reefer` |
| Flatbed | `flatbed` |
| Power Only | `power_only` |
| Dry Van / Power Only | two lanes: `dry_van` + `power_only` |
| Dry Van / Reefer | two lanes: `dry_van` + `reefer` |

### No Type Changes
All data fits into the existing `Shipper` and `Lane` types — no schema modifications needed. Industry/region metadata is preserved in the `notes` field for searchability.

