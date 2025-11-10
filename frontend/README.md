# Frontend (React) — MNA

This folder contains a trimmed React + Vite frontend that implements the core flows and maps to the API contract in `api.yaml`.

How to run (PowerShell):

1. Install dependencies:

```powershell
cd C:\MNA-Software\frontend
npm install
```

2. Run the dev server:

```powershell
npm run dev
# Opens http://localhost:3000 by default
```

Configuration:
- The app calls `http://localhost:5000` by default (the Flask proxy in `app.py`). You can change the base by setting localStorage key `apiBase` in the browser or editing `src/utils/api.ts`.
- The login returns a `user-token` header which the client stores in localStorage as `user-token` for authenticated requests.

Next steps I can take:
- Add full component set from the Figma export (we kept a small set for quicker run ability).
- Add TypeScript types and unit tests.
- Wire up more pages/components from the Figma source if you want a 1:1 copy.
# Frontend demo for MNA-Software

This is a small static frontend to exercise the backend services declared in `api.yaml` and the local `app.py` Flask server.

Files added:
- `frontend/index.html` — main single-page demo
- `frontend/js/apiClient.js` — small client that maps to the `api.yaml` endpoints (configurable base URL)
- `frontend/js/app.js` — wiring for forms and display
- `frontend/css/styles.css` — lightweight styles

How to use
1. Serve the frontend files. Easiest option while developing:

   - Open `frontend/index.html` directly in a browser (CORS may block some requests to a different origin).
   - Recommended: serve with a simple static server, e.g. from the repo folder using Python 3:

     ```powershell
     cd C:\MNA-Software\frontend
     python -m http.server 8000
     # then open http://localhost:8000 in your browser
     ```

2. Configure the API base and token in the top header fields of the page.
   - `API Base` is used by the client to call the endpoints defined in `api.yaml` (e.g. `/users/register`, `/data/Cita`, etc.).
   - If you want to exercise the local Flask server (`app.py`) instead, point `API Base` to `http://localhost:5000` (default when running Flask locally).
   - `User Token` will be sent as the `user-token` header for endpoints that require authentication.

Backendless credentials for testing
- The repository's `app.py` currently contains Backendless credentials hard-coded. For secure testing, prefer to set them via environment variables or a local non-committed config.

Options to provide credentials so I (or CI) can test end-to-end:
1. Update `app.py` to read from environment variables (recommended):

   - Set `BACKENDLESS_APP_ID` and `BACKENDLESS_REST_API_KEY` in your shell before running Flask.

     In PowerShell:
     ```powershell
     $env:BACKENDLESS_APP_ID = 'your-app-id'
     $env:BACKENDLESS_REST_API_KEY = 'your-rest-api-key'
     python app.py
     ```

   - Or create a local `.env` (do NOT commit it), and modify `app.py` to load it with python-dotenv.

2. If you prefer to share credentials with me for testing, please paste them in a short message in this chat using the following format (do NOT upload files):

   - application-id: <YOUR_APP_ID>
   - rest-api-key: <YOUR_REST_API_KEY>

   I'll only use them to verify end-to-end connectivity and won't store them in version control. If you'd rather not share secrets in chat, run the tests locally and paste any failing responses.

Notes / Next steps
- This is a minimal shell to exercise the OpenAPI-defined endpoints. Next improvements I can make on request:
  - Add mapping to the Flask `app.py` endpoints (`/usuarios`) so both the OpenAPI paths and the Flask helper endpoints are supported.
  - Add simple automated tests (smoke tests) to validate the endpoints.
  - Implement better error handling and UX.
