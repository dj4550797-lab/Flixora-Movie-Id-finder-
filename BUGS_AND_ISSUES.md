# FLIXORA v2.0 — BUGS, DEFECTS & ARCHITECTURAL ISSUES LOG

**Auditor:** Senior Software Architect, Security Engineer & QA Lead  
**Specification Target:** `PRD.md` (Flixora v2.0 Authoritative Specification)  
**Last Updated:** 2026-11-21 (Sprint 2.1 Completed)  
**Classification Standard:** P0 (Critical/Blocker), P1 (High), P2 (Medium), P3 (Low/Enhancement)

---

## 1. EXECUTIVE SUMMARY OF DEFECTS

Following the completion of **Sprint 2.1: Critical Security Hardening & Database Foundation**, all P0 critical security blockers and core key leakage risks have been successfully remediated.

```
Total Defects Tracked: 10
  - Resolved in Sprint 2.1: 4 (BUG-P0-01, BUG-P0-02, BUG-P1-01, BUG-P1-02)
  - Remaining Active Defects: 6
      - P1 (High Functional): 1 (BUG-P1-03)
      - P2 (Medium Polish & Leaks): 3 (BUG-P2-01, BUG-P2-02, BUG-P2-03)
      - P3 (Low Optimizations): 2 (BUG-P3-01, BUG-P3-02)
```

---

## 2. SEVERITY P0 — CRITICAL BLOCKERS

### BUG-P0-01: Incompatible RLS Policy for Anonymous Viewers in Database Schema
- **Component:** `supabase/migrations/20261120_flixora_init.sql` (Line 196)
- **Status:** **RESOLVED (Sprint 2.1)**
- **Resolution:**
  Created `supabase/migrations/20261121_flixora_v2_hardening.sql` implementing the sanitized `public_available_content` view with `security_barrier = true`. The view strictly projects public presentation metadata while omitting raw streaming URLs (`playback_url`), asset IDs, and provider configurations. Granted `SELECT` on the view to `anon` and `authenticated`. Revoked direct access on `video_sources`, `license_rights`, `admin_profiles`, and `audit_logs` from `anon`. Verified via `SEC-TEST-01`, `SEC-TEST-02`, `SEC-TEST-03`.

---

### BUG-P0-02: Hardcoded Offline Super Admin Bypass in Production Auth Service
- **Component:** `js/auth.js` (Lines 34–52)
- **Status:** **RESOLVED (Sprint 2.1)**
- **Resolution:**
  Completely eliminated the `password.length >= 6` arbitrary credential bypass in `js/auth.js`. Production environments (e.g. GitHub Pages) now strictly **FAIL CLOSED** when Supabase is disconnected. Super Admin verification requires cryptographic password checking via Supabase Auth plus active role verification in `admin_profiles`. Added session expiration evaluation (`expiresAt`). Local mock testing is isolated strictly to `localhost` and requires deliberate setting of `window.FLIXORA_DEV_MOCK_AUTH === true`. Verified via `SEC-TEST-07`, `SEC-TEST-09`, `SEC-TEST-10`.

---

## 3. SEVERITY P1 — HIGH DEFECTS

### BUG-P1-01: Legacy `viewer_profiles` Table Violates PRD v2.0 Architecture
- **Component:** `supabase/migrations/20261120_flixora_init.sql` (Lines 111–123)
- **Status:** **RESOLVED / DEPRECATION DOCUMENTED (Sprint 2.1)**
- **Resolution:**
  In `supabase/migrations/20261121_flixora_v2_hardening.sql`, added formal deprecation documentation via PostgreSQL comments. Revoked all public data modifications (`INSERT`, `UPDATE`, `DELETE`) from `anon` and `public`. Retained table structure to prevent destructive migration failures on live instances with potential legacy data.

---

