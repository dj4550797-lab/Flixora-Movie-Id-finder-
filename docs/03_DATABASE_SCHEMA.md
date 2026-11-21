# Flixora v2.0 — Database Schema Reference

**Database:** Supabase PostgreSQL 15  
**Schema:** `public`  
**Supabase URL:** `https://comxecntwlntgvjbvkjs.supabase.co`

---

## 1. Tables Overview

| Table | Purpose | RLS |
|---|---|---|
| `movies` | Core catalog: movies and TV shows | anon: read published only |
| `seasons` | TV seasons linked to movies | anon: read |
| `episodes` | TV episodes per season | anon: read |
| `video_sources` | Video source records (private) | anon: NO access |
| `video_providers` | Provider adapter configs | admin only |
| `license_rights` | License/rights windows per source | admin only |
| `playback_sessions` | Viewer playback session records | anon: insert via Edge Fn |
| `playback_events` | Per-session playback events | anon: insert via Edge Fn |
| `audit_logs` | Admin action log | admin only |
| `admin_profiles` | Super Admin role table | admin only |
| `viewer_profiles` | Reserved for future use | admin only |
| `site_settings` | Global platform settings | admin only |

---

## 2. Table Definitions

### 2.1 `movies`

Stores the primary catalog entries for both movies and TV shows.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Internal unique ID |
| `tmdb_id` | `integer` | NOT NULL, UNIQUE | TMDB title ID |
| `imdb_id` | `varchar(20)` | NULLABLE | IMDb ID (e.g. `tt1234567`) |
| `title` | `text` | NOT NULL | Display title |
| `original_title` | `text` | NULLABLE | Original-language title |
| `content_type` | `text` | NOT NULL | `'movie'` \| `'tv'` \| `'anime'` |
| `overview` | `text` | NULLABLE | Short description |
| `poster_path` | `text` | NULLABLE | TMDB poster path |
| `backdrop_path` | `text` | NULLABLE | TMDB backdrop path |
| `release_date` | `date` | NULLABLE | Release / first air date |
| `vote_average` | `numeric(4,2)` | NULLABLE | TMDB rating |
| `runtime` | `integer` | NULLABLE | Minutes (movies) |
| `genres` | `jsonb` | NULLABLE | Array of genre objects |
| `languages` | `jsonb` | NULLABLE | Spoken languages |
| `production_companies` | `jsonb` | NULLABLE | Production company list |
| `budget` | `bigint` | NULLABLE | Budget in USD |
| `revenue` | `bigint` | NULLABLE | Revenue in USD |
| `is_published` | `boolean` | DEFAULT false | Admin publish flag |
| `published_at` | `timestamptz` | NULLABLE | When published |
| `created_at` | `timestamptz` | DEFAULT now() | Record creation time |
| `updated_at` | `timestamptz` | DEFAULT now() | Last update time |

**Indexes:** `tmdb_id`, `content_type`, `is_published`, `release_date DESC`

**RLS Summary:**
- `anon`: SELECT WHERE `is_published = true`
- `authenticated` (admin): Full CRUD

---

### 2.2 `seasons`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK | Internal ID |
| `movie_id` | `uuid` | FK → `movies.id`, NOT NULL | Parent TV show |
| `tmdb_season_id` | `integer` | NULLABLE | TMDB season ID |
| `season_number` | `integer` | NOT NULL | Season number |
| `name` | `text` | NULLABLE | Season display name |
| `overview` | `text` | NULLABLE | Season summary |
| `poster_path` | `text` | NULLABLE | Season poster |
| `air_date` | `date` | NULLABLE | Season air date |
| `episode_count` | `integer` | NULLABLE | Total episodes |
| `created_at` | `timestamptz` | DEFAULT now() | — |

**RLS Summary:**
- `anon`: SELECT via parent `movie_id` join (published shows)
- `authenticated` (admin): Full CRUD

---

