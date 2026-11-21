# Flixora v2.0 — Viewer Discovery & Playback Guide

## 1. Zero Account Requirement (PRD Rule 1 & 2)

Flixora does not require or offer viewer account registration.
- Anonymous visitors can freely search, discover metadata, copy industry IDs, and stream authorized titles immediately.
- No paywalls, no email collection, and no forced logins.

---

## 2. Navigation Architecture

The viewer interface provides clean, dedicated cinematic hubs:

- **Home (`#home`)**: Spotlight auto-trailer hero, Top 10 Today rail, Trending Today, Top K-Dramas, Popular Movies, Popular TV, Anime, Upcoming Releases, and Recently Added titles.
- **Movies (`#movies`)**: Feature films with genre filters (Action, Sci-Fi, Drama, Comedy, Horror) and "Watch Available" quick-filter.
- **Series (`#series`)**: Global television series with subcategory filters.
- **K-Dramas (`#kdrama`)**: Dedicated Korean Drama hub with Romance, Thriller, and Fantasy filters.
- **Anime (`#anime`)**: Dedicated Animation hub with Action, Fantasy, and Sci-Fi filters.
- **Available Videos (`#available`)**: Filterable grid displaying every currently published and licensed stream.

---

## 3. Movie ID Finder Features

Flixora retains all original discovery tools:
- **TMDB ID Display & Copy**: Prominently displayed in details modals with one-click copy.
- **IMDb ID Quick Copy**: Dedicated gold button to copy the canonical IMDb ID (`tt...`).
- **Financial Intelligence**: Budget, Box Office Revenue, and Net Profit/Loss calculations for feature films.
- **Cast & Crew**: High-resolution headshots, director credits, and character names.

---

## 4. Conditional Play Buttons & Watch Timers (Rule 6)

Play buttons only appear when a title has an authorized video source published by the Super Admin:
- **Permanent Availability**: Unlimited streaming access.
- **Limited Run Timers**: Shows live countdown badge (`⏱️ 47h 58m remaining`).
- When a timer expires, playback is cleanly disabled and the title transitions to details-only mode.
