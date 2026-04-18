# Live Dispatch E2E

This repo now expects active development to happen from `~/Code/demar/admin`, not from `OneDrive`.

## Local Commands

```bash
cd ~/Code/demar
./scripts/bootstrap.sh
./scripts/dev-admin.sh
./scripts/dev-mobile.sh
```

## Live Flow

1. Open the admin at `http://127.0.0.1:4176`.
2. Use a real broker/admin login.
3. Assign the active test load to `9283002384`.
4. Verify the backend row:

```bash
cd ~/Code/demar/admin
npm run e2e:check-driver-load -- 9283002384
```

5. Relaunch the iOS dev client in Simulator and confirm the load appears.

## Working Rules

- Keep active repos in `~/Code/demar`.
- Keep `OneDrive` for docs, screenshots, exports, and backups.
- Use real data carefully and restore or close out test loads after the run.
- Use `9283002384` as the repeatable live driver phone for this flow unless ops changes it.