### 2.3 `episodes`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK | Internal ID |
| `season_id` | `uuid` | FK → `seasons.id`, NOT NULL | Parent season |
| `movie_id` | `uuid` | FK → `movies.id`, NOT NULL | Root show (denormalized) |
| `tmdb_episode_id` | `integer` | NULLABLE | TMDB episode ID |
| `episode_number` | `integer` | NOT NULL | Episode number within season |
| `name` | `text` | NULLABLE | Episode title |
| `overview` | `text` | NULLABLE | Episode summary |
| `still_path` | `text` | NULLABLE | Episode still image |
| `air_date` | `date` | NULLABLE | Episode air date |
| `runtime` | `integer` | NULLABLE | Episode runtime in minutes |
| `is_published` | `boolean` | DEFAULT false | Episode-level publish |
| `created_at` | `timestamptz` | DEFAULT now() | — |

**RLS Summary:**
- `anon`: SELECT WHERE parent show is published AND episode `is_published = true`
- `authenticated` (admin): Full CRUD

---

### 2.4 `video_providers`

Stores configuration for each supported playback provider.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK | — |
| `name` | `text` | NOT NULL, UNIQUE | Provider display name |
| `provider_type` | `text` | NOT NULL | `'mp4'` \| `'hls'` \| `'youtube'` \| `'vimeo'` \| `'custom'` \| `'drm'` |
| `is_enabled` | `boolean` | DEFAULT true | Whether provider is active |
| `supported_formats` | `jsonb` | NULLABLE | Allowed MIME types / formats |
| `validation_method` | `text` | NULLABLE | How to validate a source URL |
| `playback_adapter` | `text` | NULLABLE | Adapter identifier used in `providers.js` |
| `priority` | `integer` | DEFAULT 10 | Lower = tried first in fallback chain |
| `config` | `jsonb` | NULLABLE | Provider-specific settings |
| `created_at` | `timestamptz` | DEFAULT now() | — |
| `updated_at` | `timestamptz` | DEFAULT now() | — |

**RLS Summary:**
- `anon`: NO access
- `authenticated` (admin): Full CRUD

---

### 2.5 `video_sources`

The core private table linking content to actual video sources. **Never exposed to anonymous users.**

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK | — |
| `movie_id` | `uuid` | FK → `movies.id`, NOT NULL | Parent content |
| `episode_id` | `uuid` | FK → `episodes.id`, NULLABLE | Null for movies |
| `provider_id` | `uuid` | FK → `video_providers.id`, NOT NULL | Which provider |
| `source_type` | `text` | NOT NULL | `'upload'` \| `'url'` \| `'provider_id'` |
| `source_locator` | `text` | NOT NULL | Private URL, storage path, or provider video ID |
| `storage_bucket` | `text` | NULLABLE | Supabase Storage bucket name |
| `storage_path` | `text` | NULLABLE | Path within bucket |
| `status` | `text` | DEFAULT `'draft'` | `'draft'` \| `'validating'` \| `'active'` \| `'failed'` \| `'disabled'` |
| `validation_result` | `jsonb` | NULLABLE | Validation output from Edge Function |
| `is_active` | `boolean` | DEFAULT false | Admin activation flag |
| `is_primary` | `boolean` | DEFAULT false | Primary source for fallback ordering |
| `quality` | `text` | NULLABLE | `'4k'` \| `'1080p'` \| `'720p'` \| `'480p'` |
| `subtitles` | `jsonb` | NULLABLE | Subtitle track configs |
| `created_at` | `timestamptz` | DEFAULT now() | — |
| `updated_at` | `timestamptz` | DEFAULT now() | — |

**RLS Summary:**
- `anon`: **NO SELECT** — blocked entirely
- `authenticated` (admin): Full CRUD
- Playback data is returned only by `playback-authorize` Edge Function (never raw `source_locator`)

---

### 2.6 `license_rights`

Tracks content licensing windows and restrictions.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK | — |
| `source_id` | `uuid` | FK → `video_sources.id`, NOT NULL | Linked source |
| `movie_id` | `uuid` | FK → `movies.id`, NOT NULL | Denormalized parent |
| `license_reference` | `text` | NULLABLE | License contract number or identifier |
| `license_start` | `date` | NULLABLE | When license begins |
| `license_expiry` | `date` | NULLABLE | When license expires (NULL = perpetual) |
| `allowed_regions` | `text[]` | NULLABLE | ISO 3166-1 alpha-2 codes; NULL = all |
| `blocked_regions` | `text[]` | NULLABLE | Explicitly blocked regions |
| `restrictions` | `jsonb` | NULLABLE | Additional restriction metadata |
| `license_status` | `text` | DEFAULT `'active'` | `'active'` \| `'expired'` \| `'pending'` \| `'revoked'` |
| `created_at` | `timestamptz` | DEFAULT now() | — |
| `updated_at` | `timestamptz` | DEFAULT now() | — |

