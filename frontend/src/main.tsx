
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";

  // DEV: When running the Vite dev server, clear persisted auth/session
  // data so the app always starts in a clean state. This helps when
  // you want to log in with a fresh user after `npm run dev`.
  // Controlled by Vite's `import.meta.env.DEV` flag. To opt out, set
  // `VITE_CLEAR_ON_DEV_START=false` in your `.env` used by the frontend.
  try {
    if (import.meta.env.DEV) {
      const optOut = (import.meta.env.VITE_CLEAR_ON_DEV_START || 'true') === 'false';
      if (!optOut && typeof window !== 'undefined') {
        localStorage.removeItem('user-token');
        localStorage.removeItem('user-data');
        localStorage.removeItem('mna_session_id');
        // Also optionally clear any other dev-only keys
        console.debug('[dev] Cleared auth/session keys from localStorage');
      }
    }
  } catch (e) {
    // Ensure dev startup never throws due to localStorage access
    // (some CI environments or SSR-like runs may not have window).
    // Swallow errors intentionally.
  }

  createRoot(document.getElementById("root")!).render(<App />);
  