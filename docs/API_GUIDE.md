# AgriVault API Reference

**Version:** 0.1.0-rc1  
**Base URL:** `https://<your-deployment>`  
**Related:** [SECURITY.md](./SECURITY.md) · [WORKFLOW_ENGINE.md](./WORKFLOW_ENGINE.md) · [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## Table of contents

1. [Conventions](#conventions)
2. [Authentication](#authentication)
3. [Error handling](#error-handling)
4. [Rate limiting](#rate-limiting)
5. [Data routes](#data-routes)
6. [Workflow routes](#workflow-routes)
7. [Report routes](#report-routes)
8. [Admin routes](#admin-routes)
9. [Utility routes](#utility-routes)
10. [Route summary table](#route-summary-table)

---

## Conventions

### Request headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type: application/json` | POST/PATCH bodies | JSON request bodies |
| `Cookie: sb-<project>-auth-token=...` | Authenticated routes | Supabase session cookie |

### Response headers (all API routes)

| Header | Description |
|--------|-------------|
| `x-request-id` | UUID for log correlation |
| `X-RateLimit-Limit` | Max requests in window (rate-limited routes) |
| `X-RateLimit-Remaining` | Remaining requests |
| `X-RateLimit-Reset` | Unix timestamp when window resets |

### Response formats

**Standard routes** (data, admin, utility):

```json
{ "farmers": [...] }
{ "error": "Authentication required." }
```

**Workflow routes:**

```json
{ "ok": true, "submission": { ... }, "persisted": true }
{ "ok": false, "code": "TRANSITION_DENIED", "message": "..." }
```

---

## Authentication

| Level | Description | Routes |
|-------|-------------|--------|
| **Public** | No session required | `POST /api/demo-inquiry` |
| **Optional** | Enriched if session present | `GET /api/ministry-pilot/summary`, `POST /api/analytics` |
| **Session** | Supabase session required | Data routes, reports index, AI chat, workspace-demo-role |
| **Workflow principal** | Session + profiles row | `/api/ops/workflows/*` |
| **Admin console** | Session + admin role | `/api/admin/*` |
| **None (gap)** | No auth check — see security note | 4 PDF report routes |

---

## Error handling

| HTTP status | Meaning | Example body |
|-------------|---------|-------------|
| `400` | Invalid request body or parameters | `{ "error": "Invalid JSON body." }` |
| `401` | No session | `{ "error": "Authentication required." }` |
| `403` | Insufficient role or scope | `{ "ok": false, "code": "FORBIDDEN", "message": "..." }` |
| `404` | Resource not found | `{ "ok": false, "code": "NOT_FOUND", "message": "..." }` |
| `413` | Body too large | `{ "error": "Request body too large." }` |
| `422` | Invalid workflow transition | `{ "ok": false, "code": "TRANSITION_DENIED", "message": "..." }` |
| `429` | Rate limit exceeded | `{ "error": "Too many requests. Please retry shortly." }` |
| `500` | Server error | `{ "error": "Request could not be processed." }` |

Client responses never include raw Supabase error messages or stack traces.

---

## Rate limiting

| Route | Limit | Window |
|-------|-------|--------|
| `GET /api/farmers` | 120 | 60s |
| `GET /api/registrations` | 120 | 60s |
| `GET /api/production` | 120 | 60s |
| `POST /api/demo-inquiry` | 10 | 60s |
| `POST /api/ai/chat` | 20 | 60s |

See [SECURITY.md#rate-limiting](./SECURITY.md#rate-limiting).

---

## Data routes

### `GET /api/farmers`

**Auth:** Session required  
**Rate limit:** 120/min

**Query parameters:**

| Param | Type | Default | Range |
|-------|------|---------|-------|
| `limit` | integer | 50 | 1–200 |
| `county` | string | — | Filter by county name |

**Example:**

```bash
curl "https://your-app.vercel.app/api/farmers?limit=10&county=Bong" \
  -H "Cookie: <session-cookie>"
```

**Response:**

```json
{
  "farmers": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "full_name": "James Kollie",
      "county": "Bong",
      "district": "Salala",
      "phone": "+231770000001",
      "latitude": 6.42,
      "longitude": -9.43
    }
  ]
}
```

---

### `GET /api/registrations`

**Auth:** Session required  
**Rate limit:** 120/min

**Query parameters:**

| Param | Type | Default | Range |
|-------|------|---------|-------|
| `limit` | integer | 50 | 1–200 |

**Response:**

```json
{
  "registrations": [
    {
      "id": "...",
      "farmer_id": "...",
      "polygon_geojson": { "type": "Feature", "geometry": { "type": "Polygon", "coordinates": [...] } },
      "area_hectares": 1.2,
      "county": "Bong"
    }
  ]
}
```

---

### `GET /api/production`

**Auth:** Session required  
**Rate limit:** 120/min

**Query parameters:**

| Param | Type | Default | Range |
|-------|------|---------|-------|
| `limit` | integer | 50 | 1–500 |
| `season` | string | — | Filter by season (e.g. `2026`) |

**Response:**

```json
{
  "production": [
    {
      "id": "...",
      "farmer_id": "...",
      "season": "2026",
      "yield_kg": 1200,
      "loss_kg": 50,
      "county": "Bong"
    }
  ]
}
```

---

## Workflow routes

See [WORKFLOW_ENGINE.md](./WORKFLOW_ENGINE.md) for full FSM documentation.

### `POST /api/ops/workflows/submission`

**Auth:** Workflow principal

**Create and submit:**

```bash
curl -X POST https://your-app.vercel.app/api/ops/workflows/submission \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{
    "action": "submit",
    "create": {
      "submissionType": "field_inspection",
      "title": "Farm inspection — Salala district",
      "county": "Bong",
      "district": "Salala",
      "metadata": {
        "dedupe_key": "field_inspection:visit-uuid",
        "entity_refs": { "visit_id": "visit-uuid" }
      }
    }
  }'
```

**Approve existing submission:**

```bash
curl -X POST https://your-app.vercel.app/api/ops/workflows/submission \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{
    "action": "approve",
    "submissionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "note": "Verified against field records"
  }'
```

**Request corrections:**

```bash
curl -X POST https://your-app.vercel.app/api/ops/workflows/submission \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{
    "action": "request_corrections",
    "submissionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "note": "National ID photo required"
  }'
```

---

### `GET /api/ops/workflows/submission`

**Auth:** Workflow principal

**Get thread:**

```bash
curl "https://your-app.vercel.app/api/ops/workflows/submission?submissionId=f47ac10b-58cc-4372-a567-0e02b2c3d479" \
  -H "Cookie: <session-cookie>"
```

**List by status:**

```bash
curl "https://your-app.vercel.app/api/ops/workflows/submission?status=dao_review&type=farmer_registration" \
  -H "Cookie: <session-cookie>"
```

---

### `POST /api/ops/workflows/transfer`

**Auth:** Workflow principal + scope

```bash
curl -X POST https://your-app.vercel.app/api/ops/workflows/transfer \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{
    "transferId": "TRF-2026-001",
    "action": "approve",
    "note": "Approved for dispatch to Gbarnga warehouse"
  }'
```

**Actions:** `approve`, `reject`, `dispatch`, `mark_received`, `verify`, `escalate`, `investigate`, `dispute`

**Response:**

```json
{
  "ok": true,
  "order": { "id": "...", "reference_code": "TRF-2026-001", "status": "approved" },
  "persisted": true
}
```

---

### `POST /api/ops/workflows/verification`

**Auth:** Workflow principal + scope

```bash
curl -X POST https://your-app.vercel.app/api/ops/workflows/verification \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{
    "verificationId": "VRF-001",
    "action": "approve",
    "note": "Registration documents verified"
  }'
```

**Actions:** `approve`, `reject`, `escalate`, `revision`, `investigate`

---

## Report routes

### `GET /api/reports`

**Auth:** Session required

**Response:**

```json
{
  "reports": [
    {
      "id": "executive-briefing",
      "title": "Executive Briefing",
      "formats": ["pdf"],
      "endpoint": "/api/reports/executive-briefing"
    },
    {
      "id": "rice",
      "title": "Rice Season Report",
      "formats": ["pdf", "csv"],
      "endpoint": "/api/reports/rice"
    }
  ]
}
```

---

### `GET /api/reports/executive-briefing`

**Auth:** Session required  
**Response:** `application/pdf` binary

```bash
curl "https://your-app.vercel.app/api/reports/executive-briefing" \
  -H "Cookie: <session-cookie>" \
  --output briefing.pdf
```

---

### `POST /api/reports/rice`

**Auth:** None (known gap — add auth before public GA)  
**Response:** PDF or CSV binary

```bash
curl -X POST https://your-app.vercel.app/api/reports/rice \
  -H "Content-Type: application/json" \
  -d '{ "format": "pdf", "county": "Bong", "season": "2026" }' \
  --output rice-report.pdf
```

---

### `POST /api/reports/dds`

**Auth:** None (known gap)  
**Response:** PDF binary (EUDR Due Diligence Statement)

```bash
curl -X POST https://your-app.vercel.app/api/reports/dds \
  -H "Content-Type: application/json" \
  -d '{ "lotId": "LOT-2026-001" }' \
  --output dds.pdf
```

---

### `GET /api/reports/compliance-oversight`

**Auth:** None (known gap)  
**Response:** PDF binary

---

### `GET /api/reports/donor-programme`

**Auth:** None (known gap)  
**Response:** PDF binary

---

## Admin routes

All admin routes require `requireAdminConsole()` — session + admin role.

### `GET /api/admin/users`

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search by name or email |
| `role` | string | Filter by role |
| `active` | boolean | Filter by active status |

**Response:**

```json
{
  "users": [
    {
      "id": "...",
      "email": "officer@example.gov.lr",
      "profile": {
        "full_name": "District Officer",
        "organization_id": "...",
        "county": "Bong",
        "district": "Salala",
        "account_status": "active"
      },
      "role_assignments": [
        { "role": "dao_officer", "is_primary": true }
      ],
      "access_history": []
    }
  ]
}
```

---

### `POST /api/admin/users`

Creates a unique Supabase Auth identity, sends a secure invitation, completes
the linked profile, creates explicit roles, and writes provisioning audit
events. Requires `super_admin`, `admin`, or `ministry_admin`; elevated role
assignment is further restricted. No password or generated link is returned.

```json
{
  "email": "qa.dao@example.org",
  "full_name": "QA DAO Officer",
  "roles": ["dao_officer"],
  "primary_role": "dao_officer",
  "organization_id": "organization-uuid",
  "county": "Bong",
  "district": "Salala",
  "clan_or_field_area": null
}
```

---

### `PATCH /api/admin/users`

```bash
curl -X PATCH https://your-app.vercel.app/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Cookie: <admin-session-cookie>" \
  -d '{
    "userId": "user-uuid",
    "roles": ["dao_officer", "auditor"],
    "primary_role": "dao_officer",
    "organization_id": "organization-uuid",
    "county": "Bong",
    "district": "Salala",
    "is_active": true
  }'
```

---

### `PUT /api/admin/users`

Initiates a secure email action without returning a link:

```json
{ "userId": "user-uuid", "action": "resend_invitation" }
```

`action` is `resend_invitation` or `password_reset`.

---

### `GET /api/admin/organizations`

**Response:** `{ "organizations": [...] }`

---

### `POST /api/admin/organizations`

```json
{
  "name": "Salala Cooperative",
  "type": "cooperative",
  "country": "Liberia",
  "county": "Bong",
  "contact_name": "John Doe",
  "contact_phone": "+231770000002"
}
```

---

### `POST /api/admin/import`

Bulk import with validate or commit mode.

```json
{
  "type": "farmers",
  "mode": "validate",
  "rows": [
    { "full_name": "James Kollie", "county": "Bong", "district": "Salala", "phone": "+231770000001" }
  ]
}
```

| Field | Values |
|-------|--------|
| `type` | `farmers`, `rice`, `lots_movements` |
| `mode` | `validate` (dry run), `import` (commit) |
| Max rows | 2000 |

**Validate response:**

```json
{ "ok": true, "previewCount": 1, "errors": [] }
```

**Import response:**

```json
{ "ok": true, "inserted": 1, "errors": [] }
```

---

### `GET /api/admin/settings`

**Response:** `{ "settings": { "app_name": "AgriVault", "country": "Liberia", ... } }`

---

### `PATCH /api/admin/settings`

```json
{
  "app_name": "AgriVault Liberia",
  "country": "Liberia",
  "theme": "forest",
  "notifications_enabled": true
}
```

---

### `GET /api/admin/content`

**Response:** `{ "content": { "<block_key>": { ... } } }`

---

### `PATCH /api/admin/content`

```json
{
  "homepage_hero": {
    "title": "National Agriculture Operations Platform",
    "subtitle": "Liberia Ministry of Agriculture"
  }
}
```

---

## Utility routes

### `POST /api/demo-inquiry`

**Auth:** Public  
**Rate limit:** 10/min  
**Max body:** 32 KB

```bash
curl -X POST https://your-app.vercel.app/api/demo-inquiry \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Jane Smith",
    "email": "jane@example.org",
    "organization": "Development Partner",
    "phone": "+231770000003",
    "message": "Interested in pilot programme",
    "source": "website"
  }'
```

**Response:** `{ "ok": true }`

---

### `POST /api/analytics`

**Auth:** Optional session  
**Infrastructure:** Optional; operational workflows do not depend on this table
**Max body:** 16 KB (payload max 8 KB)  
**Response:** `204 No Content`

The response includes `X-Agrivault-Analytics-Status`: `stored`, `disabled`, or
`degraded`. A missing `analytics_events` table is an expected `disabled` state
and does not emit repetitive provider-error logs. Unexpected provider failures
remain server-logged and return `degraded`; analytics never blocks user actions.

```bash
curl -X POST https://your-app.vercel.app/api/analytics \
  -H "Content-Type: application/json" \
  -d '{ "event": "page_view", "payload": { "path": "/command-center" } }'
```

---

### `POST /api/ai/chat`

**Auth:** Session required  
**Rate limit:** 20/min  
**Max body:** 256 KB  
**Response:** `text/plain` stream (Anthropic)

```bash
curl -X POST https://your-app.vercel.app/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{
    "messages": [{ "role": "user", "content": "Summarize Bong county KPIs" }],
    "role": "ministry_officer",
    "pathname": "/command-center"
  }'
```

Requires `ANTHROPIC_API_KEY` environment variable.

---

### `GET /api/ministry-pilot/summary`

**Auth:** Optional

**Response:**

```json
{
  "source": "live",
  "counts": { "farmers": 142, "plots": 89, "submissions": 34 },
  "countyMetrics": [...],
  "recentEvents": [...],
  "daoOfficersSample": [...]
}
```

`source` is `"live"` when Supabase data exists, `"canonical"` when falling back to fixtures.

---

### `POST /api/workspace-demo-role`

**Auth:** Session required

Set UI role preview cookie (does not affect server permissions):

```bash
curl -X POST https://your-app.vercel.app/api/workspace-demo-role \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{ "role": "county_agriculture_coordinator" }'
```

**DELETE** clears the cookie.  
**GET** returns `{ "allowed": ["clan_technician", "dao_officer", ...] }`.

---

## Route summary table

| Path | Method | Auth | Rate limit |
|------|--------|------|------------|
| `/api/farmers` | GET | Session | 120/min |
| `/api/registrations` | GET | Session | 120/min |
| `/api/production` | GET | Session | 120/min |
| `/api/demo-inquiry` | POST | Public | 10/min |
| `/api/analytics` | POST | Optional | — |
| `/api/ai/chat` | POST | Session | 20/min |
| `/api/workspace-demo-role` | GET/POST/DELETE | Session | — |
| `/api/ministry-pilot/summary` | GET | Optional | — |
| `/api/ops/workflows/submission` | GET/POST | Workflow | — |
| `/api/ops/workflows/transfer` | POST | Workflow | — |
| `/api/ops/workflows/verification` | POST | Workflow | — |
| `/api/reports` | GET | Session | — |
| `/api/reports/executive-briefing` | GET | Session | — |
| `/api/reports/rice` | POST | **None** | — |
| `/api/reports/dds` | POST | **None** | — |
| `/api/reports/compliance-oversight` | GET | **None** | — |
| `/api/reports/donor-programme` | GET | **None** | — |
| `/api/admin/users` | GET/POST/PATCH/PUT | Provisioning admin | — |
| `/api/admin/organizations` | GET/POST/PATCH | Admin | — |
| `/api/admin/import` | POST | Admin | — |
| `/api/admin/settings` | GET/PATCH | Admin | — |
| `/api/admin/content` | GET/PATCH | Admin | — |

---

## Related documents

| Document | Topic |
|----------|-------|
| [WORKFLOW_ENGINE.md](./WORKFLOW_ENGINE.md) | Workflow FSM and permissions |
| [SECURITY.md](./SECURITY.md) | Auth model and known gaps |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Environment and smoke tests |
