// Flixora Edge Function: Playback Authorize (PRD v2.0 Section 11, 12, 17, 22)
// Cryptographic gatekeeper: Strictly authorizes playback sessions for valid licensed content
// Never reveals raw streaming URLs or provider assets prior to explicit validation
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
    // 1. CORS Preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    // 2. HTTP Method Guard
    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed. Only POST is permitted." }), {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error("[PlaybackAuthorize] Missing backend Supabase credentials in Edge Function environment.");
            return new Response(JSON.stringify({
                authorized: false,
                error: "Authorization service configuration error."
            }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const body = await req.json().catch(() => ({}));
        const { movieId, episodeId, userToken } = body;

        // Content target is mandatory
        if (!movieId && !episodeId) {
            return new Response(JSON.stringify({
                authorized: false,
                error: "Missing required content identifier (movieId or episodeId)."
            }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // Optional User Session check (Super Admin or authenticated tester)
        let userId: string | null = null;
        if (userToken) {
            const { data: { user }, error: authErr } = await supabase.auth.getUser(userToken);
            if (!authErr && user) {
                userId = user.id;
            }
        }

        // 3. Query Active, Validated, Licensed Video Sources (Ordered by Priority)
        const nowIso = new Date().toISOString();
        let query = supabase
            .from("video_sources")
            .select(`
                id, provider_id, format, provider_asset_id, playback_url, quality, priority, is_active,
                video_providers!inner(name, provider_type, status),
                license_rights!inner(status, streaming_allowed, valid_from, valid_until, allowed_regions, blocked_regions)
            `)
            .eq("is_active", true)
            .eq("video_providers.status", "active")
            .eq("license_rights.status", "approved")
            .eq("license_rights.streaming_allowed", true)
            .lte("license_rights.valid_from", nowIso)
            .gt("license_rights.valid_until", nowIso)
            .order("priority", { ascending: true });

        if (movieId) query = query.eq("movie_id", movieId);
        if (episodeId) query = query.eq("episode_id", episodeId);

        const { data: sources, error: sourceErr } = await query;

        // 4. Fail Closed: Zero Data Leaks on Authorization Failure
        if (sourceErr || !sources || sources.length === 0) {
            return new Response(JSON.stringify({
                authorized: false,
                reason: "No active authorized playback license available for this title."
            }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const selectedSource: any = sources[0];

        // 5. Generate Short-Lived Playback Session Token
        const sessionToken = crypto.randomUUID();
        const { data: session } = await supabase
            .from("playback_sessions")
            .insert({
                user_id: userId,
                movie_id: movieId || null,
                episode_id: episodeId || null,
                provider_id: selectedSource.provider_id,
                source_id: selectedSource.id,
                session_token: sessionToken,
                status: "active"
            })
            .select()
            .single();

        // 6. Return Authorized Stream Metadata (No private credentials or internal license records)
        return new Response(JSON.stringify({
            authorized: true,
            sessionId: session?.id || sessionToken,
            sessionToken: sessionToken,
            providerType: selectedSource.video_providers.provider_type,
            format: selectedSource.format,
            quality: selectedSource.quality,
            playbackUrl: selectedSource.playback_url || selectedSource.provider_asset_id,
            expiresInSeconds: 14400 // 4 hours
        }), {
            status: 200,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
                "Cache-Control": "no-store, private" // Playback tokens must never be cached
            }
        });
    } catch (err: any) {
        console.error("[PlaybackAuthorize] Uncaught authorization exception:", err);
        return new Response(JSON.stringify({
            authorized: false,
            error: "Playback authorization service failure."
        }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
