# FLIXORA — MOVIE ID FINDER & VIDEO DISCOVERY PLATFORM
## Complete Product Requirements Document

**Version:** 2.0  
**Product:** Flixora Movie ID Finder  
**Frontend Hosting:** GitHub Pages  
**Backend:** Supabase  
**Viewer Entry:** `index.html`  
**Admin Entry:** `Admin.html`  
**Frontend:** HTML5, CSS3, JavaScript  
**Video Playback:** Provider-based player adapters  
**Authentication:** Super Admin only

---

# 1. PRODUCT VISION

Flixora is an upgraded version of the existing Movie ID Finder.

It is NOT intended to become a Netflix clone.

The original movie discovery and ID-finding functionality must remain the foundation of the product.

The new version introduces:
- Better cinematic blue UI.
- Improved page layouts.
- Premium animations.
- Movie and TV discovery.
- A dedicated Available Videos section.
- Admin-managed video uploads and external sources.
- Conditional Play buttons.
- Video playback.
- A separate Super Admin dashboard.
- Supabase database integration.
- Secure video authorization.

The viewer should be able to open the website, discover content and watch available videos without creating an account.

The administrator controls which content becomes available.

# 2. NON-NEGOTIABLE REQUIREMENTS

1. No viewer login page.
2. No viewer registration.
3. No forced account creation.
4. Only one Super Admin account.
5. Admin manages all video availability.
6. Play appears only after a valid video source is added, checked and published.
7. Unavailable titles must never show a fake Play button.
8. The Available Videos page must show all currently published and authorized videos.
9. Existing Movie ID Finder functionality must be preserved.
10. Use a consistent premium blue theme.
11. Animations must have a purpose and must not make the website slow.
12. GitHub Pages hosts the frontend.
13. Supabase handles backend functionality.
14. Never expose private credentials or private video source records.

# 3. WEBSITE STRUCTURE

## Viewer website — index.html

The viewer experience uses one primary HTML entry file.

The internal navigation can use sections or hash-based routes.

Required sections:

1. Splash Screen
2. Home
3. Trending
4. Movies
5. TV Shows
6. Anime
7. Upcoming
8. Available Videos
9. Search Results
10. Movie Details
11. TV Details
12. Video Player
13. About / Information
14. Not Found / Error State

## Admin website — Admin.html

A separate HTML entrypoint.

Required sections:

1. Admin Login
2. Dashboard
3. Movie Management
4. TV and Episode Management
5. Video Management
6. Provider Management
7. License Management
8. Available Videos Preview
9. Playback Analytics
10. Error Logs
11. Audit Logs
12. Settings

# 4. GLOBAL DESIGN SYSTEM

## Visual direction

The viewer side should feel like a premium cinematic discovery platform.

The design should use:
- Deep navy backgrounds.
- Blue gradients.
- Electric blue accents.
- High-quality poster artwork.
- Large cinematic backdrops.
- Clean typography.
- Subtle glass effects where useful.
- Consistent spacing.
- Smooth transitions.
- Clear visual hierarchy.

## Color palette

| Element | Color |
|---|---|
| Main background | #070B16 |
| Secondary background | #0B1224 |
| Card background | #101B32 |
| Primary blue | #2563EB |
| Electric blue | #3B82F6 |
| Light blue | #60A5FA |
| Cyan accent | #22D3EE |
| Main text | #F8FAFC |
| Secondary text | #A8B5CC |
| Success | #34D399 |
| Error | #F87171 |

The entire viewer experience must follow this theme.

Do not use random colors on different pages.

# 5. SPLASH SCREEN — CINEMATIC INTRO

The splash screen is a one-time cinematic introduction, not a permanent loading screen.

**Target duration: approximately 6 seconds.**

## Animation storyboard

### 0.0–0.8 seconds — Background emergence

- Full-screen deep navy background.
- Soft blue light emerges from the center.
- A few subtle particles become visible.
- Background should feel spacious and cinematic.

### 0.8–1.8 seconds — Energy rings

- Two or three thin blue orbit rings form around the center.
- Rings rotate at different speeds.
- Small light particles travel around the rings.
- Use smooth easing rather than aggressive spinning.

### 1.8–2.8 seconds — Logo formation

