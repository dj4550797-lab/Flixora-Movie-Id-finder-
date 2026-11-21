# Flixora v2.0 — System Architecture

---

## 1. Architecture Overview

Flixora follows a **static frontend + serverless backend** pattern:

- The frontend is **pure static HTML/CSS/JS** deployed on GitHub Pages
- All dynamic logic runs in **Supabase** (PostgreSQL, Auth, Storage, Edge Functions on Deno)
- No Node.js or Python server processes run on the hosting layer

```
┌─────────────────────────────────────────────────────────────────┐
│                        VIEWER BROWSER                           │
│  index.html · css/ · js/ · providers.js                         │
│  GitHub Pages — github.io/flixora/                              │
└──────────────┬──────────────────────────────┬───────────────────┘
               │  Anonymous requests           │  Realtime WebSocket
               ▼                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                        SUPABASE CLOUD                            │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │  Edge Functions   │  │   PostgreSQL DB   │  │   Storage     │  │
│  │  (Deno Runtime)  │  │   + RLS Policies  │  │  videos/      │  │
│  │                  │  │                  │  │  bucket       │  │
│  │ tmdb-proxy       │  │  12 Tables        │  │  (private)    │  │
│  │ playback-auth    │  │  public_available │  │               │  │
│  │ admin-upload     │  │  _content view    │  │  Signed URLs  │  │
│  └──────┬───────────┘  └──────────────────┘  └───────────────┘  │
│         │                                                         │
│  ┌──────────────┐                                                 │
│  │  Supabase    │                                                 │
│  │  Auth        │                                                 │
│  │  (Admin only)│                                                 │
│  └──────────────┘                                                 │
└──────────────────────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────┐
│          TMDB API            │
│  (accessed via tmdb-proxy    │
│   Edge Function only)        │
└──────────────────────────────┘
```

---

## 2. Frontend Architecture

### Entry Points

| File | Purpose |
|---|---|
| `index.html` | Viewer application (anonymous, public) |
| `Admin.html` | Super Admin control center (auth-gated) |
| `Index.html` | Legacy compatibility alias |
| `providers.js` | Video provider adapter module |

### JavaScript Modules (`js/`)

| Module | Responsibility |
|---|---|
| `app.js` | App bootstrap, routing (`#hash`-based), section reveal |
| `supabase-client.js` | Supabase JS client initialization (anon key only) |
| `movie-service.js` | TMDB proxy calls, catalog fetching, search |
| `video-service.js` | Available Videos, playback authorization requests |
| `player.js` | Player initialization, provider adapter dispatch, teardown |
| `auth.js` | Admin-side Supabase Auth: sign-in, session, sign-out |
| `admin.js` | Admin dashboard sections, 7-step wizard, CRUD operations |

### CSS Modules (`css/`)

| File | Scope |
|---|---|
| `style.css` | Global viewer design system, design tokens, components |
| `animations.css` | Splash, section reveals, poster hover, transition rules |
| `admin.css` | Admin-only SaaS dark-blue dashboard styles |

---

## 3. Data Flow Diagrams

### 3.1 Anonymous Viewer — Discovery Flow

```
Viewer Browser
     │
     │ 1. Load index.html from GitHub Pages
     │
     ▼
app.js bootstraps
     │
     │ 2. Fetch trending/popular/anime via tmdb-proxy
     ▼
tmdb-proxy (Edge Function)
     │
     │ 3. Edge Function calls TMDB API (server-side key)
     ▼
TMDB API → response → Edge Function → browser
     │
     │ 4. Render hero + carousels
     │
     │ 5. Query public_available_content view (anon RLS)
     ▼
PostgreSQL → public_available_content view
     │
     │ 6. Render Available Videos cards with Watch buttons
```

### 3.2 Viewer — Playback Authorization Flow

```
Viewer clicks "Watch Now"
     │
     │ 1. frontend calls playback-authorize Edge Function
     │    { movie_id, source_id }
     ▼
playback-authorize (Edge Function)
     │
     │ 2. Verifies is_published = true
     │ 3. Verifies source is active
     │ 4. Verifies license not expired
     │ 5. Checks region restrictions (if set)
     │ 6. Creates playback_sessions record
     │ 7. Returns minimal player config (no raw URL for private sources)
     ▼
providers.js dispatches correct player adapter
     │
     ├── MP4 Direct → <video> element
     ├── HLS.js → MediaSource Extensions (Safari native HLS)
     ├── YouTube → YouTube IFrame API
     └── Vimeo → Vimeo Player SDK
```

### 3.3 Admin — Publish Workflow Flow

```
Admin opens Admin.html
     │
     │ 1. Supabase Auth — email/password sign-in
     │ 2. JWT returned, stored in session
     │ 3. admin_profiles table checked for super_admin role
     ▼
Admin Dashboard loaded
     │
     │ [7-Step Add Video Wizard]
     │
     │ Step 1: Select content (search TMDB)
     │ Step 2: Select source type
     │ Step 3: Add source URL / upload file
     │ Step 4: Enter license info
     │ Step 5: Validate source
     │ Step 6: Preview video
     │ Step 7: Publish
     ▼
video_sources.is_active = true
movies.is_published = true
     │
     │ Supabase Realtime broadcasts change
     ▼
Viewer Available Videos section refreshes
Watch button appears on details page
```

