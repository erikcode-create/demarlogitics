

## Add Delete Functionality for Shippers and Carriers

### What Changes

**1. Shippers list page (`src/pages/Shippers.tsx`)**
- Add a Trash icon button in each table row
- Wrap in an AlertDialog for confirmation ("This will permanently delete this shipper and all related data")
- On confirm, call `setShippers(prev => prev.filter(s => s.id !== id))` — the existing `syncToSupabase` handles the database delete
- Also clean up related data: contacts, lanes, follow-ups, activities, outbound calls, sales tasks, stage change logs for that shipper

**2. Carriers list page (`src/pages/Carriers.tsx`)**
- Same pattern: Trash icon button per row with AlertDialog confirmation
- On confirm, call `setCarriers(prev => prev.filter(c => c.id !== id))` 
- Clean up related activities for that carrier

**3. Detail pages (`src/pages/ShipperDetail.tsx`, `src/pages/CarrierDetail.tsx`)**
- Add a Delete button (red, destructive variant) in the header area
- Same AlertDialog confirmation pattern
- On delete, navigate back to the list page

### Technical Notes
- No database migration needed — the existing `syncToSupabase` diff function already handles deletions
- Uses the existing `AlertDialog` component from shadcn/ui
- Related data cleanup uses the existing synced setters from `AppContext` which will cascade the deletes to the database
- Note: The database doesn't have foreign key cascades between these tables, so we clean up related records manually in the frontend