- Flixora logo appears from small particles.
- Logo elements assemble toward the center.
- A subtle blue light sweep crosses the logo.

### 2.8–3.8 seconds — Wordmark reveal

- FLIXORA text appears below the logo.
- Letters reveal with a subtle depth and opacity transition.
- Avoid excessive bouncing or shaking.

### 3.8–4.8 seconds — Tagline

- Tagline appears underneath.
- A thin scanline/light sweep moves across it.
- Keep text readable.

### 4.8–6.0 seconds — Homepage transition

- Logo scales slightly forward.
- Background light expands.
- Intro transitions smoothly into the homepage hero.

## Splash rules

- Show on first visit.
- Allow Skip.
- Returning users should not be forced to watch the complete intro repeatedly.
- Store the intro completion preference locally.
- Respect reduced-motion preferences.
- Never block the website if animation JavaScript fails.
- Do not display fake percentage loading.

# 6. GLOBAL NAVIGATION

The desktop header contains:

- Flixora logo.
- Home.
- Movies.
- TV Shows.
- Anime.
- Trending.
- Upcoming.
- Available Videos.
- Search icon.

The header should be transparent over the hero and become a solid/translucent navy surface after scrolling.

## Header animation

- Initially appears with a subtle fade.
- Background gains opacity when scrolling.
- Active navigation item receives a blue underline or indicator.
- Hover transitions are short and smooth.

## Mobile navigation

On mobile:
- Logo on the left.
- Search action on the right.
- Compact navigation menu.
- Touch-friendly menu items.
- No desktop-sized navigation squeezed onto a phone.

The Available Videos destination must remain easy to find.

# 7. HOME PAGE

The homepage is the main discovery experience.

## Section 1 — Hero

Large cinematic hero area.

Layout:
- Full-width backdrop image.
- Dark navy gradient overlay.
- Small content category label.
- Large movie title.
- Release year.
- Rating.
- Genre.
- Short overview.
- Details button.
- Optional Watch button.

The Watch button appears only if the content is currently available.

Do not show a Watch button for upcoming or unavailable titles.

### Hero animation

1. Backdrop slowly fades in.
2. Image zooms subtly from approximately 1.04 to 1.0.
3. Dark gradient becomes visible.
4. Title reveals with a short upward fade.
5. Metadata appears in a small stagger.
6. Buttons appear last.

Keep the animation around 1–1.5 seconds.

Do not replay the entire animation every time a user scrolls back.

## Section 2 — Trending Today

Horizontal poster carousel.

Each card contains:
- Poster.
- Title.
- Release year.
- Rating.

No permanent Play button.

Clicking a card opens the details screen.

### Carousel behavior

- Smooth horizontal scrolling.
- Mouse drag where appropriate.
- Touch swipe on mobile.
- Navigation arrows on desktop.
- Lazy-loaded posters.
- No automatic aggressive scrolling.

### Card animation

On hover:
- Poster scales subtly.
- Image receives a small brightness adjustment.
- Card elevates slightly.
- Title remains readable.

No permanent neon border.

No large rotation.

No unnecessary 3D effects.

## Section 3 — Popular Movies

Display popular movie posters.

Same card design and interaction as Trending.

## Section 4 — Popular TV Shows

Display popular TV titles.

Clicking a card opens TV details.

## Section 5 — Anime

Display anime discovered through the original TMDB anime query.

Keep anime separate from general TV discovery.

## Section 6 — Upcoming Releases

Display upcoming titles.

Important:
- No Play button.
- No misleading Available label.
- Show release information.
- Show Details action only.

## Section 7 — Recently Added

Display titles recently published by the administrator.

Only content published by Admin should appear in this section.

Sort by publication date, newest first.

## Section 8 — Available Videos Preview

Display a preview of recently published videos.

Each item must have a clear Available indicator.

Clicking the item opens details.

A single Watch action can appear in this section only when playback is authorized.

## Home page scrolling animation

- Sections reveal with a short fade and slight upward movement.
- Poster rows should not all animate simultaneously.
- Use lazy loading.
- Avoid animation loops while the user is idle.
- Disable expensive effects on low-power mobile devices.

# 8. AVAILABLE VIDEOS PAGE

This is a major new feature.

Users must have a dedicated place to see which titles are currently watchable.

## Page layout