**RLS Summary:**
- `anon`: NO access
- `authenticated` (admin): Full CRUD

---

### 2.7 `playback_sessions`

Records each viewer playback session. Created server-side by `playback-authorize`.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK | — |
| `movie_id` | `uuid` | FK → `movies.id` | Content being played |
| `source_id` | `uuid` | FK → `video_sources.id` | Source used |
| `episode_id` | `uuid` | NULLABLE | Episode (if TV) |
| `viewer_session_id` | `text` | NULLABLE | Anonymous session fingerprint |
| `ip_hash` | `text` | NULLABLE | Hashed viewer IP (no PII) |
| `region_code` | `varchar(2)` | NULLABLE | Viewer region (ISO) |
| `player_adapter` | `text` | NULLABLE | Which adapter was used |
| `authorized_at` | `timestamptz` | DEFAULT now() | Authorization timestamp |
| `started_at` | `timestamptz` | NULLABLE | When playback actually began |
| `ended_at` | `timestamptz` | NULLABLE | When playback ended |
| `error_code` | `text` | NULLABLE | Error if playback failed |
| `created_at` | `timestamptz` | DEFAULT now() | — |

**RLS Summary:**
- `anon`: INSERT only (via Edge Function) — no SELECT
- `authenticated` (admin): Full access

---

### 2.8 `playback_events`

Fine-grained playback telemetry events within a session.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK | — |
| `session_id` | `uuid` | FK → `playback_sessions.id` | Parent session |
| `event_type` | `text` | NOT NULL | `'play'` \| `'pause'` \| `'seek'` \| `'buffer'` \| `'error'` \| `'end'` |
| `event_time` | `timestamptz` | DEFAULT now() | When event occurred |
| `playback_position` | `numeric(10,3)` | NULLABLE | Seconds into video |
| `metadata` | `jsonb` | NULLABLE | Additional event context |

**RLS Summary:**
- `anon`: INSERT only (via Edge Function)
- `authenticated` (admin): Full access

---

### 2.9 `audit_logs`

Immutable log of all admin actions.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK | — |
| `admin_id` | `uuid` | FK → `admin_profiles.id` | Which admin acted |
| `action` | `text` | NOT NULL | Action identifier (e.g. `'publish_content'`) |
| `target_table` | `text` | NULLABLE | Affected table |
| `target_id` | `uuid` | NULLABLE | Affected record ID |
| `before_state` | `jsonb` | NULLABLE | Snapshot before change |
| `after_state` | `jsonb` | NULLABLE | Snapshot after change |
| `ip_address` | `text` | NULLABLE | Admin IP (hashed) |
| `user_agent` | `text` | NULLABLE | Admin browser UA |
| `created_at` | `timestamptz` | DEFAULT now() | Immutable timestamp |

**RLS Summary:**
- `anon`: NO access
- `authenticated` (admin): SELECT only (no delete — immutable)

---

### 2.10 `admin_profiles`

Links Supabase Auth UIDs to admin roles.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK | — |
| `user_id` | `uuid` | UNIQUE, FK → auth.users | Supabase Auth UID |
| `role` | `text` | NOT NULL | `'super_admin'` |
| `is_active` | `boolean` | DEFAULT true | Soft-disable flag |
| `display_name` | `text` | NULLABLE | Admin display name |
| `created_at` | `timestamptz` | DEFAULT now() | — |

**RLS Summary:**
- `anon`: NO access
- `authenticated`: SELECT WHERE `user_id = auth.uid()` (self only)
- Edge Functions use service-role to verify admin status server-side

---

### 2.11 `viewer_profiles`

Reserved for future use. Currently stores no PII.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK | — |
| `session_token` | `text` | UNIQUE | Anonymous session token |
| `preferences` | `jsonb` | NULLABLE | Watch history preferences (no PII) |
| `created_at` | `timestamptz` | DEFAULT now() | — |

**RLS Summary:**
- `anon`: INSERT/SELECT own record (by session token only)
- `authenticated` (admin): Full access

---

### 2.12 `site_settings`

