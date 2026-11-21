# Flixora v2.0 — Application Security Architecture

## 1. Principles of Security

1. **Zero Trust Anonymous Tier**: Anonymous users possess strictly read-only access to a single sanitized PostgreSQL view (`public_available_content`).
2. **Fail-Closed Playback**: Video playback cannot occur without verification by the `playback-authorize` Edge Function.
3. **No Private Secrets in Frontend**: Service-role keys and TMDB API keys are never bundled into client-side JavaScript or HTML.
4. **Least Privilege**: The `anon` database role is explicitly revoked from accessing `video_sources`, `license_rights`, `admin_profiles`, `audit_logs`, and `playback_sessions`.

---

## 2. Content Security Policy (CSP)

Flixora implements strict CSP meta tags in both `index.html` and `Admin.html`:

```html
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval';
    media-src 'self' https: blob: data:;
    img-src 'self' https: data: blob:;
    frame-src 'self' https://www.youtube.com https://player.vimeo.com https:;
    connect-src 'self' https: wss:;
">
```

---

## 3. RLS Policies Breakdown

All 12 core tables have Row Level Security enabled:

| Table | `anon` Role | `authenticated` Role | Super Admin Access |
|-------|-------------|----------------------|--------------------|
| `movies` | SELECT (`publication_status = 'published'`) | SELECT | ALL (via `public.is_super_admin()`) |
| `video_sources` | **NO ACCESS (REVOKED)** | SELECT (active & licensed only) | ALL |
| `license_rights` | **NO ACCESS (REVOKED)** | NO ACCESS | ALL |
| `admin_profiles` | **NO ACCESS (REVOKED)** | NO ACCESS | ALL |
| `playback_sessions`| **NO ACCESS (REVOKED)** | SELECT / INSERT own | ALL |
| `audit_logs` | **NO ACCESS (REVOKED)** | NO ACCESS | ALL |
| `site_settings` | SELECT (whitelisted keys only) | SELECT | ALL |

---

## 4. Edge Functions Security Model

- **`tmdb-proxy`**: Validates request parameters, strips path traversal tokens (`..`), injects the private `TMDB_API_KEY` from Supabase Secrets, and caches responses.
- **`playback-authorize`**: Evaluates license validity, origin domain, and geographical territory before returning a temporary signed playback session token.
- **`admin-video-upload`**: Enforces `public.is_super_admin()` checks before granting upload tokens to Supabase Storage.
