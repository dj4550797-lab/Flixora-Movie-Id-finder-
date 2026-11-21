/**
 * FLIXORA VIDEO AVAILABILITY SERVICE (PRD v2.0 Section 8 & 11)
 * Enforces the Conditional Play Button rule:
 * Play appears ONLY after an authorized video source is added, validated and published.
 * 
 * Synchronizes with Supabase public_available_content view and Realtime channels.
 * Supports Admin Watch Timers / Expiration countdowns.
 */

class VideoService {
    constructor() {
        this.STORAGE_KEY = 'flixora_published_videos_v2';
        this.catalog = [];
        this.realtimeChannel = null;
        this.tickerInterval = null;
        this.loadCatalog();
        this.initRemoteSync();
        this.startCountdownTicker();
    }

    loadCatalog() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            try {
                this.catalog = JSON.parse(saved);
            } catch (e) {
                this.catalog = [];
            }
        } else {
            // Initial seed of published & licensed titles (Fight Club, Interstellar)
            this.catalog = [
                {
                    id: 550,
                    media_type: 'movie',
                    title: 'Fight Club',
                    year: '1999',
                    rating: 8.4,
                    genre: 'Drama',
                    poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
                    backdrop_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
                    overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.',
                    published_at: '2026-11-20T10:00:00Z',
                    license_status: 'approved',
                    is_published: true,
                    // 48h watch timer demo
                    available_until: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
                    sources: [
                        { format: 'hls', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', quality: '1080p', priority: 1 }
                    ]
                },
                {
                    id: 157336,
                    media_type: 'movie',
                    title: 'Interstellar',
                    year: '2014',
                    rating: 8.4,
                    genre: 'Sci-Fi',
                    poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
                    backdrop_path: '/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
                    overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.',
                    published_at: '2026-11-21T08:30:00Z',
                    license_status: 'approved',
                    is_published: true,
                    // 72h watch timer demo
                    available_until: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
                    sources: [
                        { format: 'youtube', url: 'zSWdZVtXT7E', quality: '1080p', priority: 1 }
                    ]
                }
            ];
            this.saveCatalog();
        }
    }

    saveCatalog() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.catalog));
    }

    /**
     * Initializes Supabase live catalog synchronization and Realtime subscriptions
     */
    async initRemoteSync() {
        if (!window.flixoraSupabase || !window.flixoraSupabase.isConfigured()) {
            return;
        }

        try {
            await this.refreshRemoteCatalog();

            // Set up Realtime listener on movies table
            const client = window.flixoraSupabase.client;
            if (client && !this.realtimeChannel) {
                this.realtimeChannel = client
                    .channel('public:catalog_sync')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'movies' }, () => {
                        console.log('[VideoService] Realtime update detected on movies table.');
                        this.refreshRemoteCatalog();
                    })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'video_sources' }, () => {
                        console.log('[VideoService] Realtime update detected on video_sources table.');
                        this.refreshRemoteCatalog();
                    })
                    .subscribe();
            }
        } catch (err) {
            console.warn('[VideoService] Remote sync setup error:', err);
        }
    }

    /**
     * Queries the sanitized 'public_available_content' view from Supabase
     */
    async refreshRemoteCatalog() {
        if (!window.flixoraSupabase || !window.flixoraSupabase.isConfigured()) return;

        const remoteData = await window.flixoraSupabase.getPublishedCatalog();
        if (remoteData && Array.isArray(remoteData) && remoteData.length > 0) {
            const mapped = remoteData.map(r => ({
                id: r.tmdb_id || r.content_id,
                content_id: r.content_id,
                media_type: r.media_type || 'movie',
                title: r.title,
                year: (r.release_date || '').split('-')[0] || '2026',
                rating: Number(r.rating) || 8.0,
                genre: Array.isArray(r.genres) && r.genres[0]?.name ? r.genres[0].name : 'Feature',
                poster_path: r.poster_path,
                backdrop_path: r.backdrop_path,
                overview: r.overview,
                published_at: r.published_at,
                available_until: r.available_until || null,
                license_status: 'approved',
                is_published: true,
                sources: [
                    {
                        format: r.format || 'hls',
                        url: '', // Protected; stream url resolved dynamically via playback-authorize
                        source_id: r.source_id,
                        quality: r.quality || '1080p',
                        priority: r.priority || 1
                    }
                ]
            }));

            // Merge with local items
            this.catalog = mapped;
            this.saveCatalog();

            // Dispatch global update event
            window.dispatchEvent(new CustomEvent('flixora:catalog-updated', {
                detail: { catalog: this.catalog }
            }));
        }
    }

    getAllAvailable() {
        this.loadCatalog();
        return this.catalog.filter(v => {
            if (!v.is_published || v.license_status !== 'approved' || !v.sources?.length) return false;
            if (v.available_until && new Date(v.available_until).getTime() < Date.now()) return false;
            return true;
        });
    }

    isAvailable(id, type = 'movie') {
        const item = this.catalog.find(v => Number(v.id) === Number(id) && (!v.media_type || v.media_type === type));
        if (!item) return false;
        if (!item.is_published || item.license_status !== 'approved' || !item.sources?.length) return false;
        // Check if watch timer has expired
        if (item.available_until && new Date(item.available_until).getTime() < Date.now()) {
            return false;
        }
        return true;
    }

    /**
     * Calculates time remaining for limited-time availability
     */
    getTimeRemaining(itemOrId) {
        let item = itemOrId;
        if (typeof itemOrId === 'number' || typeof itemOrId === 'string') {
            item = this.catalog.find(v => Number(v.id) === Number(itemOrId));
        }
        if (!item || !item.available_until) return null;

        const diff = new Date(item.available_until).getTime() - Date.now();
        if (diff <= 0) {
            return { expired: true, text: 'Expired', badgeText: 'Expired' };
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        let badgeText = '';
        if (days > 0) badgeText = `⏱️ ${days}d ${hours}h`;
        else if (hours > 0) badgeText = `⏱️ ${hours}h ${minutes}m`;
        else badgeText = `⏱️ ${minutes}m ${seconds}s`;

        return {
            expired: false,
            days,
            hours,
            minutes,
            seconds,
            badgeText,
            formatted: `${days > 0 ? days + 'd ' : ''}${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
        };
    }

    /**
     * Live ticker that updates all countdown badges every second
     */
    startCountdownTicker() {
        if (this.tickerInterval) clearInterval(this.tickerInterval);
        this.tickerInterval = setInterval(() => {
            const els = document.querySelectorAll('[data-timer-id]');
            els.forEach(el => {
                const id = el.getAttribute('data-timer-id');
                const remaining = this.getTimeRemaining(id);
                if (remaining) {
                    if (remaining.expired) {
                        el.innerText = '⚠️ Expired';
                        el.classList.add('text-red-400');
                    } else {
                        el.innerText = el.hasAttribute('data-timer-full') ? remaining.formatted : remaining.badgeText;
                    }
                }
            });
        }, 1000);
    }

    getPlaybackSources(id, type = 'movie') {
        const item = this.catalog.find(v => Number(v.id) === Number(id) && (!v.media_type || v.media_type === type));
        if (!item || !item.is_published || item.license_status !== 'approved' || !item.sources?.length) {
            return [];
        }
        if (item.available_until && new Date(item.available_until).getTime() < Date.now()) {
            return [];
        }
        return item.sources.sort((a, b) => (a.priority || 1) - (b.priority || 1));
    }

    getPlaybackSource(id, type = 'movie') {
        const sources = this.getPlaybackSources(id, type);
        return sources.length > 0 ? sources[0] : null;
    }

    publishVideo(videoRecord) {
        this.loadCatalog();
        const index = this.catalog.findIndex(v => Number(v.id) === Number(videoRecord.id));
        if (index >= 0) {
            this.catalog[index] = { ...this.catalog[index], ...videoRecord, is_published: true };
        } else {
            this.catalog.unshift({ ...videoRecord, is_published: true });
        }
        this.saveCatalog();

        window.dispatchEvent(new CustomEvent('flixora:catalog-updated', {
            detail: { catalog: this.catalog }
        }));
    }

    unpublishVideo(id) {
        this.loadCatalog();
        const item = this.catalog.find(v => Number(v.id) === Number(id));
        if (item) {
            item.is_published = false;
            this.saveCatalog();

            window.dispatchEvent(new CustomEvent('flixora:catalog-updated', {
                detail: { catalog: this.catalog }
            }));
        }
    }
}

window.videoService = new VideoService();