Top:
- Page title: Available Videos.
- Short description.
- Search field.
- Filter controls.

Main content:
- Responsive poster grid.
- Availability indicator.
- Title.
- Release year.
- Rating.
- Content type.
- Optional genre.
- Details interaction.

## Filters

- All.
- Movies.
- TV Shows.
- Anime.
- Genre.
- Recently Added.
- Popular.
- Rating.

## Data rules

Only show titles that satisfy all of the following:

- Source exists.
- Source is active.
- Content is published.
- License is valid.
- Playback is authorized.
- Content is not region-blocked for the current viewer where region restrictions apply.

If a source expires or is disabled, remove the title from Available Videos automatically.

## Empty state

If no videos are available:

- Show a clean empty state.
- Explain that videos will appear here when published.
- Do not show fake cards.

## Page animation

- Page title fades in.
- Filter bar appears.
- Poster grid reveals in short staggered batches.
- Poster images fade in as they load.
- Filter changes use a subtle transition.

# 9. SEARCH PAGE AND SEARCH EXPERIENCE

Preserve the original search functionality.

Search must support:
- Movies.
- TV Shows.
- Anime.
- Multi-search.
- TMDB results.
- Availability status.

## Search interaction

When a user enters a query:

1. Debounce input.
2. Show a small searching indicator.
3. Query the backend TMDB proxy.
4. Display results.
5. Mark available titles correctly.
6. Show useful empty/error states.

## Search result cards

Display:
- Poster.
- Title.
- Year.
- Content type.
- Rating.
- Availability status.

Do not show Play buttons on every search result.

Clicking a card opens details.

## Search animation

- Search panel expands smoothly.
- Results fade in after retrieval.
- Loading skeletons are displayed.
- Old results must not overwrite newer search results when requests finish out of order.

# 10. MOVIE DETAILS PAGE

The details screen should feel cinematic and informative.

## Layout

### Background

- Large movie backdrop.
- Dark navy gradient overlay.
- Smooth image transition when changing titles.

### Main content

Left:
- Movie poster.

Right:
- Title.
- Tagline.
- Release year.
- Rating.
- Runtime.
- Genres.
- Language.
- Overview.
- TMDB ID.
- IMDb ID.
- Production company.
- Budget and revenue where applicable.

### Actions

- Watch Now — only when available.
- Trailer.
- Copy IMDb ID.
- Copy TMDB ID.

Do not show unavailable actions.

### Additional information

- Cast.
- Director.
- Production.
- Trailer.
- Similar titles where supported.

For TV:
- Seasons.
- Episodes.
- Episode details.
- Episode-specific availability.

## Details animation sequence

1. Backdrop fades in.
2. Backdrop zoom settles.
3. Poster slides in from the left.
4. Title fades upward.
5. Metadata appears in short staggered intervals.
6. Overview appears.
7. Actions become interactive.
8. Cast row appears when loaded.

Use one controlled entrance animation.

Do not animate every piece of metadata forever.

# 11. CONDITIONAL PLAY BUTTON SYSTEM

This rule controls all Watch and Play actions.

The frontend must not decide availability using only a local variable.

The backend must provide the verified publication and availability state.

## Expected states

| Admin/source state | Viewer result |
|---|---|
| No video added | No Play |
| Source draft | No Play |
| Source validation failed | No Play |
| Source disabled | No Play |
| License expired | No Play |
| Content unpublished | No Play |
| Valid source and published | Show Watch |
| Playback authorization rejected | Do not start playback |

When Admin adds or uploads a video:

1. Source is saved.
2. Source validation runs.
3. Admin previews the source.
4. Admin confirms license and publication settings.
5. Admin publishes.
6. Viewer catalog refreshes.
7. Watch becomes available.

The viewer must never see an enabled Play button before successful publication.

# 12. VIDEO PLAYER PAGE

Use an internal route such as:

`index.html#watch/MOVIE_ID`

For TV episodes, use the appropriate episode identifier.

## Layout

- Dark player background.
- Video area.
- Title.
- Episode information if applicable.
- Back to details.
- Playback error area.
- Optional related content below the player.

## Player controls

Where supported:
- Play/pause.
- Seek.
- Volume.
- Fullscreen.
- Playback speed.
- Quality selection.
- Subtitles.
- Keyboard shortcuts.
- Mobile touch controls.

