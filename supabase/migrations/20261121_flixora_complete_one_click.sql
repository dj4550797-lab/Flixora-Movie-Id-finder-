-- ====================================================================
-- FLIXORA v2.0 — COMPLETE ONE-CLICK MASTER MIGRATION SCRIPT
-- Combines: Initial Schema, Security Hardening, Public View & Storage
-- 100% IDEMPOTENT: Safe to run multiple times without ANY duplicate errors
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. VIEWER PROFILES (DEPRECATED for v2.0 - Retained for backward schema compatibility)
CREATE TABLE IF NOT EXISTS public.viewer_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.viewer_profiles IS 'DEPRECATED as of Flixora v2.0: Anonymous viewers do not register or maintain profiles in auth.users.';
REVOKE INSERT, UPDATE, DELETE ON public.viewer_profiles FROM anon, public;

-- 4. ADMIN PROFILES
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helper function to check if current user is Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_profiles
        WHERE user_id = auth.uid() AND is_active = TRUE AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. MOVIES
CREATE TABLE IF NOT EXISTS public.movies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tmdb_id INTEGER NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'movie' CHECK (media_type IN ('movie', 'tv')),
    title TEXT NOT NULL,
    original_title TEXT,
    overview TEXT,
    tagline TEXT,
    poster_path TEXT,
    backdrop_path TEXT,
    release_date DATE,
    original_language TEXT DEFAULT 'en',
    runtime INTEGER,
    rating NUMERIC(3,1) DEFAULT 0.0,
    vote_count INTEGER DEFAULT 0,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    publication_status TEXT NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft', 'published', 'unpublished', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tmdb_media UNIQUE (tmdb_id, media_type)
);

-- 6. SEASONS
CREATE TABLE IF NOT EXISTS public.seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
    season_number INTEGER NOT NULL,
    title TEXT,
    overview TEXT,
    poster_path TEXT,
    air_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_series_season UNIQUE (movie_id, season_number)
);

-- 7. EPISODES
CREATE TABLE IF NOT EXISTS public.episodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    overview TEXT,
    runtime INTEGER,
    air_date DATE,
    still_path TEXT,
    publication_status TEXT NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft', 'published', 'unpublished')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_season_episode UNIQUE (season_id, episode_number)
);

-- 8. VIDEO PROVIDERS
CREATE TABLE IF NOT EXISTS public.video_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    provider_type TEXT NOT NULL CHECK (provider_type IN ('mp4_direct', 'hls_stream', 'youtube', 'vimeo', 'custom_adapter')),
    integration_type TEXT NOT NULL DEFAULT 'standard',
    configuration JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'maintenance')),
    health_status TEXT NOT NULL DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'degraded', 'offline')),
    last_checked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. LICENSE RIGHTS
CREATE TABLE IF NOT EXISTS public.license_rights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rights_holder TEXT NOT NULL,
    license_reference TEXT NOT NULL,
    content_reference TEXT,
    streaming_allowed BOOLEAN NOT NULL DEFAULT TRUE,
    download_allowed BOOLEAN NOT NULL DEFAULT FALSE,
    allowed_regions TEXT[] DEFAULT ARRAY['*']::text[],
    blocked_regions TEXT[] DEFAULT ARRAY[]::text[],
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ NOT NULL,
    provider_restrictions JSONB DEFAULT '{}'::jsonb,
    evidence_document_reference TEXT,
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'expiring_soon', 'expired', 'revoked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. VIDEO SOURCES
CREATE TABLE IF NOT EXISTS public.video_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
    episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES public.video_providers(id) ON DELETE RESTRICT,
    license_id UUID REFERENCES public.license_rights(id) ON DELETE SET NULL,
    format TEXT NOT NULL DEFAULT 'mp4' CHECK (format IN ('mp4', 'hls', 'embed_youtube', 'embed_vimeo', 'custom')),
    provider_asset_id TEXT NOT NULL,
    playback_url TEXT,
    quality TEXT DEFAULT '1080p',
    language TEXT DEFAULT 'en',
    subtitle_config JSONB DEFAULT '[]'::jsonb,
    priority INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    territory_config JSONB DEFAULT '{"allowed": ["*"]}'::jsonb,
    last_tested_at TIMESTAMPTZ,
    last_error_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT source_content_target_check CHECK (
        (movie_id IS NOT NULL AND episode_id IS NULL) OR
        (movie_id IS NULL AND episode_id IS NOT NULL)
    )
);

