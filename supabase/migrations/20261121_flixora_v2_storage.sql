-- ====================================================================
-- FLIXORA STORAGE & UPLOAD MIGRATION (PRD v2.0 Section 14, 17, 22)
-- Migration: 20261121_flixora_v2_storage.sql
-- Deployment Order: Apply after 20261121_flixora_v2_hardening.sql
-- ====================================================================

-- 1. PROVISION VIDEOS STORAGE BUCKET (IDEMPOTENT)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'videos',
    'videos',
    false,
    524288000, -- 500 MB max file size limit
    ARRAY['video/mp4', 'video/webm', 'application/x-mpegURL', 'video/MP2T']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 524288000,
    allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'application/x-mpegURL', 'video/MP2T']::text[];

-- 2. STORAGE ROW LEVEL SECURITY POLICIES
-- Note: storage.objects already has RLS enabled by Supabase.
-- Super Admin upload, update, delete, and read policies:
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

