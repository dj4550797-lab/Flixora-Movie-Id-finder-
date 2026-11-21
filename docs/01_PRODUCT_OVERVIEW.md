# Flixora v2.0 — Product Overview

**Version:** 2.0  
**Status:** Production Ready  
**Frontend:** GitHub Pages (Static HTML5 / CSS3 / Vanilla JS)  
**Backend:** Supabase (PostgreSQL · Auth · Storage · Edge Functions)

---

## 1. What Is Flixora?

Flixora is a **premium cinematic movie and TV discovery platform** built on top of the original Movie ID Finder. It allows anyone to browse trending titles, search the TMDB catalog, look up TMDB and IMDb IDs, and watch Admin-published videos — all without creating an account.

It is **not** a Netflix clone. The original Movie ID Finder functionality remains the foundation. The v2.0 upgrade adds a polished UI, Available Videos section, secure video management, and a Super Admin control center.

---

## 2. What Flixora Is

| Capability | Description |
|---|---|
| Movie & TV Discovery | Browse trending, popular movies, TV shows, anime, and upcoming releases via TMDB |
| Movie ID Finder | Look up TMDB ID and IMDb ID for any title; copy to clipboard |
| Available Videos Catalog | Viewer-facing listing of Admin-published, authorized videos |
| Video Playback | Watch available videos through provider-specific player adapters |
| Conditional Play | Play button appears **only** after Admin validates, licenses, and publishes a source |
| Admin Dashboard | Full Super Admin control over catalog, sources, licenses, and publishing |
| Anonymous Viewing | Zero login friction — viewers browse and watch with no account |
| Secure Backend | Supabase RLS, Edge Functions, and Auth protect all private data |

---

## 3. What Flixora Is Not

- ❌ Not a user-registration platform (no viewer sign-up)
- ❌ Not a Netflix or Plex clone
- ❌ Not a piracy tool — sources are Admin-controlled and licensed
- ❌ Not a server-side rendered app — GitHub Pages serves static files only
- ❌ Not a multi-admin system — exactly one Super Admin account exists

---

## 4. Product Vision

> "Open the website, discover content, and watch — no friction, no account."

Flixora extends the proven Movie ID Finder with a cinematic blue experience. Discovery is instant via TMDB, and playback is conditional on proper Admin authorization. The admin controls everything; the viewer enjoys everything the admin has approved.

---

## 5. Key Features

### 5.1 Original Movie ID Finder (Preserved)
- Search movies and TV by keyword
- View TMDB ID and IMDb ID on the details screen
- One-click copy of TMDB ID or IMDb ID to clipboard
- Full metadata: rating, runtime, genres, language, production, budget, revenue
- TV seasons and episode listing
- Trailer playback
- Cast and director credits

### 5.2 Cinematic Discovery Experience
- 6-second splash screen with particle and ring animation
- Transparent sticky header with scroll-aware opacity
- Hero section with cinematic backdrop, gradient, and staggered reveal
- Horizontal poster carousels: Trending, Popular Movies, Popular TV, Anime, Upcoming, Recently Added
- Smooth section-reveal scroll animations

### 5.3 Available Videos Catalog
- Dedicated page listing all currently authorized and published videos
- Filters: All, Movies, TV Shows, Anime, Genre, Recently Added, Popular, Rating
- Availability indicator on each card
- Real-time updates via Supabase Realtime

### 5.4 Video Playback
- Multi-provider player adapters: MP4 Direct, HLS.js (Safari native fallback), YouTube, Vimeo, Custom
- Playback authorization via Supabase Edge Function
- Fallback source chain on error
- Playback session and event tracking

### 5.5 Conditional Play Button System
| State | Viewer Experience |
|---|---|
| No video added | No Play button |
| Source in draft | No Play button |
| Validation failed | No Play button |
| Source disabled | No Play button |
| License expired | No Play button |
| Content unpublished | No Play button |
| Valid source + published | ✅ Watch Now visible |
| Authorization rejected at runtime | Playback does not start |

### 5.6 Super Admin Dashboard
- Separate entry point: `Admin.html`
- Supabase Auth login (email + password)
- 12 dashboard sections
- 7-step Add Video Wizard
- Video, provider, and license management
- Playback analytics, error logs, and audit logs
- Watch Availability Timers

### 5.7 Three.js Cosmos Animation
- Background starfield animation on selected pages
- Performant WebGL canvas
- Respects `prefers-reduced-motion`

### 5.8 Spell Correction & Auto-Suggestions
- Search auto-suggests titles as the user types
- Basic spell correction for common misspellings
- Debounced input to minimize TMDB proxy calls

---

## 6. Website Structure

### 6.1 Viewer App — `index.html`

| # | Section | Description |
|---|---|---|
| 1 | Splash Screen | 6-second cinematic intro, skippable, stored in localStorage |
| 2 | Home | Hero + 8 content rails |
| 3 | Trending | TMDB trending all/day |
| 4 | Movies | Popular + hub page |
| 5 | TV Shows | Popular TV + hub page |
| 6 | Anime | TMDB anime query results |
| 7 | Upcoming | Upcoming releases (no Play) |
| 8 | Available Videos | Admin-published authorized catalog |
| 9 | Search Results | Multi-search with availability status |
| 10 | Movie Details | Full metadata + conditional Watch |
| 11 | TV Details | Seasons, episodes, conditional Watch |
| 12 | Video Player | `#watch/MOVIE_ID` route |
| 13 | About / Info | Platform information |
| 14 | Error / Not Found | Clean error state |

### 6.2 Admin Control Center — `Admin.html`

| # | Section |
|---|---|
| 1 | Admin Login |
| 2 | Dashboard Overview |
| 3 | Movie Management |
| 4 | TV & Episode Management |
| 5 | Video Management |
| 6 | Provider Management |
| 7 | License Management |
| 8 | Available Videos Preview |
| 9 | Playback Analytics |
| 10 | Error Logs |
| 11 | Audit Logs |
| 12 | Settings |

---

## 7. Target Audience

| Audience | Role |
|---|---|
| **Casual Viewer** | Browses movies, discovers content, looks up IDs, watches available videos — no account needed |
| **Researcher / Developer** | Uses Movie ID Finder to retrieve TMDB and IMDb IDs for integration work |
| **Super Admin** | Manages the entire catalog, uploads/links video sources, controls availability |

---

## 8. Design Language

| Token | Value | Use |
|---|---|---|
| Main background | `#070B16` | Page backgrounds |
| Secondary background | `#0B1224` | Sections, sidebars |
| Card background | `#101B32` | Content cards |
| Primary blue | `#2563EB` | Buttons, active states |
| Electric blue | `#3B82F6` | Hover, accents |
| Cyan accent | `#22D3EE` | Highlights, indicators |
| Main text | `#F8FAFC` | Headings, body |
| Secondary text | `#A8B5CC` | Metadata, captions |
| Success | `#34D399` | Available indicator |
| Error | `#F87171` | Error states |

---

## 9. Non-Negotiable Requirements

1. No viewer login page
2. No viewer registration
3. No forced account creation
4. Only one Super Admin account
5. Admin manages all video availability
6. Play appears only after a valid, validated, published source exists
7. Unavailable titles never show a fake Play button
8. Available Videos shows only currently authorized titles
9. Original Movie ID Finder functionality is preserved
10. Consistent premium blue theme across all pages
11. Purposeful animations — no performance-degrading effects
12. GitHub Pages hosts the frontend
13. Supabase handles all backend functionality
14. Private credentials and private source records are never exposed
