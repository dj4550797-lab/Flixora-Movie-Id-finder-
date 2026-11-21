# Flixora v2.0 — Database Architecture & Data Model

## 1. Architectural Overview

Flixora v2.0 utilizes Supabase (PostgreSQL 15+) for relational persistence, Row Level Security (RLS), real-time change synchronization, asset storage, and serverless Edge Functions.

```
                           +----------------------+
                           |   Anonymous Viewer   |
                           +----------+-----------+
                                      |
                      Reads only public_available_content
                                      |
                                      v
+------------------+       +----------------------+       +----------------------+
|  TMDB API Proxy  | <----+ public_available_view | <----+   movies & sources   |
+------------------+       +----------------------+       +----------+-----------+
                                                                     ^
                                                                     |
                                                          Full RLS Management
                                                                     |
                                                          +----------+-----------+
                                                          |  Super Admin (Auth)  |
                                                          +----------------------+
```

---

## 2. Relational Schema Summary

### 2.1 Content Hierarchy
1. **`movies`**: Canonical media registry representing films or television series.
   - Primary Key: `id UUID`
   - Attributes: `tmdb_id`, `media_type` (`movie` | `tv`), `title`, `overview`, `poster_path`, `backdrop_path`, `release_date`, `rating`, `publication_status`.
   - Constraints: `UNIQUE (tmdb_id, media_type)`

2. **`seasons`**: Season division for episodic TV titles.
   - Foreign Key: `movie_id REFERENCES movies(id) ON DELETE CASCADE`
   - Attributes: `season_number`, `title`, `overview`, `poster_path`.

3. **`episodes`**: Individual playable units within a television season.
   - Foreign Key: `season_id REFERENCES seasons(id) ON DELETE CASCADE`
   - Attributes: `episode_number`, `title`, `runtime`, `still_path`, `publication_status`.

### 2.2 Streaming & Licensing Layer
4. **`video_providers`**: Registry of video adapters and delivery engines.
   - Attributes: `name`, `provider_type` (`mp4_direct`, `hls_stream`, `youtube`, `vimeo`), `status`, `health_status`.

5. **`license_rights`**: Legal distribution rights enforcing PRD Rule 6.
   - Attributes: `rights_holder`, `license_reference`, `streaming_allowed`, `valid_from`, `valid_until`, `status`.

6. **`video_sources`**: Physical stream locators and manifest targets.
   - Foreign Keys: `movie_id`, `episode_id`, `provider_id`, `license_id`.
   - Attributes: `format`, `provider_asset_id`, `playback_url`, `quality`, `is_active`, `expires_at`.

### 2.3 Security, Telemetry & Operations
7. **`admin_profiles`**: Designated Super Admin accounts linked to Supabase Auth.
   - Foreign Key: `user_id REFERENCES auth.users(id) ON DELETE CASCADE`
   - Attributes: `role` (`super_admin`), `is_active`.

8. **`playback_sessions`**: Ephemeral telemetry sessions (4-hour TTL).
9. **`playback_events`**: High-frequency telemetry events (`start`, `buffer`, `pause`, `error`).
10. **`audit_logs`**: Administrative immutable event log.
11. **`site_settings`**: Global platform switches and maintenance mode settings.

---

## 3. Public Security Barrier View

To safeguard private video URLs and credentials from anonymous visitors, the sanitized database view `public_available_content` operates with `security_barrier = true`:

```sql
CREATE OR REPLACE VIEW public.public_available_content
WITH (security_barrier = true) AS
SELECT 
    m.id AS content_id,
    m.tmdb_id,
    m.media_type,
    m.title,
    m.original_title,
    m.overview,
    m.tagline,
    m.poster_path,
    m.backdrop_path,
    m.release_date,
    m.runtime,
    m.rating,
    m.vote_count,
    COALESCE(m.metadata_json->'genres', '[]'::jsonb) AS genres,
    vs.id AS source_id,
    vs.format,
    vs.quality,
    vs.language,
    vs.priority,
    COALESCE(vs.created_at, m.updated_at) AS published_at
FROM public.movies m
JOIN public.video_sources vs ON m.id = vs.movie_id
JOIN public.video_providers vp ON vs.provider_id = vp.id
JOIN public.license_rights lr ON vs.license_id = lr.id
WHERE m.publication_status = 'published'
  AND vs.is_active = TRUE
  AND (vs.expires_at IS NULL OR vs.expires_at > NOW())
  AND vp.status = 'active'
  AND lr.status = 'approved'
  AND lr.streaming_allowed = TRUE
  AND lr.valid_from <= NOW()
  AND (lr.valid_until IS NULL OR lr.valid_until > NOW());
```

---

## 4. Storage Architecture

- **Bucket**: `videos`
- **Visibility**: Private (`public = false`)
- **Max File Size**: 500 MB (524,288,000 bytes)
- **Allowed MIME Types**: `video/mp4`, `video/webm`, `application/x-mpegURL`, `video/MP2T`
- **Access Policies**: Restricted strictly to authenticated users with `role = 'super_admin'`.