-- 11. PLAYBACK SESSIONS
CREATE TABLE IF NOT EXISTS public.playback_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
    episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES public.video_providers(id) ON DELETE SET NULL,
    source_id UUID REFERENCES public.video_sources(id) ON DELETE SET NULL,
    provider_session_reference TEXT,
    session_token TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'revoked')),
    ip_address INET,
    user_agent TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '4 hours'),
    ended_at TIMESTAMPTZ
);

-- 12. PLAYBACK EVENTS
CREATE TABLE IF NOT EXISTS public.playback_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.playback_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
    episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('start', 'heartbeat', 'pause', 'seek', 'progress', 'buffer', 'completed', 'error')),
    position_seconds NUMERIC(8,2) DEFAULT 0.0,
    duration_seconds NUMERIC(8,2) DEFAULT 0.0,
    device_category TEXT DEFAULT 'desktop',
    error_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. SITE SETTINGS
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. SAFE TRIGGERS FOR updated_at
DROP TRIGGER IF EXISTS update_viewer_profiles_updated_at ON public.viewer_profiles;
CREATE TRIGGER update_viewer_profiles_updated_at BEFORE UPDATE ON public.viewer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_profiles_updated_at ON public.admin_profiles;
CREATE TRIGGER update_admin_profiles_updated_at BEFORE UPDATE ON public.admin_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_movies_updated_at ON public.movies;
CREATE TRIGGER update_movies_updated_at BEFORE UPDATE ON public.movies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_episodes_updated_at ON public.episodes;
CREATE TRIGGER update_episodes_updated_at BEFORE UPDATE ON public.episodes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_video_providers_updated_at ON public.video_providers;
CREATE TRIGGER update_video_providers_updated_at BEFORE UPDATE ON public.video_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_license_rights_updated_at ON public.license_rights;
CREATE TRIGGER update_license_rights_updated_at BEFORE UPDATE ON public.license_rights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_video_sources_updated_at ON public.video_sources;
CREATE TRIGGER update_video_sources_updated_at BEFORE UPDATE ON public.video_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.viewer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_rights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playback_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playback_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Super Admin full access on all tables
DROP POLICY IF EXISTS admin_all_movies ON public.movies;
CREATE POLICY admin_all_movies ON public.movies FOR ALL TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS admin_all_seasons ON public.seasons;
CREATE POLICY admin_all_seasons ON public.seasons FOR ALL TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS admin_all_episodes ON public.episodes;
CREATE POLICY admin_all_episodes ON public.episodes FOR ALL TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS admin_all_providers ON public.video_providers;
CREATE POLICY admin_all_providers ON public.video_providers FOR ALL TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS admin_all_sources ON public.video_sources;
CREATE POLICY admin_all_sources ON public.video_sources FOR ALL TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS admin_all_licenses ON public.license_rights;
CREATE POLICY admin_all_licenses ON public.license_rights FOR ALL TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS admin_all_viewer_profiles ON public.viewer_profiles;
CREATE POLICY admin_all_viewer_profiles ON public.viewer_profiles FOR ALL TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS admin_all_admin_profiles ON public.admin_profiles;
CREATE POLICY admin_all_admin_profiles ON public.admin_profiles FOR ALL TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS admin_all_playback_sessions ON public.playback_sessions;
CREATE POLICY admin_all_playback_sessions ON public.playback_sessions FOR ALL TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS admin_all_playback_events ON public.playback_events;
CREATE POLICY admin_all_playback_events ON public.playback_events FOR ALL TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS admin_all_audit_logs ON public.audit_logs;
CREATE POLICY admin_all_audit_logs ON public.audit_logs FOR ALL TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS admin_all_site_settings ON public.site_settings;
CREATE POLICY admin_all_site_settings ON public.site_settings FOR ALL TO authenticated USING (public.is_super_admin());

