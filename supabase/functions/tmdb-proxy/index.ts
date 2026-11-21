// Flixora Edge Function: TMDB Secure Proxy (PRD Section 18 & 22)
// Hides private TMDB API key on the backend and enforces query security limits
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TMDB_BASE = "https://api.themoviedb.org/3";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
};

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    // Only allow GET requests
    if (req.method !== "GET") {
        return new Response(JSON.stringify({ error: "Method not allowed. Only GET is permitted." }), {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    try {
        // Enforce server-side secret injection (BUG-P1-02 Fix)
        const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");
        if (!TMDB_API_KEY) {
            console.error("[TMDB-Proxy] Missing TMDB_API_KEY environment secret.");
            return new Response(JSON.stringify({
                error: "Proxy configuration error: TMDB_API_KEY is not configured on the backend server."
            }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const url = new URL(req.url);
        const endpoint = url.searchParams.get("endpoint");

        if (!endpoint) {
            return new Response(JSON.stringify({ error: "Missing required 'endpoint' parameter" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // Security check: Prevent path traversal or protocol injection
        const cleanEndpoint = decodeURIComponent(endpoint).trim();
        if (cleanEndpoint.includes("..") || cleanEndpoint.includes("//") || cleanEndpoint.includes("\\")) {
            return new Response(JSON.stringify({ error: "Malformed or illegal endpoint path syntax." }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // Whitelist allowed TMDB paths to prevent arbitrary API abuse
        const isAllowed =
            cleanEndpoint.startsWith("/trending/") ||
            cleanEndpoint.startsWith("/movie/") ||
            cleanEndpoint.startsWith("/tv/") ||
            cleanEndpoint.startsWith("/search/") ||
            cleanEndpoint.startsWith("/discover/");

        if (!isAllowed) {
            return new Response(JSON.stringify({ error: "Forbidden: Requested endpoint is not permitted by security policy." }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // Validate query parameter lengths to prevent buffer abuse
        const searchParam = url.searchParams.get("query");
        if (searchParam && searchParam.length > 120) {
            return new Response(JSON.stringify({ error: "Search query exceeds maximum allowed length (120 characters)." }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // Construct safe backend TMDB request
        const queryParams = new URLSearchParams(url.searchParams);
        queryParams.delete("endpoint");
        queryParams.set("api_key", TMDB_API_KEY);

        const targetUrl = `${TMDB_BASE}${cleanEndpoint}?${queryParams.toString()}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second upstream timeout

        const tmdbRes = await fetch(targetUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        const data = await tmdbRes.json();

        return new Response(JSON.stringify(data), {
            status: tmdbRes.status,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=300, s-maxage=300" // 5-minute CDN edge cache
            }
        });
    } catch (err: any) {
        const isTimeout = err.name === "AbortError";
        return new Response(JSON.stringify({
            error: isTimeout ? "Upstream TMDB gateway timeout" : (err.message || "TMDB Proxy Failure")
        }), {
            status: isTimeout ? 504 : 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
