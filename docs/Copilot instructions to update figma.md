## Copilot instructions to update frontend from `figma/`

This document records the issues we encountered when updating the frontend files from the `figma/` folder and the checks/fixes to apply automatically or manually in future updates.

Keep this file updated with any new problems found during future syncs.

---

## Goals when syncing
- Replace `frontend/src` and supporting top-level files (`index.html`, `package.json`, `vite.config.ts`) with the latest from `figma/src`.
- Ensure the dev server builds and the app talks to the backend proxy defined in `app.py` and `api.yaml`.
- Avoid regressions: date parsing/formatting, user-scoped data leakage, broken TypeScript imports, and malformed proxied queries.

## High-level checklist
- [ ] Run the sync script: `scripts/sync_figma_to_frontend.ps1` (PowerShell) or perform the equivalent copy.
- [ ] Install frontend deps: `cd frontend; npm install`.
- [ ] Start frontend: `cd frontend; npm run dev`.
- [ ] Start backend proxy: `python app.py` (if not running already).
- [ ] Open the dev URL Vite prints and test login, create, list and view flows for `citas`.

## Problems we encountered (and how they were fixed)

1) Accidental Markdown fences (build-breaking text in TypeScript/JS files)

   Symptom: Build fails with TypeScript/TSX errors; files start with triple backticks (```typescript) or end with closing fences.

   Cause: Documentation or README content copied into code files.

   Fix/check:
   - Remove leading/trailing code fences from code files (e.g. `frontend/src/utils/api.ts`).
   - Search the repo for ```` ``` ```` and make sure matches are only in docs/ or markdown files.
   - Command to find candidates:

     ```powershell
     Select-String -Path . -Pattern "^```" -List -SimpleMatch -Path **\*.ts,**\*.tsx,**\*.py | Select-Object Path,LineNumber
     ```

2) Missing TypeScript typings for React runtime (`react/jsx-runtime`)

   Symptom: TypeScript error: "Could not find a declaration file for module 'react/jsx-runtime'".

   Fix/check:
   - Install dev typings: `npm install --save-dev @types/react @types/react-dom` inside `frontend/`.
   - Ensure `tsconfig.json` uses `"jsx": "react-jsx"` when using new JSX transform (React 17/18) and `skipLibCheck: true` to reduce noise.
   - As last resort add `declare module 'react/jsx-runtime';` in a `.d.ts` under `frontend/src/types/`.

3) API base URL should be configurable via environment

   Symptom: Frontend hardcodes `http://localhost:5000` making it hard to change proxy or deploy.

   Fix/check:
   - Use Vite env var `VITE_API_BASE` with a fallback to `http://localhost:5000` in `frontend/src/utils/api.ts`.
   - Verify `frontend/vite.config.ts` or `.env` files set `VITE_API_BASE` as needed.

4) Dates returned from backend are in mixed formats (timestamps or ISO) -> calendar shows "Invalid date"

   Symptom: Calendar component displays "Invalid date" or wrong day.

   Cause: Backendless may return numeric timestamps (ms since epoch) or ISO strings. The calendar UI expected `YYYY-MM-DD`.

   Fix/check:
   - Add a small normalizer `normalizeFecha(value)` in `frontend/src/utils/api.ts` that accepts numbers or ISO strings and returns `YYYY-MM-DD` (we implemented this).
   - Apply normalization to responses from `citasApi.create`, `citasApi.get`, `citasApi.list`, `citasApi.update`.
   - Test by creating a cita and verifying the date shows correctly in the UI.

   Note: This normalizer uses UTC (`toISOString().slice(0,10)`) — if you want local-date semantics adjust logic accordingly.

5) Frontend was showing all users' citas (data leakage)

   Symptom: When a user logs in they see appointments created by other users.

   Cause: `citasApi.list()` requested `/data/Cita` without a `where` clause, returning all rows.

   Fix/check:
   - Default `citasApi.list()` to filter by the logged-in user's `objectId` (prefer `ownerId`):
     `where = "ownerId='CURRENT_USER_ID'"`.
   - If no user is logged in, return an empty list rather than request everything.
   - If backend uses another owner field (e.g., `owner`, `createdBy`), update the filter accordingly.

6) Backend rejects complex `where` clauses with `OR` or poorly encoded queries (400 errors)

   Symptom: GET /data/Cita?where=... returned 400 Bad Request when `where` contained spaces, quotes or `OR`.

   Cause: Building the Backendless URL by string concatenation introduced encoding issues; Backendless may not accept some complex `OR` expressions.

   Fix/check:
   - Proxy (Flask) must forward the `where` parameter using `requests.get(..., params={'where': where})` so it gets encoded safely. We updated `app.py` to use `params` for all Backendless queries.
   - Avoid sending `OR` in the client `where` clause where possible; prefer single-field lookups (`ownerId='...'`). If multiple conditions are required, implement server-side logic in the proxy to produce safe queries or perform multiple queries and merge results.
   - Reproduce failing request in curl and inspect the proxied URL returned to Backendless to confirm encoding.

7) Calendar & External connectors

   Symptom: Google/Outlook connectors not implemented but UI may reference them.

   Fix/check:
   - Provide placeholder connector at `frontend/src/utils/calendar.ts` that returns stub responses so UI wiring is possible without OAuth.
   - When implementing real connectors, implement secure OAuth flows, token persistence and offline sync.

8) Sync-tool/overwrites

   Symptom: Inconsistent package.json, vite config or node_modules after copying.

   Fix/check:
   - Use `scripts/sync_figma_to_frontend.ps1` to consistently copy `figma/src` -> `frontend/src` and top-level files. This script overwrites `frontend/src`.
   - After copying run `cd frontend; npm install` to reconcile dependencies.
   - If `package.json` changed, inspect `devDependencies` and `dependencies` for typing packages like `@types/react`, `typescript` etc.

## Debugging tips (quick commands)

- Show Vite URL and tail its terminal logs (in the terminal where `npm run dev` is running).
- Tail Flask logs while reproducing the failing request to see proxied URL and Backendless response.

  ```powershell
  # start backend (repo root)
  python .\app.py

  # in another terminal start frontend
  cd .\frontend
  npm run dev
  ```

- Test a proxied where clause with curl to see raw response and encoding:

  ```powershell
  curl.exe "http://127.0.0.1:5000/data/Cita?where=ownerId%3D'USER_ID'"
  ```

## Files changed during this migration (for quick reference)
- `frontend/src/utils/api.ts` — added `normalizeFecha`, made API base configurable, defaulted `citasApi.list` to filter by `ownerId`.
- `frontend/src/utils/calendar.ts` — placeholder connectors for Google/Outlook.
- `scripts/sync_figma_to_frontend.ps1` — sync script to overwrite frontend with figma sources.
- `app.py` — updated proxy to forward `where` as `params` (safe encoding).

## Future automation suggestions
- Add a unit test that runs after sync to assert the dev server starts and `GET /data/Cita?where=ownerId%3D'DUMMY'` returns (no 400) via the proxy.
- Add a small Node/PowerShell script that runs the sanity checks in this document automatically after sync (check for markdown fences in code, missing typings, existence of `normalizeFecha` in `api.ts`, and presence of `ownerId` filtering in `citasApi.list`).

---

Keep this document updated with any additional problems and solutions. When you open a new update task, start by running the checklist and then run the quick sanity commands above.
