/**
 * FLIXORA SUPABASE CLIENT (PRD v2.0 Section 17 & 22)
 * Security Hardened Implementation (Sprint 2.1)
 *
 * Anonymous viewer catalog reads route strictly through the sanitized view
 * 'public_available_content' without exposing private video sources or provider secrets.
 */

const rawUrl = window.FLIXORA_SUPABASE_URL || 'https://comxecntwlntgvjbvkjs.supabase.co';
const cleanUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

const SUPABASE_CONFIG = {
    URL: cleanUrl,
    ANON_KEY: window.FLIXORA_SUPABASE_ANON_KEY || 'sb_publishable__5xCvJeJren5zsyR33SkJQ_fYwAZIbX'
};

class FlixoraSupabaseClient {
    constructor() {
        this.client = null;
        this.isMock = true;

        if (window.supabase && SUPABASE_CONFIG.URL !== 'https://your-project.supabase.co') {
            try {
                this.client = window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
                this.isMock = false;
            } catch (err) {
                console.warn('[Flixora Supabase] Initializing in fallback offline mode:', err.message);
            }
        }
    }

    /**
     * Checks whether a live remote Supabase connection is established.
     */
    isConfigured() {
        return !this.isMock && !!this.client;
    }

    /**
     * Fetches published, active, licensed titles available to anonymous viewers.
     * Queries the sanitized 'public_available_content' view (BUG-P0-01 Fix).
     */
    async getPublishedCatalog() {
        if (this.isConfigured()) {
            try {
                const { data, error } = await this.client
                    .from('public_available_content')
                    .select('*')
                    .order('published_at', { ascending: false });

                if (!error && data) return data;
                if (error) console.warn('[Flixora Supabase] View query error:', error.message);
            } catch (e) {
                console.warn('[Flixora Supabase] Remote catalog fetch fallback:', e);
            }
        }
        return null;
    }
}

window.flixoraSupabase = new FlixoraSupabaseClient();
