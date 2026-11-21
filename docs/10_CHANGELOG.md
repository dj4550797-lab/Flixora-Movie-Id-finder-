# Flixora v2.0 — Changelog & Version History

## [v2.0.0] - 2026-11-21

### Major Architecture & Database Upgrades
- Deployed unified master migration `20261121_flixora_complete_one_click.sql`.
- Created secure PostgreSQL view `public_available_content` with `security_barrier = true`.
- Revoked all privileged table access from the `anon` database role.
- Implemented Supabase Realtime synchronization across active viewer browser sessions.
- Added private Supabase Storage `videos` bucket with 500 MB chunked upload capacity.

### UI & Motion Design
- Upgraded theme to cinematic dark blue system (`#070B16`, `#0B1224`, `#101B32`, `#2563EB`, `#3B82F6`, `#22D3EE`).
- Introduced interactive 3D particle cosmos utilizing Three.js with mouse parallax.
- Added 6-second storyboard cinematic splash screen with skip capability.
- Added 3D animated auth gateway with mechanical clamp animations and spring physics logo drop.
- Built dedicated category hubs: `#movies`, `#series`, `#kdrama`, and `#anime`.
- Added official HD trailer player with origin validation and PC/mobile cross-browser compatibility.

### Feature Additions
- **Admin Watch Timers**: Dynamic streaming countdowns (24h, 48h, 7d, 30d, custom, permanent).
- **Auto-Suggestions & Spell Correction**: Levenshtein-distance spelling suggestions for search queries.
- **Top 10 Auto-Ranked Rail**: Styled ranking numbers displaying top-performing movies today.
- **Admin Control Center**: 12 complete functional panes with table pagination, TMDB importer, and diagnostic tools.