---

## 4. Authentication Flow

### Admin Authentication

```
1. Admin navigates to Admin.html
2. Login form: email + password
3. supabase.auth.signInWithPassword({ email, password })
4. Supabase Auth validates credentials
5. JWT (access_token) returned to browser
6. auth.js reads admin_profiles WHERE user_id = auth.uid()
7. If role = 'super_admin' AND is_active = true → grant access
8. If not found → reject, show error, sign out
9. All subsequent admin API calls use Authorization: Bearer <JWT>
10. Edge Functions verify JWT and admin role server-side
```

### Viewer (Anonymous) Flow

```
1. Viewer opens index.html
2. supabase-client.js initializes with ANON KEY only
3. No auth.signIn call
4. All DB reads go through RLS as "anon" role
5. Only public_available_content view is readable
6. Private tables (video_sources, audit_logs, etc.) → RLS denies
7. Playback authorization goes through Edge Function (no raw credentials)
```

---

## 5. Edge Functions

### 5.1 `tmdb-proxy`

| Property | Value |
|---|---|
| Runtime | Deno (Supabase Edge Functions) |
| Auth required | No (`--no-verify-jwt`) |
| Purpose | Proxies TMDB API requests, keeping TMDB_API_KEY server-side |
| Input | `{ endpoint, params }` |
| Output | TMDB JSON response |
| Rate limiting | Supabase Function invocation limits apply |

### 5.2 `playback-authorize`

| Property | Value |
|---|---|
| Runtime | Deno |
| Auth required | No (anonymous viewers trigger it) |
| Purpose | Validates all conditions before playback; creates session record |
| Input | `{ content_id, source_id }` |
| Output | `{ authorized: true, player_config: { ... } }` or `{ authorized: false, reason }` |
| Checks | Published, active source, valid license, region restrictions |

### 5.3 `admin-video-upload`

| Property | Value |
|---|---|
| Runtime | Deno |
| Auth required | Yes — valid Super Admin JWT |
| Purpose | Handles server-side file validation and Supabase Storage upload |
| Input | Multipart form data: file, content_id, provider metadata |
| Output | `{ success: true, storage_path, source_id }` or error |
| Validation | MIME type, file size (≤ 500 MB), format check |

---

## 6. Supabase Realtime

The frontend subscribes to these Realtime channels:

| Channel | Table / Event | Purpose |
|---|---|---|
| `available-videos` | `video_sources` INSERT/UPDATE | Refresh Available Videos when Admin publishes |
| `catalog-updates` | `movies` UPDATE | Update hero/cards when metadata changes |

---

## 7. File Structure

```
Flixora Movie ID Finder/
│
├── index.html                  ← Viewer entry point
├── Index.html                  ← Legacy alias
├── Admin.html                  ← Admin control center
├── providers.js                ← Video provider adapters
│
├── assets/
│   ├── logo/                   ← Flixora logo files
│   ├── posters/                ← Fallback poster images
│   ├── backgrounds/            ← Fallback backdrop images
│   ├── icons/                  ← UI icons
│   └── fonts/                  ← Self-hosted web fonts
│
├── css/
│   ├── style.css               ← Global viewer styles + design tokens
│   ├── animations.css          ← All animation definitions
│   └── admin.css               ← Admin dashboard styles
│
├── js/
│   ├── app.js                  ← App bootstrap + hash router
│   ├── supabase-client.js      ← Supabase JS v2 initialization
│   ├── movie-service.js        ← TMDB proxy calls + catalog
│   ├── video-service.js        ← Available Videos + availability check
│   ├── player.js               ← Player init, adapter dispatch, teardown
│   ├── auth.js                 ← Admin auth (sign-in/out, session)
│   └── admin.js                ← Admin dashboard logic + wizard
│
├── supabase/
│   ├── migrations/
│   │   ├── 20261120_flixora_init.sql
│   │   ├── 20261121_flixora_v2_hardening.sql
│   │   └── 20261121_flixora_v2_storage.sql
│   └── functions/
│       ├── tmdb-proxy/
│       │   └── index.ts
│       ├── playback-authorize/
│       │   └── index.ts
│       └── admin-video-upload/
│           └── index.ts
│
├── tests/
│   ├── e2e_full_suite.test.js
│   ├── new_features_suite.test.js
│   └── security_sprint21.test.js
│
├── docs/                       ← This documentation folder
├── PRD.md
├── DEPLOYMENT_GUIDE.md
├── REVIEW.md
└── .env.example
```

---

## 8. Technology Stack Summary

| Layer | Technology |
|---|---|
| Frontend framework | Vanilla JS (ES modules), HTML5, CSS3 |
| 3D animation | Three.js (cosmos background) |
| Video: HLS | hls.js (MediaSource Extensions) |
| Video: YouTube | YouTube IFrame API |
| Video: Vimeo | Vimeo Player SDK |
| Backend DB | Supabase PostgreSQL 15 |
| Backend Auth | Supabase Auth (GoTrue) |
| Backend Storage | Supabase Storage (S3-compatible) |
| Backend Functions | Supabase Edge Functions (Deno) |
| Realtime | Supabase Realtime (WebSocket) |
| Movie data | TMDB API v3 |
| Hosting | GitHub Pages |
| CDN | GitHub Pages CDN (global) |
