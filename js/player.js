/**
 * FLIXORA VIDEO PLAYER CONTROLLER (PRD v2.0 Section 12)
 * Manages the internal #watch route, provider adapters, error recovery, and teardown.
 */

class PlayerController {
    constructor() {
        this.currentAdapter = null;
        this.activeMedia = null;
        this.registry = new window.FlixoraProviders.ProviderRegistry();
    }

    async initWatchRoute(type, id) {
        const watchView = document.getElementById('watchView');
        const homeView = document.getElementById('homeView');
        const searchView = document.getElementById('searchView');
        const availableView = document.getElementById('availableView');

        if (homeView) homeView.classList.add('hidden');
        if (searchView) searchView.classList.add('hidden');
        if (availableView) availableView.classList.add('hidden');
        if (watchView) watchView.classList.remove('hidden');

        window.scrollTo(0, 0);

        // 1. Fetch Movie/TV metadata for display
        const metadata = await window.movieService.getDetails(type, id);
        this.activeMedia = metadata;

        const title = metadata?.title || metadata?.name || 'Authorized Video';
        const titleEl = document.getElementById('watchMediaTitle');
        const descEl = document.getElementById('watchMetaOverview');
        if (titleEl) titleEl.innerText = title;
        if (descEl) descEl.innerText = metadata?.overview || '';

        // 2. Query Video Availability Service
        const sources = window.videoService.getPlaybackSources(id, type);
        const playerBox = document.getElementById('playerContainer');
        if (!playerBox) return;

        playerBox.innerHTML = '';

        if (!sources || sources.length === 0) {
            // Unavailable / Unlicensed state
            playerBox.innerHTML = `
                <div class="flex flex-col items-center justify-center p-8 text-center text-zinc-400">
                    <div class="w-14 h-14 rounded-full bg-red-950/40 border border-red-800 text-red-400 flex items-center justify-center mb-4">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    </div>
                    <h4 class="text-white text-lg font-bold mb-1">Playback Unavailable</h4>
                    <p class="text-xs text-zinc-500 max-w-sm mb-4">
                        This title is not currently authorized or published for video playback.
                    </p>
                    <button onclick="window.playerController.closeWatch()" class="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition">
                        &larr; Back to Discovery
                    </button>
                </div>
            `;
            return;
        }

        // 3. Initialize Provider Adapter with Fallback support
        this.destroy();

        this.currentAdapter = await this.registry.createPlayerWithFallback(sources, playerBox, {
            onEvent: (evt, data) => this.handleEvent(evt, data)
        });

        if (!this.currentAdapter) {
            this.showError('Unable to establish stream connection with authorized provider.');
        }
    }

    handleEvent(evt, data) {
        console.log(`[Flixora Player] ${evt.toUpperCase()}:`, data);
    }

    showError(msg) {
        const playerBox = document.getElementById('playerContainer');
        if (playerBox) {
            playerBox.innerHTML = `
                <div class="flex flex-col items-center justify-center p-8 text-center text-zinc-400">
                    <p class="text-xs text-red-400 mb-3">${msg}</p>
                    <button onclick="window.playerController.closeWatch()" class="text-xs text-blue-400 hover:underline">
                        Return to Discovery
                    </button>
                </div>
            `;
        }
    }

    /**
     * Memory-safe teardown: stops playback, detaches media, cleans DOM and listeners
     */
    destroy() {
        if (this.currentAdapter) {
            try {
                this.currentAdapter.destroy();
            } catch (e) {
                console.warn('[PlayerController] Error during adapter teardown:', e);
            }
            this.currentAdapter = null;
        }
        const playerBox = document.getElementById('playerContainer');
        if (playerBox) playerBox.innerHTML = '';
        this.activeMedia = null;
    }

    closeWatch() {
        this.destroy();
        const watchView = document.getElementById('watchView');
        const homeView = document.getElementById('homeView');
        if (watchView) watchView.classList.add('hidden');
        if (homeView) homeView.classList.remove('hidden');
        window.location.hash = '';
    }
}

window.playerController = new PlayerController();
