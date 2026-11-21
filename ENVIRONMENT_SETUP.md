# FLIXORA v2.0 — ENVIRONMENT SETUP & LOCAL TESTING GUIDE

**Document Target:** Developers, QA Engineers & System Administrators  
**Date:** 2026-11-21  

---

## 1. PREREQUISITES & TOOLING

To run, test, and develop Flixora locally:
- **Web Browser:** Modern evergreen browser (Chrome, Edge, Firefox, Safari).
- **Node.js:** v18.0.0 or higher (Installed: v26.13.1).
- **Supabase CLI (Optional for local emulation):** `npm install -g supabase`.
- **Static HTTP Server (Optional):** Any local server (e.g. `npx serve`, Python `http.server`, or VS Code Live Server).

---

## 2. RUNNING LOCALLY WITHOUT CLOUD CONFIGURATION (DEMO / MOCK MODE)

Flixora v2.0 includes a zero-dependency local mode that runs directly from local disk:

1. **Viewer Experience:**
   - Double-click or open [index.html](file:///p:/Flixora%20Movie%20ID%20Finder/index.html) in your browser.
   - The 6-second cinematic splash screen will run (or click **Skip Intro**).
   - Discovery rails and Available Videos (`Fight Club`, `Interstellar`) load from the local cache.
   - Click any card to inspect the preserved Movie ID Finder details modal, copy IMDb IDs, or play authorized streams.

2. **Super Admin Workspace (Local Dev Mock):**
   - Open [Admin.html](file:///p:/Flixora%20Movie%20ID%20Finder/Admin.html) in your browser.
   - Open Browser Developer Tools Console (`F12`), and enable the local mock flag:
     ```javascript
     window.FLIXORA_DEV_MOCK_AUTH = true;
     ```
   - Enter local developer credentials:
     - **Email:** `admin@flixora.com`
     - **Password:** `FlixoraDevAdmin2026!`
   - Click **Sign In**. The 12-section dashboard and 7-step wizard will load immediately.

---

## 3. CONNECTING TO A LIVE SUPABASE PROJECT

When you are ready to connect to a real Supabase backend:

1. Create a project at [supabase.com](https://supabase.com).
2. Copy your Project URL and Public Anon Key from **Settings** &rarr; **API**.
3. Set the global configuration in `js/supabase-client.js` or via script tag in `index.html` / `Admin.html`:
   ```javascript
   window.FLIXORA_SUPABASE_URL = "https://<your-project-id>.supabase.co";
   window.FLIXORA_SUPABASE_ANON_KEY = "<your-anon-key>";
   window.FLIXORA_TMDB_PROXY_URL = "https://<your-project-id>.supabase.co/functions/v1/tmdb-proxy";
   ```
4. Run the three database migrations in order:
   - `supabase/migrations/20261120_flixora_init.sql`
   - `supabase/migrations/20261121_flixora_v2_hardening.sql`
   - `supabase/migrations/20261121_flixora_v2_storage.sql`
5. Create your Super Admin user in **Authentication** &rarr; **Users** and insert into `admin_profiles`:
   ```sql
   INSERT INTO public.admin_profiles (user_id, role, is_active)
   VALUES ('<USER-UUID>', 'super_admin', true);
   ```

---

## 4. ENVIRONMENT VARIABLES REFERENCE (`.env.example`)

```ini
# Supabase Project Credentials
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-service-role-key"

# TMDB API Credentials (Backend Edge Function Secret Only)
TMDB_API_KEY="your-tmdb-api-key-here"

# Super Admin Initial Account
SUPER_ADMIN_EMAIL="admin@flixora.com"
```

---

## 5. RUNNING THE AUTOMATED TEST SUITE

Execute the full 27-point test harness directly from the terminal:

```bash
node tests/e2e_full_suite.test.js
```

All 27 assertions will run and report status, logging results to `tests/e2e_full_results.json`.

---
*Flixora v2.0 Environment Setup verified.*
