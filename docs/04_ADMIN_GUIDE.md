# Flixora v2.0 — Super Admin Operation Guide

## 1. Accessing the Admin Control Center

The Super Admin portal is accessed via `Admin.html` or by clicking the **Admin** link in the navigation header of `index.html`.

- **Direct URL**: `https://<your-domain>/Admin.html`
- **Authentication**: Single Super Admin account via Supabase Auth.
- **Fail-Closed Security**: In the absence of an authenticated session with an active `admin_profiles` record, the dashboard locks all controls.

---

## 2. Super Admin Initial Account Creation

Because anonymous viewers cannot register, the Super Admin account must be provisioned through the Supabase Dashboard:

1. Open your project on **Supabase Dashboard** -> **Authentication** -> **Users**.
2. Click **Add User** -> **Create User**.
3. Enter your administrator email and a strong password (minimum 12 characters).
4. In **SQL Editor**, execute the query to grant super admin privileges:
   ```sql
   INSERT INTO public.admin_profiles (user_id, role, is_active)
   SELECT id, 'super_admin', true FROM auth.users WHERE email = 'your-admin-email@example.com'
   ON CONFLICT (user_id) DO UPDATE SET is_active = true, role = 'super_admin';
   ```

---

## 3. The 12 Dashboard Panes Explained

| Pane # | Name | Description | Key Capabilities |
|--------|------|-------------|------------------|
| **1** | **Overview** | Real-time platform status | Metrics for available titles, published streams, active adapters, and Rule 6 enforcement. |
| **2** | **Movies Catalog** | Feature film management | Filter, search, import from TMDB, toggle publish state, or delete records. |
| **3** | **TV Shows** | Series catalog | Categorized tabs for All, K-Drama, Anime, Ongoing, and Ended series. |
| **4** | **Episodes** | Per-episode management | Season selector and episode table with direct video source linking. |
| **5** | **Video Management** | Video publishing hub | 7-step publication wizard, status filters, and table pagination (10/page). |
| **6** | **Providers** | Streaming engines | Status and health monitoring for MP4, HLS, YouTube, and Vimeo adapters. |
| **7** | **Licenses** | Legal compliance (Rule 6) | Reference IDs, validity windows, and rights holder verification. |
| **8** | **Available Videos** | Admin live mirror | Mirrors the exact published catalog visible to anonymous viewers. |
| **9** | **Analytics** | Playback telemetry | Total plays, unique sessions, average watch time, and session log. |
| **10** | **Error Logs** | Telemetry exceptions | Categorized filter for HLS buffer errors, authentication expiry, and timeouts. |
| **11** | **Audit Logs** | Security trails | Tamper-evident admin activity log. |
| **12** | **Settings** | Platform configuration | Site title, maintenance mode toggle, announcement banner, and Supabase diagnostics. |

---

## 4. The 7-Step Add Video Workflow

Publishing a playable video requires completing the 7-step wizard:

1. **Step 1: Select Content**: Search TMDB proxy by title or ID and select media.
2. **Step 2: Select Provider Format**: Direct MP4, HLS stream (.m3u8), YouTube ID, Vimeo ID, or Supabase Storage upload.
3. **Step 3: Stream Locator / File Upload**: Provide the target URL/asset ID or upload a file (up to 500 MB) to the `videos` bucket.
4. **Step 4: License & Watch Availability Timer**: Specify license reference, expiry date, and availability countdown (24h, 48h, 7d, 30d, or permanent).
5. **Step 5: Pre-Flight Stream Validation**: Run protocol handshake to verify the stream locator is valid.
6. **Step 6: Live Playback Preview**: Inspect stream playback in the sandboxed preview player.
7. **Step 7: Confirm & Publish**: Save to catalog and instantly broadcast updates to all viewers via Supabase Realtime.
