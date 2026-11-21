# Flixora — Supabase Setup Guide

> Complete step-by-step instructions for setting up the Flixora Movie ID Finder backend.

---

## Prerequisites

Before you begin, make sure you have the following:

| Requirement | Minimum Version | Check Command |
|---|---|---|
| Node.js | 16.x or higher | `node --version` |
| A modern web browser | Chrome, Firefox, Edge | — |
| A free Supabase account | — | https://app.supabase.com |
| Supabase CLI *(optional)* | Latest | `supabase --version` |

> **Note:** The Supabase CLI is optional. You can deploy the database manually via the Supabase SQL Editor if you prefer.

---

## Step 1 — Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com) and sign in (or create a free account).
2. Click **"New project"**.
3. Fill in the project details:
   - **Project name:** `flixora` (or any name you like)
   - **Database password:** choose a strong password and **save it** — you'll need it later
   - **Region:** choose the region closest to your users
4. Click **"Create new project"** and wait ~2 minutes for provisioning.

> **Screenshot guidance:**  
> Dashboard → `New project` button (top right) → Fill form → `Create new project`

### Collecting Your API Keys

Once the project is ready:

1. In the left sidebar, click **"Project Settings"** (gear icon).
2. Click **"API"** in the sub-menu.
3. Copy these two values — you'll need them in Step 3:
   - **Project URL** — looks like `https://xyzxyz.supabase.co`
   - **anon / public** key — starts with `sb_publishable_` or `eyJ...`

> **Important:** Never commit your `service_role` key to version control. Only use the `anon` key in browser-side code.

---

## Step 2 — Run the Master Migration SQL

The master migration file creates all 12+ tables, RLS policies, functions, and seed data in a single query.

### Option A — Using the Supabase SQL Editor (Recommended)

1. Open your project in the Supabase dashboard.
2. Click **"SQL Editor"** in the left sidebar.
3. Click **"+ New Query"**.
4. Open the migration file on your computer:
   ```
   supabase/migrations/20261121_flixora_complete_one_click.sql
   ```
5. Copy the entire file contents and paste them into the SQL Editor.
6. Click **"Run"** (or press `Ctrl+Enter`).
7. Wait for completion — you should see **"Success. No rows returned."**

> **Tip:** You can run the batch script and choose **Option 3 (Deploy Database)** — it will copy the SQL to your clipboard automatically.

### Option B — Using the Supabase CLI

```powershell
# From the project root
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

Replace `<your-project-ref>` with the reference ID shown in your project URL (e.g., `comxecntwlntgvjbvkjs`).

---

## Step 3 — Configure the Environment

### Using the Setup Script (Easiest)

1. Double-click **`SETUP_FLIXORA.bat`** in the project root.
2. Choose **Option 2 — Configure Supabase**.
3. Enter your **Project URL** and **anon key** when prompted.
4. The script will update `js/supabase-client.js` and create a `.env` file automatically.

### Manual Configuration

If you prefer to configure manually, edit `js/supabase-client.js`:

```javascript
const SUPABASE_URL = 'https://your-project-ref.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_your_anon_key_here';
```

---

## Step 4 — Deploy Edge Functions (Optional)

Flixora uses Supabase Edge Functions for certain server-side operations (e.g., secure API calls, webhook handlers).

> Edge Functions require the Supabase CLI.

```powershell
# Log in and link your project
supabase login
supabase link --project-ref <your-project-ref>

# Deploy all Edge Functions
supabase functions deploy

# Or deploy a specific function
supabase functions deploy movie-search
supabase functions deploy update-ratings
```

After deployment, verify functions are live at:  
`https://app.supabase.com > Edge Functions` (left sidebar)

---

## Admin Account Creation

> **Important:** Admin accounts must be created through the Supabase Auth dashboard — you cannot self-register as an admin from the website.

1. Go to your Supabase project → **"Authentication"** → **"Users"**.
2. Click **"Invite user"** and enter the admin's email address.
3. The user will receive an invitation email — they must accept it to activate their account.
4. Once the account is active, go to **"Table Editor"** → `profiles` table.
5. Find the admin's row (match by email or UUID).
6. Set the `role` column to `admin`.
7. Click **"Save"**.

The admin can now log in and access the admin panel at `/admin.html`.

---

## Troubleshooting

See [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) for a full list of common issues and solutions.

| Symptom | First thing to check |
|---|---|
| Videos not showing | RLS policies — see TROUBLESHOOTING.md |
| Admin login fails | Did you set `role = 'admin'` in the profiles table? |
| Trailers not playing | YouTube embed CSP settings |
| Upload fails | Storage bucket configuration |
| CORS errors | Supabase URL in `js/supabase-client.js` |

---

*Last updated: 2026-11-21*
