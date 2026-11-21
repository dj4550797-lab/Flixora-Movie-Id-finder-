# FLIXORA v2.0 — KNOWN LIMITATIONS & PLATFORM CONSTRAINTS

**Document Version:** 1.0  
**Specification Reference:** `PRD.md` (Flixora v2.0 Authoritative Specification)  
**Date:** 2026-11-21  

---

## 1. INFRASTRUCTURE & HOSTING LIMITATIONS

### 1.1 GitHub Pages Static Server Restrictions
- **No Custom Server Headers:** GitHub Pages does not allow custom HTTP response headers (such as `Strict-Transport-Security` or server-set `Content-Security-Policy`).  
  *Mitigation:* A client-side `<meta http-equiv="Content-Security-Policy">` header has been embedded in both `index.html` and `Admin.html` to constrain script, frame, and media origin sources.
- **Client-Side Routing:** Direct deep-linking to sub-paths (e.g. `/watch/550`) on GitHub Pages causes 404s without a custom 404 redirect.  
  *Mitigation:* Flixora uses hash-based internal routing (`#watch/movie/550`, `#available`) which functions reliably on static hosting.

### 1.2 Supabase Free Tier Quotas
- **Storage Bucket Quota:** The Supabase Free Tier provides 1 GB of total storage. A single 4K or high-bitrate 1080p movie file can quickly exceed this limit.  
  *Mitigation:* The upload policy restricts single files to 500 MB. For production feature-length video libraries, an upgraded Supabase Pro plan or external object storage (Cloudflare R2, AWS S3) is recommended.
- **Edge Function Cold Starts:** Supabase Edge Functions on free tiers can experience 500–1200ms cold starts on dormant endpoints.  
  *Mitigation:* 5-minute CDN edge caching (`Cache-Control: public, max-age=300, s-maxage=300`) reduces cold starts for popular discovery queries.

---

## 2. THIRD-PARTY PROVIDER & API LIMITATIONS

### 2.1 TMDB API Rate Limits
- The Movie Database (TMDB) enforces an upstream rate limit of approximately 40 requests per 10 seconds per API key.  
  *Mitigation:* The `tmdb-proxy` Edge Function implements 5-minute cache-control headers, shielding the TMDB upstream from viewer spikes.

### 2.2 YouTube & Vimeo Iframe Embeds
- Third-party embeds (YouTube / Vimeo) run inside sandboxed iframes. While start and pause telemetry are captured via JS API listeners, granular buffer-level telemetry and client-side bitrate adaptation cannot be modified directly.

### 2.3 Browser Video Codec Compatibility
- **HLS (HTTP Live Streaming):** Safari on macOS and iOS natively supports `application/vnd.apple.mpegurl`. Chromium and Firefox rely on `Hls.js` MediaSource Extensions (MSE). Flixora automatically detects and routes between MSE and native video playback.
- **Audio Codecs:** AC3 / E-AC3 (Dolby Digital) audio is not natively decoded by standard web browsers without specialized hardware passthrough. Video files uploaded by the Admin should use standard AAC stereo audio.

---

## 3. ARCHITECTURAL BOUNDARIES BY DESIGN

### 3.1 Single Super Admin Account
- In strict adherence to **PRD Non-Negotiable Rule 4** (*"Only one Super Admin account"*), multi-tenant or multi-admin role hierarchies are deliberately excluded. Only a single verified Super Admin identity in `admin_profiles` can execute management workflows.

### 3.2 Anonymous Viewer Access
- In strict adherence to **PRD Non-Negotiable Rules 1–3**, viewer profiles, watchlists stored in the cloud, and viewer login walls are prohibited. All viewer states (e.g. splash completion, audio volume) reside strictly in client `localStorage`.

---
*Flixora v2.0 Known Limitations documented.*
