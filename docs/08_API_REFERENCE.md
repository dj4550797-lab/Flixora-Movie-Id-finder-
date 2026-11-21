# Flixora v2.0 — API & Integration Reference

## 1. Database Endpoints (Supabase PostgREST)

### Public Catalog Query
- **Endpoint**: `/rest/v1/public_available_content`
- **Method**: `GET`
- **Headers**:
  ```http
  apikey: <SUPABASE_ANON_KEY>
  Authorization: Bearer <SUPABASE_ANON_KEY>
  ```
- **Query Parameters**:
  - `select=*`
  - `order=published_at.desc`

---

## 2. Serverless Edge Functions

### TMDB API Proxy
- **Endpoint**: `/functions/v1/tmdb-proxy`
- **Method**: `GET`
- **Parameters**:
  - `endpoint`: Target TMDB API path (e.g. `movie/popular`, `search/multi`)
  - `params`: JSON-encoded query parameters.
- **Security**: Validates against directory traversal; injects server-side `TMDB_API_KEY`.

### Playback Authorizer
- **Endpoint**: `/functions/v1/playback-authorize`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "content_id": "uuid-or-tmdb-id",
    "media_type": "movie",
    "source_id": "optional-source-uuid"
  }
  ```
- **Response**: Returns signed playback token, verified stream locator, and expiration metadata.

---

## 3. Realtime Channel Subscriptions

Flixora subscribes to PostgreSQL changes for real-time catalog synchronization:

```javascript
client.channel('public:catalog_sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'movies' }, () => {
        window.dispatchEvent(new CustomEvent('flixora:catalog-updated'));
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'video_sources' }, () => {
        window.dispatchEvent(new CustomEvent('flixora:catalog-updated'));
    })
    .subscribe();
```