Key-value store for global platform configuration.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK | — |
| `setting_key` | `text` | UNIQUE, NOT NULL | Setting identifier |
| `setting_value` | `jsonb` | NULLABLE | Setting value |
| `description` | `text` | NULLABLE | Human-readable purpose |
| `updated_by` | `uuid` | NULLABLE | Admin who last changed it |
| `updated_at` | `timestamptz` | DEFAULT now() | — |

**RLS Summary:**
- `anon`: SELECT on explicitly public settings only
- `authenticated` (admin): Full CRUD

---

## 3. `public_available_content` View

This is the **only** way anonymous viewers access content data. It is a security-barrier view that exposes a sanitized subset of published content.

```sql
CREATE VIEW public.public_available_content
WITH (security_barrier = true)
AS
SELECT
    m.id,
    m.tmdb_id,
    m.title,
    m.original_title,
    m.content_type,
    m.overview,
    m.poster_path,
    m.backdrop_path,
    m.release_date,
    m.vote_average,
    m.genres,
    m.published_at,
    vs.id          AS source_id,
    vs.provider_id,
    vs.quality,
    vp.name        AS provider_name,
    vp.provider_type
FROM movies m
JOIN video_sources vs ON vs.movie_id = m.id
JOIN video_providers vp ON vp.id = vs.provider_id
LEFT JOIN license_rights lr ON lr.source_id = vs.id
WHERE
    m.is_published = true
    AND vs.is_active = true
    AND vs.status = 'active'
    AND (lr.id IS NULL OR (
        lr.license_status = 'active'
        AND (lr.license_expiry IS NULL OR lr.license_expiry > CURRENT_DATE)
        AND (lr.license_start IS NULL OR lr.license_start <= CURRENT_DATE)
    ));
```

### What This View Does NOT Expose

| Hidden Field | Table | Reason |
|---|---|---|
| `source_locator` | `video_sources` | Private URL / storage path |
| `storage_path` | `video_sources` | Bucket path |
| `storage_bucket` | `video_sources` | Bucket name |
| `license_reference` | `license_rights` | Contract details |
| `allowed_regions` | `license_rights` | Business-sensitive |
| `config` | `video_providers` | Provider credentials |
| All `audit_logs` | — | Admin only |
| All `admin_profiles` | — | Admin only |

### Columns Returned

| Column | Source | Description |
|---|---|---|
| `id` | `movies.id` | Content UUID |
| `tmdb_id` | `movies.tmdb_id` | TMDB ID for metadata enrichment |
| `title` | `movies.title` | Display title |
| `content_type` | `movies.content_type` | `movie` / `tv` / `anime` |
| `overview` | `movies.overview` | Short description |
| `poster_path` | `movies.poster_path` | TMDB poster path |
| `backdrop_path` | `movies.backdrop_path` | TMDB backdrop |
| `release_date` | `movies.release_date` | Release date |
| `vote_average` | `movies.vote_average` | Rating |
| `genres` | `movies.genres` | Genre array |
| `published_at` | `movies.published_at` | When Admin published |
| `source_id` | `video_sources.id` | Used for playback-authorize calls |
| `provider_name` | `video_providers.name` | Display name only |
| `provider_type` | `video_providers.provider_type` | To select correct player UI |
| `quality` | `video_sources.quality` | Quality badge |

---

## 4. Database Triggers

| Trigger | Table | Event | Action |
|---|---|---|---|
| `set_updated_at` | All tables with `updated_at` | BEFORE UPDATE | Sets `updated_at = now()` |
| `log_admin_action` | `video_sources`, `movies`, `license_rights` | AFTER INSERT/UPDATE/DELETE | Inserts into `audit_logs` |
| `expire_licenses` | `license_rights` | BEFORE SELECT (view) | Computed via WHERE clause |

---

## 5. Migration Files

| File | Purpose |
|---|---|
| `20261120_flixora_init.sql` | Creates all 12 tables, RLS policies, and base triggers |
| `20261121_flixora_v2_hardening.sql` | Creates `public_available_content` view, composite indexes, revokes `anon` from sensitive tables |
| `20261121_flixora_v2_storage.sql` | Provisions `videos` private bucket (500 MB limit) and storage RLS policies |

> [!IMPORTANT]
> Run migrations **in exact order** in Supabase SQL Editor. Running them out of order will cause foreign key and RLS errors.