## Playback startup flow

1. User clicks Watch.
2. Frontend requests playback authorization.
3. Supabase Edge Function checks content publication.
4. It checks source status.
5. It checks license validity.
6. It checks region restrictions if configured.
7. It creates a playback session.
8. It returns minimum authorized player configuration.
9. The correct provider adapter initializes.
10. Playback begins.

## Player animation

- Player area transitions from dark background into the video.
- Loading indicator appears only while loading.
- Controls fade out after inactivity.
- Controls reappear on interaction.
- Error panel fades in without hiding the full page.
- Retry action remains visible.

## Playback errors

If a source fails:
- Record the error.
- Attempt configured fallback sources.
- Show a useful error if all eligible sources fail.
- Never claim successful playback before the player confirms it.

# 13. ADMIN DASHBOARD — ADMIN.HTML

The Admin dashboard must be visually separate from the viewer website.

Use a professional dark navy and blue SaaS design.

Do not make the admin dashboard look like a movie poster page.

## Admin login

Only one authorized Super Admin.

Login fields:
- Email.
- Password.
- Sign in.

No public registration.

Use Supabase Auth.

Backend authorization must independently verify the admin role.

## Admin navigation

Sidebar:
1. Overview.
2. Movies.
3. TV Shows.
4. Episodes.
5. Video Management.
6. Providers.
7. Licenses.
8. Available Videos.
9. Playback Analytics.
10. Error Logs.
11. Audit Logs.
12. Settings.

## Dashboard overview

Display actual backend data:

- Total catalog titles.
- Published videos.
- Draft videos.
- Unavailable titles.
- Active sources.
- Failed sources.
- Playback sessions.
- Playback errors.

Add:
- Recent published content.
- Recent admin activity.
- Source health overview.

Do not use fake charts or hardcoded statistics.

## Admin dashboard animations

- Sidebar selection transitions.
- Dashboard cards appear with a short stagger.
- Charts animate once when loaded.
- Dialogs fade and scale subtly.
- Tables update smoothly.
- Loading states use skeletons.

Do not add unnecessary 3D effects or continuous background animation.

# 14. ADMIN VIDEO MANAGEMENT

This is the main administrative workflow.

## Video Management page

Display a table containing:

- Content title.
- Content type.
- Provider.
- Source status.
- License status.
- Publication status.
- Date added.
- Actions.

Actions:
- View.
- Edit.
- Validate.
- Preview.
- Publish.
- Unpublish.
- Disable.
- Delete.

## Add Video workflow

### Step 1 — Select content

Search existing TMDB titles.

Select the correct movie, TV show or episode.

### Step 2 — Select source type

Options:
- MP4.
- HLS/M3U8.
- YouTube.
- Vimeo.
- Custom provider.
- Supported DRM provider.
- Private upload.

### Step 3 — Add source

Depending on provider:
- Upload file.
- Enter authorized source URL.
- Enter official provider video identifier.
- Select provider-specific configuration.

### Step 4 — License information

- License reference.
- Start date.
- Expiry date.
- Allowed regions.
- Restrictions.

### Step 5 — Validation

Validate:
- Source format.
- Provider compatibility.
- Reachability where permitted.
- File type and size for uploads.
- License configuration.
- Playback configuration.

### Step 6 — Preview

Admin can preview the video before publishing.

### Step 7 — Publish

Admin explicitly publishes the content.

Only then can it become available to viewers.

## Upload progress

For uploads, display:
- File name.
- File size.
- Upload progress.
- Upload state.
- Success or error.
- Retry action.

Do not fake upload progress.

Use resumable uploads where supported and appropriate.

# 15. PROVIDER MANAGEMENT

Support provider adapters for:

- MP4.
- HLS.
- YouTube.
- Vimeo.
- Custom integrations.
- Official DRM integrations.

Each provider configuration must define:
- Provider name.
- Provider type.
- Enabled/disabled.
- Supported formats.
- Validation method.
- Playback adapter.
- Priority.
- Error handling.

Do not assume all providers support direct URLs, subtitles, quality selection or private playback.

Use official player interfaces and authorized integrations.

# 16. LICENSE MANAGEMENT

Admin must be able to manage content availability.