### BUG-P1-02: Public Exposure of TMDB Read Access Key in Frontend Bundle
- **Component:** `js/movie-service.js` (Line 4) & `supabase/functions/tmdb-proxy/index.ts`
- **Status:** **RESOLVED (Sprint 2.1)**
- **Resolution:**
  Hardcoded TMDB API key removed from `js/movie-service.js`. All queries route through the backend Supabase Edge Function `tmdb-proxy`. Hardcoded fallback key removed from `supabase/functions/tmdb-proxy/index.ts`, strictly requiring `Deno.env.get("TMDB_API_KEY")`. Added path traversal checks, query length validation, and 5-minute CDN edge caching headers. Verified via `SEC-TEST-11`.

---

### BUG-P1-03: LocalStorage vs Remote Database Catalog Desynchronization
- **Component:** `js/video-service.js` (Lines 15–38) & `js/admin.js`
- **Classification:** Data Consistency / Multi-Client Desynchronization
- **Severity:** **P1**
- **Status:** **ACTIVE — TARGETED FOR SPRINT 2.2**
- **Description:**
  `video-service.js` manages local catalogs via `localStorage`. When an administrator publishes a video, other viewers across separate devices do not see real-time updates without remote Supabase Realtime subscription.
- **Remediation Plan:**
  Implement real-time Supabase remote fetching and channel subscriptions (`supabase.channel('public:public_available_content')`) in Sprint 2.2.

---

## 4. SEVERITY P2 — MEDIUM DEFECTS

### BUG-P2-01: Audio & Stream Resource Leak on Rapid Route Changes in Video Player
- **Component:** `js/player.js` & `providers.js`
- **Severity:** **P2**
- **Status:** **ACTIVE — TARGETED FOR SPRINT 2.2**
- **Remediation:**
  Add route teardown hooks in `app.js` to invoke `FlixoraPlayer.destroy()` when switching routes away from `#watch`.

---

### BUG-P2-02: Missing Mobile Notch & Safe Area Insets for Bottom Dock
- **Component:** `css/style.css` (Line 135)
- **Severity:** **P2**
- **Status:** **ACTIVE — TARGETED FOR SPRINT 2.2**
- **Remediation:**
  Apply `padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));` in `css/style.css`.

---

### BUG-P2-03: Potential Race Condition in TMDB Multi-Section Parallel Fetch
- **Component:** `js/app.js` (`loadDiscoveryContent()`)
- **Severity:** **P2**
- **Status:** **ACTIVE — TARGETED FOR SPRINT 2.2**
- **Remediation:**
  Use `Promise.allSettled` to isolate discovery rail failures.

---

## 5. SEVERITY P3 — LOW DEFECTS & POLISH

### BUG-P3-01: Missing Explicit Content Security Policy (CSP) Meta Tag
- **Component:** `index.html` & `Admin.html`
- **Severity:** **P3**
- **Status:** **ACTIVE — TARGETED FOR SPRINT 2.4 / PHASE 3**

---

### BUG-P3-02: Admin Table Pagination for Large Video Libraries
- **Component:** `js/admin.js`
- **Severity:** **P3**
- **Status:** **ACTIVE — TARGETED FOR SPRINT 2.4 / PHASE 3**

---

## 6. SPRINT 2.1 DEFECT CLOSURE SUMMARY

| Defect ID | Severity | Component | Status | Verified In |
| :--- | :---: | :--- | :---: | :---: |
| **BUG-P0-01** | **P0** | Database RLS & Schema | **RESOLVED** | `SEC-TEST-01`, `02`, `03` |
| **BUG-P0-02** | **P0** | Super Admin Auth Guard | **RESOLVED** | `SEC-TEST-07`, `09`, `10` |
| **BUG-P1-01** | **P1** | Clean Legacy Migration | **RESOLVED** | `SEC-TEST-06` |
| **BUG-P1-02** | **P1** | TMDB Key Proxy Enforcement | **RESOLVED** | `SEC-TEST-11` |

---
*Flixora Defect Log updated post Sprint 2.1.*
