-- ====================================================================
-- FLIXORA DATABASE HARDENING & SECURE CATALOG MIGRATION
-- Migration: 20261121_flixora_v2_hardening.sql
-- PRD Reference: Flixora v2.0 Section 8, 11, 17, 22
-- Defect Fixes: BUG-P0-01 (Anonymous RLS / Catalog View), BUG-P1-01 (viewer_profiles deprecation)
-- Deployment Order: Apply after 20261120_flixora_init.sql
-- ====================================================================

-- 1. DEPRECATION DOCUMENTATION FOR VIEWER PROFILES
-- PRD v2.0 dictates anonymous viewer access with zero user registration.
-- To maintain migration safety and avoid accidental data loss on existing environments,
-- we do not drop the table, but mark it deprecated and restrict public modifications.
COMMENT ON TABLE public.viewer_profiles IS 'DEPRECATED as of Flixora v2.0: Anonymous viewers do not register or maintain profiles in auth.users. Retained for historical schema compatibility; scheduled for formal pruning in v3.0.';

-- Revoke all direct public modifications on deprecated table
REVOKE INSERT, UPDATE, DELETE ON public.viewer_profiles FROM anon, public;

-- 2. PERFORMANCE OPTIMIZATION INDEXES
-- Support high-concurrency anonymous catalog discovery and fast join resolution
CREATE INDEX IF NOT EXISTS idx_movies_publication_status 
    ON public.movies(publication_status, media_type);

CREATE INDEX IF NOT EXISTS idx_video_sources_active_lookup 
    ON public.video_sources(movie_id, provider_id, is_active, priority) 
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_license_rights_validation 
    ON public.license_rights(id, status, streaming_allowed, valid_from, valid_until) 
    WHERE status = 'approved' AND streaming_allowed = TRUE;

CREATE INDEX IF NOT EXISTS idx_video_providers_active_status 
    ON public.video_providers(id, status) 
    WHERE status = 'active';

-- 3. SECURE PUBLIC CATALOG VIEW (Fixes BUG-P0-01)
-- Provides anonymous viewers with safe read-only access to published, active, and licensed content.
-- Employs security_barrier = true to prevent side-channel data leakages through user-defined operators.
-- Strictly EXCLUDES: playback_url, provider_asset_id, provider configuration, license documents, and rights holder info.
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

COMMENT ON VIEW public.public_available_content IS 'Public sanitized catalog view for anonymous viewers. Exposes only published, active, licensed media metadata without raw streaming URLs or provider secrets.';

-- 4. PERMISSIONS & ROLE ACCESS CONTROL
-- Grant safe SELECT access to anonymous visitors and authenticated users
GRANT SELECT ON public.public_available_content TO anon, authenticated;

-- Explicitly revoke data manipulation rights on the public view
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.public_available_content FROM anon, authenticated, public;

-- Strictly revoke direct SELECT and modification privileges from anonymous role on sensitive underlying tables
REVOKE ALL ON public.video_sources FROM anon;
REVOKE ALL ON public.license_rights FROM anon;
REVOKE ALL ON public.admin_profiles FROM anon;
REVOKE ALL ON public.audit_logs FROM anon;
REVOKE ALL ON public.playback_sessions FROM anon;

-- Ensure authenticated non-admins cannot mutate core catalog
REVOKE INSERT, UPDATE, DELETE ON public.movies FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.seasons FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.episodes FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.video_providers FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.video_sources FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.license_rights FROM anon;

-- 5. ROLLBACK STRATEGY (Documentation & Safe Procedures)
-- To roll back this migration in the event of an emergency:
-- 1. DROP VIEW IF EXISTS public.public_available_content CASCADE;
-- 2. DROP INDEX IF EXISTS idx_movies_publication_status;
-- 3. DROP INDEX IF EXISTS idx_video_sources_active_lookup;
-- 4. DROP INDEX IF EXISTS idx_license_rights_validation;
-- 5. DROP INDEX IF EXISTS idx_video_providers_active_status;
-- 6. GRANT SELECT ON public.video_sources TO authenticated; -- restores v1.0 state
