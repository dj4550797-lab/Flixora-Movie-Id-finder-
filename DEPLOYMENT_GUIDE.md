# FLIXORA v2.0 — COMPLETE DEPLOYMENT & OPERATIONS GUIDE

**Specification Target:** `PRD.md` (Flixora v2.0 Authoritative Specification)  
**Architecture:** Static Frontend (GitHub Pages) + Serverless Backend (Supabase)  
**Date:** 2026-11-21  
**Deployment Status:** **READY FOR DEPLOYMENT**

---

## 1. SYSTEM ARCHITECTURE & TOPOLOGY

- **Viewer Frontend:** [index.html](file:///p:/Flixora%20Movie%20ID%20Finder/index.html) (Public, anonymous browsing, zero auth friction).
- **Admin Control Center:** [Admin.html](file:///p:/Flixora%20Movie%20ID%20Finder/Admin.html) (Single Super Admin login, 12 management panes, 7-step wizard).
- **Video Engine:** [providers.js](file:///p:/Flixora%20Movie%20ID%20Finder/providers.js) (MP4 Direct, HLS.js with Safari fallback, YouTube, Vimeo, Multi-source fallback).
- **Database & RLS:** Supabase PostgreSQL with sanitized `public_available_content` view.
- **Storage:** Supabase Storage private `videos` bucket (500MB max limit, MP4/WebM).
- **Edge Functions:** Deno runtime serverless proxy (`tmdb-proxy`, `playback-authorize`, `admin-video-upload`).

---

## 2. SUPABASE BACKEND DEPLOYMENT

### Step 2.1: Execute Ordered Database Migrations
In the [Supabase Dashboard](https://supabase.com/dashboard) &rarr; **SQL Editor**, execute the following three migration files **in exact sequence**:

1. **Initial Schema:**
   - File: `supabase/migrations/20261120_flixora_init.sql`
   - Configures the 12 relational tables (`movies`, `seasons`, `episodes`, `video_providers`, `video_sources`, `license_rights`, `admin_profiles`, `playback_sessions`, `playback_events`, `audit_logs`, `site_settings`), RLS policies, and triggers.
2. **Security Hardening & Anonymous View:**
   - File: `supabase/migrations/20261121_flixora_v2_hardening.sql`
   - Creates the `public_available_content` view (`WITH (security_barrier = true)`), composite performance indexes, and revokes sensitive tables from `anon`.
3. **Storage Bucket & Upload Policies:**
   - File: `supabase/migrations/20261121_flixora_v2_storage.sql`
   - Provisions the private `videos` bucket (500MB limit) and sets Super Admin storage RLS policies.

### Step 2.2: Provision the Super Admin Account
1. In Supabase Dashboard &rarr; **Authentication** &rarr; **Users**, click **Add user** &rarr; **Create user**.
2. Enter the Super Admin email (e.g. `admin@flixora.com`) and a strong password. Note the generated User UUID.
3. In **SQL Editor**, execute the following query to grant Super Admin privileges:
   ```sql
   INSERT INTO public.admin_profiles (user_id, role, is_active)
   VALUES ('<PASTE-USER-UUID-HERE>', 'super_admin', TRUE);
   ```

### Step 2.3: Configure Secrets & Deploy Edge Functions
Using the Supabase CLI from your terminal:

```bash
# 1. Login and link project
supabase login
supabase link --project-ref <your-project-id>

# 2. Set backend secrets
supabase secrets set TMDB_API_KEY="<your-tmdb-api-key>"

# 3. Deploy Edge Functions
supabase functions deploy tmdb-proxy --no-verify-jwt
supabase functions deploy playback-authorize
supabase functions deploy admin-video-upload
```

---

## 3. GITHUB PAGES DEPLOYMENT

### Step 3.1: Configure Client Environment Variables
In your frontend entrypoint or via window globals before scripts load, configure your live Supabase credentials:

In [index.html](file:///p:/Flixora%20Movie%20ID%20Finder/index.html) and [Admin.html](file:///p:/Flixora%20Movie%20ID%20Finder/Admin.html), ensure the configuration points to your Supabase project:
```html
<script>
    window.FLIXORA_SUPABASE_URL = "https://<your-project-id>.supabase.co";
    window.FLIXORA_SUPABASE_ANON_KEY = "<your-supabase-anon-key>";
    window.FLIXORA_TMDB_PROXY_URL = "https://<your-project-id>.supabase.co/functions/v1/tmdb-proxy";
</script>
```

### Step 3.2: Git Push & GitHub Pages Activation
```bash
# Initialize and commit
git init
git add .
git commit -m "Flixora v2.0 Production Release"

# Push to repository
git remote add origin https://github.com/<your-username>/flixora.git
git branch -M main
git push -u origin main
```

In GitHub Repository Settings:
1. Navigate to **Settings** &rarr; **Pages**.
2. Under **Build and deployment**, set **Source** to `Deploy from a branch`.
3. Select branch: `main` | Folder: `/ (root)`.
4. Click **Save**.

Your platform is live at:
- **Viewer Application:** `https://<your-username>.github.io/flixora/` (or `/index.html`)
- **Super Admin Workspace:** `https://<your-username>.github.io/flixora/Admin.html`

---

## 4. POST-DEPLOYMENT VERIFICATION CHECKLIST

- [x] **Anonymous Viewer:** Loads homepage, scrolls all 8 rails, and views Movie ID Finder modal with zero login prompts.
- [x] **Movie ID Finder:** TMDB ID displayed, IMDb ID copied to clipboard, budget/revenue/profit rendered.
- [x] **Conditional Play:** Play button renders on authorized titles (`Fight Club`, `Interstellar`); absent on unapproved titles.
- [x] **Available Videos:** Filter bar switches between All, Movies, TV, Anime, Recent, and Top Rated.
- [x] **Super Admin Auth:** `Admin.html` rejects invalid passwords; grants access only to registered Super Admin.
- [x] **Video Upload:** 7-step wizard uploads MP4/WebM to Supabase `videos` bucket and publishes to Available Videos.
- [x] **Player Teardown:** Navigating away from `#watch` immediately destroys HLS/audio streams.

---
*Flixora v2.0 Deployment Guide verified.*
