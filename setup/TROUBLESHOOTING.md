# Flixora — Troubleshooting Guide

> Solutions to the most common issues when setting up and running Flixora.

---

## Quick Error Code Lookup

| Code | Meaning | Go to Section |
|---|---|---|
| `PGRST116` | Row not found (RLS blocked) | [No Videos Showing](#no-videos-showing) |
| `PGRST301` | JWT expired | [Admin Login Fails](#admin-login-fails) |
| `401` | Anon key invalid or missing | [CORS / Config Errors](#cors-errors) |
| `403` | Permission denied (RLS) | [No Videos Showing](#no-videos-showing) |
| `422` | Validation error | Check request body format |
| `500` | Internal server error | Check Edge Function logs |
| `net::ERR_BLOCKED_BY_CSP` | CSP blocked embed | [Trailer Not Playing](#trailer-not-playing) |
| `StorageApiError` | Storage permission denied | [Upload Fails](#upload-fails) |

---

## No Videos Showing

**Symptom:** The video grid is empty even though you added content via the admin panel.

### RLS Policy Checklist

Row-Level Security (RLS) is enabled on all Flixora tables. If policies are missing or misconfigured, anonymous users won't see any data.

1. **Verify RLS is enabled:**
   - Go to Supabase dashboard → **Table Editor** → select the `videos` table.
   - Click **"RLS"** tab — confirm "Row Level Security is enabled".

2. **Check the SELECT policy exists:**
   - The migration should have created a policy named `allow_public_read` on the `videos` table.
   - If missing, run this in the SQL Editor:
     ```sql
     CREATE POLICY "allow_public_read" ON videos
       FOR SELECT USING (is_published = true);
     ```

3. **Check the `public_available_content` view:**
   - Run in SQL Editor:
     ```sql
     SELECT * FROM public_available_content LIMIT 5;
     ```
   - If this returns rows but the UI doesn't show them, check `js/supabase-client.js` for typos.

4. **Re-run the full migration** if policies are missing entirely:
   - SQL Editor → paste `supabase/migrations/20261121_flixora_complete_one_click.sql` → Run.

---

## Admin Login Fails

**Symptom:** Logging in with admin credentials returns "Invalid login credentials" or logs in but shows no admin controls.

### Supabase Auth Setup

1. **Check the user exists:**
   - Supabase dashboard → **Authentication** → **Users**.
   - Confirm the admin email is listed and the status is **"Confirmed"** (not "Invited").
   - If still "Invited", the user must click the email link.

2. **Verify the `role` column:**
   - **Table Editor** → `profiles` table → find the admin's row.
   - The `role` column must be exactly `admin` (lowercase, no spaces).

3. **JWT expiry issues (PGRST301):**
   - This means the user's session token expired.
   - Solution: log out and log back in.
   - If it happens constantly, check that your system clock is accurate (JWT validation is time-sensitive).

4. **Email confirmation not set up:**
   - Supabase dashboard → **Authentication** → **Settings** → **Email**.
   - If "Enable email confirmations" is ON, users must verify their email before logging in.
   - For testing, you can disable this or manually confirm in the Users list.

---

## Trailer Not Playing

**Symptom:** The YouTube trailer embed shows a blank box, error, or is blocked by the browser.

### YouTube Embed CSP

1. **Check the browser console** (`F12` → Console) for messages like:
   ```
   Refused to frame 'https://www.youtube.com/' because it violates the following Content Security Policy...
   ```

2. **Fix: update Content-Security-Policy header** (if served via a web server):
   Add `frame-src https://www.youtube.com https://www.youtube-nocookie.com;` to your CSP header.

3. **For local file:// access:**
   YouTube embeds require a web server. Serve the project locally:
   ```powershell
   # Quick local server (requires Node.js)
   npx serve .
   # Then open http://localhost:3000
   ```

4. **Use youtube-nocookie.com:**
   If your embed URL uses `https://www.youtube.com/embed/...`, try changing it to `https://www.youtube-nocookie.com/embed/...` for fewer tracking restrictions.

---

## Upload Fails

**Symptom:** Uploading a poster image, video file, or thumbnail returns an error.

### Storage Bucket Configuration

1. **Check the bucket exists:**
   - Supabase dashboard → **Storage** (left sidebar).
   - You should see buckets named `posters`, `thumbnails`, and/or `videos`.
   - If missing, run in SQL Editor:
     ```sql
     INSERT INTO storage.buckets (id, name, public)
     VALUES ('posters', 'posters', true),
            ('thumbnails', 'thumbnails', true),
            ('videos', 'videos', false);
     ```

2. **Check bucket policies:**
   - Each bucket needs an INSERT policy for authenticated users.
   - In the Storage section, click a bucket → **Policies** tab.
   - There should be a policy allowing `INSERT` for `authenticated` role.
   - If missing, add one:
     ```sql
     CREATE POLICY "allow_auth_upload" ON storage.objects
       FOR INSERT TO authenticated
       WITH CHECK (bucket_id = 'posters');
     ```

3. **File size limits:**
   - Supabase free tier has a 50 MB upload limit per file.
   - For larger files, upgrade your plan or use a chunked upload approach.

4. **MIME type mismatch:**
   - Ensure you're uploading the correct file types (e.g., `.jpg`/`.png` for images).

---

## CORS Errors

**Symptom:** Browser console shows `Cross-Origin Request Blocked` or `Access-Control-Allow-Origin` errors.

### Supabase URL Configuration

1. **Wrong URL in `js/supabase-client.js`:**
   - Open the file and verify `SUPABASE_URL` matches exactly what's in your Supabase project settings.
   - Common mistakes: trailing slash, `http://` instead of `https://`, typo in project ref.

2. **Allowed origins in Supabase:**
   - Supabase dashboard → **Project Settings** → **API** → **Allowed Origins** (or CORS settings).
   - Add `http://localhost:*` for local development.
   - Add your production domain (e.g., `https://yourdomain.com`) for production.

3. **Opening `index.html` as a file:**
   - `file://` URLs are not allowed origins for CORS.
   - Use a local web server instead:
     ```powershell
     npx serve .
     ```

4. **Edge Function CORS:**
   - If CORS errors come from `/functions/v1/...` endpoints, ensure each Edge Function includes the proper CORS headers in its response.

---

## Other Common Issues

### "supabase is not defined" in console

- The CDN script tag is missing or failed to load.
- Check `index.html` for: `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>`
- Verify internet connectivity: run `scripts\check-environment.ps1` and check the CDN row.

### Database migration fails midway

- The migration is designed to be idempotent (`CREATE TABLE IF NOT EXISTS`, `CREATE POLICY IF NOT EXISTS`).
- If it fails partway through, you can safely re-run the entire file.
- Check the SQL Editor output for the specific error line.

### "Invalid API key" (401)

- Your anon key is wrong or has been regenerated.
- Re-run `scripts\setup-supabase.ps1` with the correct key from Project Settings → API.

### Admin panel shows but actions return 403

- Your account's `role` in the `profiles` table is not set to `admin`.
- See [Admin Login Fails](#admin-login-fails) Step 2.

---

*For further help, consult the [Supabase documentation](https://supabase.com/docs) or open an issue in the project repository.*

*Last updated: 2026-11-21*
