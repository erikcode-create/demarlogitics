# Live Dispatch E2E

This repo now expects active development to happen from `~/Code/demar/admin`, not from `OneDrive`.

## Local Commands

```bash
cd ~/Code/demar
./scripts/bootstrap.sh
./scripts/dev-admin.sh
./scripts/dev-mobile.sh
```

## Repeatable Live Data

- Repeatable live driver phone: `9283002384`
- Last proven dispatch example on April 18, 2026: load `703273`
- Last proven mobile detail example: `Dispatched`, `Portland, OR` to `Boise, ID`

## Live Flow

1. Open the admin at `http://127.0.0.1:4176`.
2. Use a real broker/admin login.
3. Open a real load detail page.
4. Use the dispatch action to assign the load to `9283002384`.
5. Verify the backend row before trusting either mobile UI:

```bash
cd ~/Code/demar/admin
npm run e2e:check-driver-load -- 9283002384
```

6. Relaunch the iOS dev client in Simulator and confirm the current shipment card shows the dispatched load.
7. Run the Android native dev build from `~/Code/demar/mobile/scripts/run-android-dev.sh` and confirm the same load appears.
8. Open the load detail screen on both platforms and confirm the status and route match the backend record.

## Verification Checklist

- Backend row includes `driver_phone=9283002384`
- Backend row is in an active dispatch status
- iOS dashboard does not show `No current shipment found`
- Android dashboard does not show `No current shipment found`
- Both mobile detail screens match the expected status and lane

## Known Fix Behind This Flow

The original bug was the admin view writing stale local load state back over the newly assigned driver after dispatch. The fix lives in:

- `/Users/erik/Code/demar/admin/src/components/documents/DispatchButton.tsx`
- `/Users/erik/Code/demar/admin/src/components/documents/dispatchLoadState.ts`
- `/Users/erik/Code/demar/admin/src/pages/LoadDetail.tsx`

## Cleanup

- If the load was only used for verification, restore or intentionally close it out after the run.
- If ops changes the repeatable live test phone, update this file, `/Users/erik/Code/demar/TESTING_MEMORY.md`, and `/Users/erik/Code/demar/AGENTS.md` together.

## Working Rules

- Keep active repos in `~/Code/demar`.
- Keep `OneDrive` for docs, screenshots, exports, and backups.
- Use real data carefully and restore or close out test loads after the run.
- Use `9283002384` as the repeatable live driver phone for this flow unless ops changes it.