-- Public & Viewer read-only policies
DROP POLICY IF EXISTS public_view_published_movies ON public.movies;
CREATE POLICY public_view_published_movies ON public.movies FOR SELECT TO anon, authenticated
    USING (publication_status = 'published');

DROP POLICY IF EXISTS public_view_published_seasons ON public.seasons;
CREATE POLICY public_view_published_seasons ON public.seasons FOR SELECT TO anon, authenticated
    USING (EXISTS (SELECT 1 FROM public.movies m WHERE m.id = seasons.movie_id AND m.publication_status = 'published'));

DROP POLICY IF EXISTS public_view_published_episodes ON public.episodes;
CREATE POLICY public_view_published_episodes ON public.episodes FOR SELECT TO anon, authenticated
    USING (publication_status = 'published');

DROP POLICY IF EXISTS viewer_view_active_sources ON public.video_sources;
CREATE POLICY viewer_view_active_sources ON public.video_sources FOR SELECT TO authenticated
    USING (
        is_active = TRUE AND
        (expires_at IS NULL OR expires_at > NOW()) AND
        EXISTS (
            SELECT 1 FROM public.license_rights l
            WHERE l.id = video_sources.license_id
            AND l.status = 'approved'
            AND l.streaming_allowed = TRUE
            AND l.valid_from <= NOW()
            AND l.valid_until > NOW()
        )
    );

DROP POLICY IF EXISTS public_view_public_settings ON public.site_settings;
CREATE POLICY public_view_public_settings ON public.site_settings FOR SELECT TO anon, authenticated
    USING (key IN ('site_title', 'announcement_banner', 'maintenance_mode'));

-- ====================================================================
-- PERFORMANCE INDEXES & PUBLIC AVAILABLE CONTENT VIEW
-- ====================================================================

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

-- Secure Public Catalog View (security_barrier = true)
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

GRANT SELECT ON public.public_available_content TO anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.public_available_content FROM anon, authenticated, public;

REVOKE ALL ON public.video_sources FROM anon;
REVOKE ALL ON public.license_rights FROM anon;
REVOKE ALL ON public.admin_profiles FROM anon;
REVOKE ALL ON public.audit_logs FROM anon;
REVOKE ALL ON public.playback_sessions FROM anon;

REVOKE INSERT, UPDATE, DELETE ON public.movies FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.seasons FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.episodes FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.video_providers FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.video_sources FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.license_rights FROM anon;

-- ====================================================================
-- SUPABASE STORAGE: VIDEOS BUCKET (500MB Limit, Private)
-- ====================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'videos',
    'videos',
    false,
    524288000,
    ARRAY['video/mp4', 'video/webm', 'application/x-mpegURL', 'video/MP2T']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 524288000,
    allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'application/x-mpegURL', 'video/MP2T']::text[];

-- Super Admin upload, update, delete, and read policies on storage.objects
DROP POLICY IF EXISTS "admin_upload_videos" ON storage.objects;
CREATE POLICY "admin_upload_videos" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'videos' AND public.is_super_admin());

DROP POLICY IF EXISTS "admin_manage_videos" ON storage.objects;
CREATE POLICY "admin_manage_videos" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'videos' AND public.is_super_admin())
WITH CHECK (bucket_id = 'videos' AND public.is_super_admin());

DROP POLICY IF EXISTS "admin_delete_videos" ON storage.objects;
CREATE POLICY "admin_delete_videos" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'videos' AND public.is_super_admin());

DROP POLICY IF EXISTS "admin_select_videos" ON storage.objects;
CREATE POLICY "admin_select_videos" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'videos' AND public.is_super_admin());

-- ====================================================================
-- SUCCESS VERIFICATION
-- ====================================================================
SELECT 'Flixora v2.0 Master Schema successfully deployed!' AS status;
