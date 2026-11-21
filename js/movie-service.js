/**
 * FLIXORA MOVIE METADATA SERVICE (PRD v2.0 Section 18 & 19)
 * Security Hardened Implementation (Sprint 2.1 — Fixes BUG-P1-02)
 *
 * Requirements:
 * - Zero exposed private TMDB API keys in client-side code.
 * - All queries routed through secure backend Supabase Edge Function proxy.
 * - Preserves 100% of original Movie ID Finder queries, fields, and calculations.
 * - Adds K-Drama discovery, Top 10 Ranked Movies, and Dedicated Movie/Series search with auto-suggestions & spell correction.
 */

const MOVIE_CONFIG = {
    IMG_BASE: 'https://image.tmdb.org/t/p/w500',
    IMG_ORG: 'https://image.tmdb.org/t/p/original',
    ANIME_GENRE_ID: 16,
    ANIME_ORIGINAL_LANG: 'ja',
    KDRAMA_ORIGINAL_LANG: 'ko'
};

class MovieService {
    constructor() {
        this.proxyUrl = this.resolveProxyUrl();
        // Common title dictionary for instant auto-suggestions & fuzzy spell correction
        this.popularTitles = [
            'Fight Club', 'Interstellar', 'Inception', 'The Dark Knight', 'Pulp Fiction',
            'Squid Game', 'Crash Landing on You', 'All of Us Are Dead', 'The Glory', 'Vincenzo',
            'Demon Slayer', 'Attack on Titan', 'Jujutsu Kaisen', 'One Piece', 'Naruto',
            'Breaking Bad', 'Game of Thrones', 'Stranger Things', 'Wednesday', 'The Last of Us',
            'Avatar: The Way of Water', 'Oppenheimer', 'Barbie', 'Dune: Part Two', 'Spider-Man: Across the Spider-Verse',
            'Gladiator II', 'Deadpool & Wolverine', 'Moana 2', 'Wicked', 'The Batman'
        ];
    }

    /**
     * Resolves the secure Edge Function proxy URL.
     */
    resolveProxyUrl() {
        if (window.FLIXORA_TMDB_PROXY_URL) {
            return window.FLIXORA_TMDB_PROXY_URL;
        }
        if (window.FLIXORA_SUPABASE_URL && window.FLIXORA_SUPABASE_URL !== 'https://your-project.supabase.co') {
            return `${window.FLIXORA_SUPABASE_URL.replace(/\/$/, '')}/functions/v1/tmdb-proxy`;
        }
        return null;
    }