Fields:
- Content ID.
- Provider/source ID.
- License reference.
- Start date.
- End date.
- Allowed regions.
- Restrictions.
- License status.

If the license expires:
- The source becomes ineligible for playback.
- Watch button disappears.
- Available Videos excludes that title.
- Admin receives an appropriate status indicator.

# 17. SUPABASE BACKEND

Antigravity must connect to the actual Supabase project.

Required services:
- PostgreSQL.
- Supabase Auth.
- Supabase Storage where suitable.
- RLS.
- Edge Functions.

## Suggested tables

1. movies
2. seasons
3. episodes
4. video_providers
5. video_sources
6. license_rights
7. admin_profiles
8. playback_sessions
9. playback_events
10. audit_logs
11. site_settings
12. content_publication

The schema can be normalized or adjusted, but all required functionality must remain.

## Viewer permissions

Anonymous viewers may access safe published catalog metadata.

They must not read:
- Private source locators.
- Provider credentials.
- Admin profiles.
- License secrets.
- Audit logs.
- Private storage metadata.

Viewer playback must go through the playback authorization function.

## Admin permissions

Only the Super Admin can:
- Add/edit/delete sources.
- Upload videos.
- Publish content.
- Change licenses.
- Manage providers.
- Change settings.
- View private logs.

Enforce permissions with RLS and server-side authorization.

# 18. TMDB INTEGRATION

Preserve the original Movie ID Finder functionality.

Required endpoints/features:

- Trending all/day.
- Upcoming movies.
- Popular movies.
- Popular TV.
- Anime discovery.
- Multi-search.
- Movie details.
- TV details.
- Credits.
- External IDs.
- Trailers.

Keep the original IDs and metadata functionality.

Use a server-side TMDB proxy for private credentials.

Do not expose private API keys in frontend source.

# 19. ORIGINAL FUNCTIONALITY PRESERVATION

Do not remove or silently replace existing features.

Preserve:
- Search.
- Trending.
- Upcoming.
- Popular movies.
- Popular TV.
- Anime.
- Details modal or equivalent details experience.
- IMDb ID.
- TMDB ID.
- Copy ID actions.
- Rating.
- Year.
- Runtime.
- Genre.
- Overview.
- Language.
- Production/network.
- Budget/revenue.
- TV seasons and episodes.
- Trailer.
- Cast.
- Director.

Existing features must be tested after redesign.

# 20. MOTION DESIGN RULES

Animations should be intentional.

## Animation duration guidance

| Interaction | Duration |
|---|---:|
| Button hover | 120–180 ms |
| Navigation indicator | 180–250 ms |
| Poster hover | 180–250 ms |
| Modal open | 250–350 ms |
| Section reveal | 300–450 ms |
| Hero transition | 600–1000 ms |
| Splash intro | Approximately 6 seconds |

## Do not implement

- Permanent glowing card borders.
- Continuous movement on every poster.
- Excessive particle effects.
- Repeated full-screen transitions.
- Long loading animations.
- Fake progress bars.
- Unnecessary spinning icons.
- Large hover rotations.
- Animations that prevent immediate clicking.

Animations must not compromise accessibility, performance or mobile responsiveness.

# 21. RESPONSIVE DESIGN

Support:
- Desktop.
- Laptop.
- Tablet.
- Android.
- iPhone.

Viewer:
- Responsive navigation.
- Responsive hero.
- Poster grids.
- Touch carousels.
- Mobile player.
- No horizontal overflow.

Admin:
- Desktop sidebar.
- Mobile drawer.
- Responsive tables.
- Usable forms.
- Responsive dialogs.

# 22. SECURITY

Mandatory requirements:

- No service-role key in frontend.
- No private provider credentials in frontend.
- No hardcoded admin password.
- RLS on sensitive tables.
- Server-side admin role verification.
- Server-side playback authorization.
- Input validation.
- XSS prevention.
- Output sanitization.
- Rate limiting.
- Secure upload validation.
- File size limits.
- Audit logs.
- Signed URLs where supported.
- Safe error messages.

A public MP4/HLS URL cannot be guaranteed secret once a browser plays it. Use private storage, short-lived signed URLs and authorized provider sessions where supported. Do not promise complete protection against screen recording.

# 23. HOSTING AND FILE STRUCTURE

