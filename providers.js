/**
 * FLIXORA VIDEO PROVIDER SYSTEM (PRD SECTION 7 & 8)
 * Modular adapters for MP4 Direct, HLS.js, YouTube & Vimeo Official Players
 * Hardened with Memory-Safe Teardown & Multi-Source Fallback Execution
 */

class BasePlayerAdapter {
    constructor(container, options = {}) {
        this.container = container;
        this.options = options;
        this.onEvent = options.onEvent || (() => { });
    }

    async load(source) {
        throw new Error('Adapter must implement load(source)');
    }

    play() { }
    pause() { }
    seek(seconds) { }
    destroy() {
        if (this.container) this.container.innerHTML = '';
    }
}

// 1. Direct MP4 HTML5 Video Adapter
class MP4Adapter extends BasePlayerAdapter {
    async load(source) {
        this.destroy();
        this.video = document.createElement('video');
        this.video.src = source.playbackUrl || source.providerAssetId;
        this.video.className = 'w-full h-full object-contain bg-black';
        this.video.controls = true;
        this.video.autoplay = true;
        this.video.playsInline = true;

        this.video.addEventListener('play', () => this.onEvent('start', { position: this.video.currentTime }));
        this.video.addEventListener('pause', () => this.onEvent('pause', { position: this.video.currentTime }));
        this.video.addEventListener('ended', () => this.onEvent('completed', { position: this.video.currentTime }));
        this.video.addEventListener('error', (e) => this.onEvent('error', { error: 'MP4 playback error' }));

        this.container.appendChild(this.video);
        return true;
    }

    play() { if (this.video) this.video.play(); }
    pause() { if (this.video) this.video.pause(); }
    destroy() {
        if (this.video) {
            this.video.pause();
            this.video.removeAttribute('src');
            this.video.load();
            this.video = null;
        }
        super.destroy();
    }
}

// 2. HLS.js Streaming Adapter (Memory Leak Resistant)
class HLSAdapter extends BasePlayerAdapter {
    async load(source) {
        this.destroy();
        this.video = document.createElement('video');
        this.video.className = 'w-full h-full object-contain bg-black';
        this.video.controls = true;
        this.video.autoplay = true;
        this.video.playsInline = true;

        const streamUrl = source.playbackUrl || source.providerAssetId;

        // Check for HLS.js support
        if (window.Hls && window.Hls.isSupported()) {
            this.hls = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            this.hls.loadSource(streamUrl);
            this.hls.attachMedia(this.video);
            this.hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
                this.video.play().catch(() => { });
            });
            this.hls.on(window.Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    console.warn('[HLSAdapter] Fatal streaming error:', data.type);
                    this.onEvent('error', { error: data.type, details: data });
                }
            });
        } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native Apple HLS (Safari/iOS)
            this.video.src = streamUrl;
        } else {
            this.onEvent('error', { error: 'HLS playback not supported by browser' });
            return false;
        }

        this.video.addEventListener('play', () => this.onEvent('start', { position: this.video.currentTime }));
        this.video.addEventListener('ended', () => this.onEvent('completed', { position: this.video.currentTime }));

        this.container.appendChild(this.video);
        return true;
    }

    destroy() {
        // Halt buffering and detach video element to prevent memory leak
        if (this.hls) {
            try {
                this.hls.stopLoad();
                this.hls.detachMedia();
                this.hls.destroy();
            } catch (e) {
                console.warn('[HLSAdapter] Teardown warning:', e);
            }
            this.hls = null;
        }
        if (this.video) {
            this.video.pause();
            this.video.removeAttribute('src');
            this.video.load();
            this.video = null;
        }
        super.destroy();
    }
}

// 3. YouTube Official Player Adapter
class YouTubeAdapter extends BasePlayerAdapter {
    async load(source) {
        this.destroy();
        const videoId = this.extractYouTubeId(source.playbackUrl || source.providerAssetId);
        if (!videoId) {
            this.onEvent('error', { error: 'Invalid YouTube Video ID' });
            return false;
        }

        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&origin=${window.location.origin}`;
        iframe.className = 'w-full h-full border-0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;

        this.container.appendChild(iframe);
        this.onEvent('start', { position: 0 });
        return true;
    }

    extractYouTubeId(urlOrId) {
        if (!urlOrId) return '';
        if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) return urlOrId;
        const match = urlOrId.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
        return match ? match[1] : '';
    }
}

// 4. Vimeo Official Player Adapter
class VimeoAdapter extends BasePlayerAdapter {
    async load(source) {
        this.destroy();
        const vimeoId = (source.playbackUrl || source.providerAssetId).replace(/[^0-9]/g, '');
        if (!vimeoId) {
            this.onEvent('error', { error: 'Invalid Vimeo Video ID' });
            return false;
        }

        const iframe = document.createElement('iframe');
        iframe.src = `https://player.vimeo.com/video/${vimeoId}?autoplay=1&transparent=0`;
        iframe.className = 'w-full h-full border-0';
        iframe.allow = 'autoplay; fullscreen; picture-in-picture';
        iframe.allowFullscreen = true;

        this.container.appendChild(iframe);
        this.onEvent('start', { position: 0 });
        return true;
    }
}

// Provider Registry and Fallback Manager (PRD Section 7, 8 & 12)
class ProviderRegistry {
    constructor() {
        this.adapters = {
            'mp4_direct': MP4Adapter,
            'mp4': MP4Adapter,
            'hls_stream': HLSAdapter,
            'hls': HLSAdapter,
            'youtube': YouTubeAdapter,
            'embed_youtube': YouTubeAdapter,
            'vimeo': VimeoAdapter,
            'embed_vimeo': VimeoAdapter
        };
    }

    createAdapter(type, container, options = {}) {
        const AdapterClass = this.adapters[type] || MP4Adapter;
        return new AdapterClass(container, options);
    }

    /**
     * Attempts playback using prioritized list of authorized sources.
     * If the primary stream fails, gracefully attempts fallback sources.
     */
    async createPlayerWithFallback(sources, container, options = {}) {
        if (!sources || sources.length === 0) return null;
        const sorted = [...sources].sort((a, b) => (a.priority || 1) - (b.priority || 1));

        for (let i = 0; i < sorted.length; i++) {
            const src = sorted[i];
            const adapter = this.createAdapter(src.format || 'mp4', container, {
                ...options,
                onEvent: (evt, data) => {
                    if (evt === 'error' && i + 1 < sorted.length) {
                        console.warn(`[ProviderRegistry] Source priority ${src.priority || 1} failed. Triggering fallback.`);
                        adapter.destroy();
                        this.createPlayerWithFallback(sorted.slice(i + 1), container, options);
                        return;
                    }
                    if (options.onEvent) options.onEvent(evt, data);
                }
            });

            const loaded = await adapter.load({
                playbackUrl: src.url || src.playback_url || src.playbackUrl,
                providerAssetId: src.url || src.provider_asset_id || src.providerAssetId,
                format: src.format
            });

            if (loaded) return adapter;
            adapter.destroy();
        }
        return null;
    }
}

window.FlixoraProviders = {
    ProviderRegistry,
    MP4Adapter,
    HLSAdapter,
    YouTubeAdapter,
    VimeoAdapter
};