    async fetchAPI(endpoint) {
        try {
            const proxy = this.resolveProxyUrl();
            if (!proxy) {
                console.warn(
                    '[MovieService] Secure TMDB proxy is not configured. Set window.FLIXORA_TMDB_PROXY_URL or window.FLIXORA_SUPABASE_URL to fetch remote TMDB metadata.'
                );
                return null;
            }

            const sep = proxy.includes('?') ? '&' : '?';
            const url = `${proxy}${sep}endpoint=${encodeURIComponent(endpoint)}`;

            const res = await fetch(url);
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                console.warn(`[MovieService] Proxy returned HTTP ${res.status}:`, errData.error || res.statusText);
                return null;
            }

            return await res.json();
        } catch (err) {
            console.error('[MovieService] Fetch error on', endpoint, err);
            return null;
        }
    }

    async getTrending() {
        const data = await this.fetchAPI('/trending/all/day');
        return data?.results || [];
    }

    async getUpcoming() {
        const data = await this.fetchAPI('/movie/upcoming');
        return data?.results || [];
    }

    async getPopularMovies() {
        const data = await this.fetchAPI('/movie/popular');
        return data?.results || [];
    }

    async getPopularTV() {
        const data = await this.fetchAPI('/tv/popular');
        return data?.results || [];
    }

    async getAnime() {
        const data = await this.fetchAPI(`/discover/tv?with_genres=${MOVIE_CONFIG.ANIME_GENRE_ID}&with_original_language=${MOVIE_CONFIG.ANIME_ORIGINAL_LANG}&sort_by=popularity.desc`);
        return data?.results || [];
    }

    async getKDramas() {
        const data = await this.fetchAPI(`/discover/tv?with_original_language=${MOVIE_CONFIG.KDRAMA_ORIGINAL_LANG}&sort_by=popularity.desc`);
        return data?.results || [];
    }

    async getTop10Movies() {
        const trending = await this.fetchAPI('/trending/movie/day');
        const list = trending?.results || [];
        return list.slice(0, 10).map((item, idx) => ({
            ...item,
            rank: idx + 1
        }));
    }

    async searchMulti(query) {
        if (!query || !query.trim()) return [];
        const isNumeric = /^\d+$/.test(query.trim());
        let results = [];

        if (isNumeric) {
            const direct = await this.fetchAPI(`/movie/${query.trim()}`);
            if (direct && direct.id) results.push({ ...direct, media_type: 'movie' });
        }

        const data = await this.fetchAPI(`/search/multi?query=${encodeURIComponent(query.trim())}`);
        if (data && data.results) {
            const filtered = data.results.filter(i => i.media_type === 'movie' || i.media_type === 'tv');
            results = [...results, ...filtered];
        }
        return results;
    }

    async searchMovies(query = '', genreId = null, sortBy = 'popularity.desc') {
        if (query && query.trim()) {
            const data = await this.fetchAPI(`/search/movie?query=${encodeURIComponent(query.trim())}`);
            let list = data?.results || [];
            if (genreId) {
                list = list.filter(m => m.genre_ids && m.genre_ids.includes(Number(genreId)));
            }
            return list;
        }

        let endpoint = `/discover/movie?sort_by=${encodeURIComponent(sortBy)}`;
        if (genreId) endpoint += `&with_genres=${genreId}`;
        const data = await this.fetchAPI(endpoint);
        return data?.results || [];
    }

    async searchSeries(query = '', category = 'all', sortBy = 'popularity.desc') {
        if (query && query.trim()) {
            const data = await this.fetchAPI(`/search/tv?query=${encodeURIComponent(query.trim())}`);
            let list = data?.results || [];
            if (category === 'kdrama') {
                list = list.filter(s => s.original_language === 'ko');
            } else if (category === 'anime') {
                list = list.filter(s => s.original_language === 'ja' || (s.genre_ids && s.genre_ids.includes(16)));
            }
            return list;
        }

        let endpoint = `/discover/tv?sort_by=${encodeURIComponent(sortBy)}`;
        if (category === 'kdrama') {
            endpoint += `&with_original_language=${MOVIE_CONFIG.KDRAMA_ORIGINAL_LANG}`;
        } else if (category === 'anime') {
            endpoint += `&with_genres=${MOVIE_CONFIG.ANIME_GENRE_ID}&with_original_language=${MOVIE_CONFIG.ANIME_ORIGINAL_LANG}`;
        }
        const data = await this.fetchAPI(endpoint);
        return data?.results || [];
    }

    getSuggestions(query) {
        if (!query || query.trim().length < 2) return [];
        const clean = query.trim().toLowerCase();
        return this.popularTitles
            .filter(t => t.toLowerCase().includes(clean))
            .slice(0, 5);
    }

    suggestSpellCorrection(query) {
        if (!query || query.trim().length < 3) return null;
        const clean = query.trim().toLowerCase();
        // Exact match exists
        if (this.popularTitles.some(t => t.toLowerCase() === clean)) return null;

        // Simple Levenshtein distance check for spelling mistake
        let bestMatch = null;
        let lowestDist = 3;

        for (const title of this.popularTitles) {
            const dist = this.levenshtein(clean, title.toLowerCase().slice(0, clean.length + 2));
            if (dist < lowestDist) {
                lowestDist = dist;
                bestMatch = title;
            }
        }
        return bestMatch;
    }

    levenshtein(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }

    async getDetails(type, id) {
        if (!type || !id) return null;
        return await this.fetchAPI(`/${type}/${id}?append_to_response=credits,videos,external_ids`);
    }

    formatCurrency(num) {
        return num > 0 ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num) : 'N/A';
    }

    formatRuntime(mins) {
        return mins ? `${Math.floor(mins / 60)}h ${mins % 60}m` : 'N/A';
    }
}

window.movieService = new MovieService();
