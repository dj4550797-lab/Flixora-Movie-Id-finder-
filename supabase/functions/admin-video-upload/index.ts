// Flixora Edge Function: Admin Video Upload & Source Creation (PRD v2.0 Section 14)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Verify Super Admin Authorization header
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Missing admin authorization header" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
        if (authErr || !user) {
            return new Response(JSON.stringify({ error: "Invalid admin session" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const { data: adminRecord } = await supabase
            .from("admin_profiles")
            .select("role, is_active")
            .eq("user_id", user.id)
            .single();

        if (!adminRecord || adminRecord.role !== "super_admin" || !adminRecord.is_active) {
            return new Response(JSON.stringify({ error: "Super Admin privileges required" }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // 2. Process Video Source Payload
        const body = await req.json();
        const { movieId, format, playbackUrl, licenseId } = body;

        const { data: source, error: sourceErr } = await supabase
            .from("video_sources")
            .insert({
                movie_id: movieId,
                format: format || "mp4",
                provider_asset_id: playbackUrl,
                playback_url: playbackUrl,
                license_id: licenseId,
                is_active: true
            })
            .select()
            .single();

        if (sourceErr) throw sourceErr;

        return new Response(JSON.stringify({ success: true, source }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
