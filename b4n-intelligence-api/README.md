# B4N Intelligence API — Cloudflare Worker

A separate analytics/API layer for B4N. It **does not modify Lovable**.

## Architecture

Cloudflare Worker → Lovable's existing Supabase REST API → existing Supabase RLS

The Worker uses the existing **publishable** Supabase key. Protected endpoints also forward the logged-in user's Supabase JWT, so Lovable/Supabase RLS continues to decide what that user may read.

No database password or service-role/secret key is included.

## Immediate endpoints

Public:

- `GET /health`
- `GET /api/v1/public/salon`
- `GET /api/v1/public/services`
- `GET /api/v1/public/menu`
- `GET /api/v1/public/geo`

Authenticated with existing Supabase user JWT:

- `GET /api/v1/intelligence/overview`
- `GET /api/v1/intelligence/revenue`
- `GET /api/v1/intelligence/customers`
- `GET /api/v1/intelligence/rfm`
- `GET /api/v1/intelligence/peak-times`
- `GET /api/v1/intelligence/menu/structure`
- `GET /api/v1/intelligence/menu/combinations`
- `GET /api/v1/intelligence/staff`

Behavior-event dependent endpoints:

- `/api/v1/intelligence/navigation`
- `/api/v1/intelligence/menu/transitions`
- `/api/v1/intelligence/menu/sequences`
- `/api/v1/intelligence/conversion`
- `/api/v1/intelligence/abandonment`
- `/api/v1/intelligence/devices`
- `/api/v1/intelligence/behavior`
- `/api/v1/intelligence/motivation`

Until a Cloudflare D1 behavior store is configured and events are collected, these return `data_status: insufficient_event_data`.

## Deploy

```bash
npm install
npx wrangler login
npm run deploy
```

After deployment test:

```bash
curl https://YOUR-WORKER.workers.dev/health
curl https://YOUR-WORKER.workers.dev/api/v1/public/geo
```

## Authenticated request

From the CRM frontend, after authenticating the admin/staff member through the same Supabase Auth project:

```js
fetch(`${API_BASE}/api/v1/intelligence/overview`, {
  headers: {
    Authorization: `Bearer ${session.access_token}`
  }
})
```

The Worker sends:

- `apikey: <publishable key>`
- `Authorization: Bearer <user JWT>`

to Supabase.

## Optional behavior analytics with Cloudflare D1

Create the database:

```bash
npx wrangler d1 create b4n-behavior-analytics
```

Copy the returned D1 binding into `wrangler.jsonc`, then:

```bash
npx wrangler d1 execute b4n-behavior-analytics --remote --file=sql/behavior_events.sql
npm run deploy
```

The collector becomes:

```http
POST /api/v1/events
Content-Type: application/json
```

Example:

```json
{
  "session_id": "s_123",
  "event_name": "service_viewed",
  "service_id": "uuid",
  "device_type": "mobile",
  "os": "ios",
  "browser": "safari",
  "occurred_at": "2026-08-17T12:00:00Z"
}
```

## Security

- No service-role key.
- No database password.
- No direct PII endpoint.
- Customer endpoint fetches only non-contact analytical fields.
- Protected operational analytics require the existing user's JWT and therefore existing RLS.
- CORS is limited by `ALLOWED_ORIGINS`.
- Event properties are size-limited and event names are allow-listed.

## Important limitation

The current Lovable operational database does not record service views, navigation/backtracking, booking starts that never became bookings, or device context. Therefore true navigation analysis, abandonment, device usage, and behavioral motivation cannot be reconstructed historically. The API reports that limitation explicitly rather than generating false metrics.
