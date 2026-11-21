# Flixora v2.0 — Production Deployment Guide

## 1. Prerequisites Checklist

- GitHub repository with GitHub Pages enabled.
- Supabase Cloud account and project.
- Node.js 18+ for local testing and script execution.
- Supabase CLI (optional, for automated Edge Function deployment).

---

## 2. Step-by-Step Deployment

### Step 1: Database Migration
1. Open **Supabase Dashboard** -> **SQL Editor**.
2. Paste and run the idempotent migration file:
   `supabase/migrations/20261121_flixora_complete_one_click.sql`
3. Verify output says: `Flixora v2.0 Master Schema successfully deployed!`.

### Step 2: Supabase Storage Configuration
1. Open **Storage** in Supabase.
2. Confirm the `videos` bucket exists with `Public: false` and `File size limit: 500 MB`.

### Step 3: Frontend Client Configuration
Ensure `js/supabase-client.js` contains your Supabase project parameters:
```javascript
const SUPABASE_CONFIG = {
    URL: 'https://comxecntwlntgvjbvkjs.supabase.co',
    ANON_KEY: 'sb_publishable__5xCvJeJren5zsyR33SkJQ_fYwAZIbX'
};
```

### Step 4: GitHub Pages Deployment
1. Commit all files to the `main` branch.
2. Under **Repository Settings** -> **Pages**, set **Source** to `Deploy from a branch` and branch to `main / (root)`.
3. GitHub Pages will build and deploy the application within 60 seconds.
