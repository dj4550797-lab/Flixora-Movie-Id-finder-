# FLIXORA v2.0 — PHASE 2 EXECUTION & HARDENING PLAN

**Document Version:** 2.0  
**Target Milestone:** Phase 2 Production Readiness & Backend Integration  
**Lead Architect:** Senior Software Architect, Security Engineer & QA Lead  
**Specification Reference:** `PRD.md` (Flixora v2.0 Authoritative Specification)  
**Last Updated:** 2026-11-21 (Sprint 2.1 Completed)  

---

## 1. PHASE 2 GOALS & PROGRESS

Phase 2 focuses on transitioning Flixora from a local modular baseline to an end-to-end hardened production platform.

```
Phase 2 Sprint Progress:
┌───────────────────────────────┐     ┌───────────────────────────┐     ┌───────────────────────────┐
│  Sprint 2.1: DB & RLS         │ ──> │ Sprint 2.2: Live Catalog  │ ──> │ Sprint 2.3: Storage &     │
│  Hardening (COMPLETED)        │     │ & Sync Channels (NEXT)    │     │ Resumable Upload          │
└───────────────────────────────┘     └───────────────────────────┘     └───────────────────────────┘
                                                                                      │
                                                                                      ▼
                                                                        ┌───────────────────────────┐
                                                                        │ Sprint 2.4: E2E Testing & │
                                                                        │ CI Deployment             │
                                                                        └───────────────────────────┘
```

---

## 2. SPRINT STATUS BREAKDOWN

### ✅ SPRINT 2.1: CRITICAL SECURITY HARDENING & DATABASE FOUNDATION (COMPLETED)
- **Status:** **100% COMPLETE & VERIFIED**
- **Executed Tasks:**
  - Created `supabase/migrations/20261121_flixora_v2_hardening.sql` with sanitized `public_available_content` view (`security_barrier = true`).
  - Granted `SELECT` on view to `anon`; revoked raw table access to `video_sources`, `license_rights`, `admin_profiles`, `audit_logs`.
  - Added composite indexes for catalog query performance.
  - Hardened `js/auth.js`: Removed arbitrary password bypass; enforced server-side verification and fail-closed error handling.
  - Hardened `js/movie-service.js`: Removed private TMDB API key; routed queries through `supabase/functions/tmdb-proxy`.
  - Hardened `supabase/functions/tmdb-proxy/index.ts`: Removed fallback keys; added path traversal protection and query length validation.
  - Hardened `supabase/functions/playback-authorize/index.ts`: Zero private stream data leaks on authorization failure.
  - Created automated test runner `tests/security_sprint21.test.js`: Verified all 12 tests passed (`12/12 PASS`).

---

### ⏳ SPRINT 2.2: REMOTE CATALOG SYNCHRONIZATION & WORKSPACE POLISH (NEXT SPRINT)
- **Target Objectives:**
  1. **Resolve BUG-P1-03 (Remote Catalog Real-Time Sync):**
     - Wire `video-service.js` to subscribe to Supabase Realtime postgres changes on `public_available_content`.
     - Automatically update viewer catalog rows when Admin publishes or revokes titles across different devices.
  2. **Resolve BUG-P2-01 (Player Teardown on Route Change):**
     - In `js/app.js`, attach route teardown hooks ensuring `FlixoraPlayer.destroy()` is called whenever navigating away from `#watch`.
  3. **Resolve BUG-P2-02 (Mobile Safe-Area Insets):**
     - Update `css/style.css` to add `env(safe-area-inset-bottom)` to the mobile bottom dock for modern smartphones.
  4. **Resolve BUG-P2-03 (Discovery Parallel Fetch Resilience):**
     - Refactor `loadDiscoveryData()` in `js/app.js` to use `Promise.allSettled`, isolating rail failures and rendering retry controls.

---

### ⏳ SPRINT 2.3: VIDEO STORAGE & RESUMABLE UPLOADS
- **Target Objectives:**
  1. Define and deploy Supabase Storage `videos` bucket with RLS policies.
  2. Integrate `@supabase/storage-js` TUS resumable uploader in Step 3 of the Admin 7-Step Wizard.
  3. Support upload progress bars and network interruption resumption.

---

### ⏳ SPRINT 2.4: AUTOMATED E2E TESTING & GITHUB PAGES DEPLOYMENT
- **Target Objectives:**
  1. Implement Playwright E2E test suite (`tests/e2e.spec.js`) covering anonymous discovery, Conditional Play, and Admin workflow.
  2. Implement Content Security Policy (CSP) meta tags in `index.html` and `Admin.html` (`BUG-P3-01`).
  3. Final verification on GitHub Pages deployment.

---
*Flixora Phase 2 execution roadmap updated post Sprint 2.1.*