## GitHub Pages

Main viewer file:

`index.html`

Admin entry file:

`Admin.html`

Legacy compatibility file:

`Index.html`

Keep `Index.html` synchronized with `index.html` only if the existing Windows workflow requires it.

GitHub Pages serves the frontend only.

It does not execute:
- Python backend.
- Node backend.
- Supabase Edge Functions.
- Database migrations.
- Background video processing.

## Supabase

Supabase runs:
- Database.
- Authentication.
- Storage.
- RLS.
- Edge Functions.

The Supabase functions must be deployed separately.

## Expected structure

```text
Flixora-Movie-ID-Finder/
│
├── index.html
├── Index.html
├── Admin.html
├── providers.js
│
├── assets/
│   ├── logo/
│   ├── posters/
│   ├── backgrounds/
│   ├── icons/
│   └── fonts/
│
├── css/
│   ├── style.css
│   ├── animations.css
│   └── admin.css
│
├── js/
│   ├── app.js
│   ├── supabase-client.js
│   ├── movie-service.js
│   ├── video-service.js
│   ├── player.js
│   ├── auth.js
│   └── admin.js
│
├── supabase/
│   ├── migrations/
│   └── functions/
│       ├── tmdb-proxy/
│       ├── playback-authorize/
│       └── admin-video-upload/
│
├── PRD.md
├── REVIEW.md
├── DEPLOYMENT_GUIDE.md
└── .env.example
```

# 24. TESTING

## Viewer tests

- Website opens without login.
- Homepage works.
- Navigation works.
- Search works.
- TMDB data loads.
- Details load.
- IMDb copy works.
- TMDB copy works.
- Upcoming titles do not show Play.
- Unavailable titles do not show Play.
- Published videos show Watch.
- Available Videos lists only eligible titles.
- Video player works.
- Mobile layout works.

## Admin tests

- Admin login works.
- Non-admin cannot access protected actions.
- Admin can add a source.
- Admin can upload supported files.
- Admin can validate a source.
- Admin can preview.
- Admin can publish.
- Admin can unpublish.
- Admin can disable a source.
- Admin can edit license details.
- Viewer availability updates after publication.

## Security tests

- Anonymous user cannot access private sources.
- Anonymous user cannot edit content.
- Anonymous user cannot create admin accounts.
- Service-role key is absent from frontend.
- Playback authorization rejects expired licenses.
- Playback authorization rejects unpublished content.
- Private provider credentials are never exposed.

# 25. IMPLEMENTATION ORDER

Phase 1 — Repository inspection and backup.

Phase 2 — Preserve original Movie ID Finder functionality.

Phase 3 — New blue design system and viewer layout.

Phase 4 — Splash animation and page transitions.

Phase 5 — Homepage, discovery and search.

Phase 6 — Details and Available Videos.

Phase 7 — Supabase connection, database and RLS.

Phase 8 — Super Admin authentication and dashboard.

Phase 9 — Video upload and provider management.

Phase 10 — Playback authorization and player.

Phase 11 — Analytics, error handling and audit logs.

Phase 12 — Responsive testing, security testing and deployment.

Do not skip testing to finish faster.

# 26. FINAL ANTIGRAVITY INSTRUCTIONS

First inspect the existing repository and actual source files.

Do not assume that the previously described implementation exists or is complete.

Do not delete original working functionality.

Do not turn Flixora into a generic streaming clone.

Do not create fake data to demonstrate backend integration.

Do not use decorative buttons that do nothing.

Do not show Play before Admin successfully publishes an authorized source.

Do not force viewers to log in.

Do not expose private source URLs or secrets.

Build the actual UI page by page according to this PRD.

Implement the animation storyboard with the specified timing and purpose.

Connect the actual Supabase project, apply migrations, configure RLS and deploy Edge Functions.

If project credentials or access are missing, ask the owner instead of inventing them.

Test the complete workflow:

Admin adds video → validates source → previews → publishes → Available Videos updates → viewer opens details → Watch appears → playback authorization succeeds → video plays.

**DEFINITION OF DONE**

Flixora is complete only when the original Movie ID Finder works, the new blue cinematic viewer experience works, viewers can browse without login, Available Videos reflects real published content, the Super Admin can manage videos, and secure playback works through the actual Supabase backend.

