# API reference — Phase 1

Base URL: `http://localhost:3001/api`. All responses use one of two shapes.

```jsonc
// success
{ "success": true, "data": { } }

// failure
{ "success": false, "message": "Unable to create sales target",
  "code": "SALES_TARGET_CREATE_FAILED", "details": { } }
```

Authentication uses two httpOnly cookies, `cms_access` (15 minutes) and
`cms_refresh` (7 days). Browsers send them automatically; scripts may instead
send `Authorization: Bearer <access token>`.

## Error codes

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_FAILED` | 400 | The body failed DTO validation; see `details` |
| `UNAUTHENTICATED` | 401 | No valid session |
| `FORBIDDEN` | 403 | Signed in, but lacks the permission or the row is out of scope |
| `NOT_FOUND` | 404 | No such record in your company |
| `DUPLICATE_RECORD` | 409 | Unique constraint, e.g. email already used |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Logged server-side; no stack trace is returned |

## Auth

| Method | Path | Permission | Notes |
|---|---|---|---|
| POST | `/auth/login` | public | 5 attempts per minute per IP |
| POST | `/auth/refresh` | public | Rotates the refresh token; old one is revoked |
| POST | `/auth/logout` | signed in | Revokes the refresh token |
| GET | `/auth/me` | signed in | Returns the session user with live permissions |
| POST | `/auth/change-password` | signed in | Signs out every device |

## Company

| Method | Path | Permission |
|---|---|---|
| GET | `/company` | `company:read` |
| PATCH | `/company` | `company:update` |

## Departments

| Method | Path | Permission |
|---|---|---|
| GET | `/departments` | `department:read` |
| GET | `/departments/:id` | `department:read` |
| POST | `/departments` | `department:create` |
| PATCH | `/departments/:id` | `department:update` |
| DELETE | `/departments/:id` | `department:delete` — deactivates, never deletes |

## Employees

| Method | Path | Permission |
|---|---|---|
| GET | `/employees` | `employee:read` |
| GET | `/employees/:id` | `employee:read` |
| GET | `/employees/:id/summary` | `employee:read` — profile page payload |
| POST | `/employees` | `employee:create` — creates user + roles + profile in one transaction |
| PATCH | `/employees/:id` | `employee:update` |

## Users

| Method | Path | Permission |
|---|---|---|
| GET | `/users` | `user:read` |
| GET | `/users/:id` | `user:read` |
| PATCH | `/users/:id/roles` | `user:assign-role` |
| PATCH | `/users/:id/status` | `user:update` |

## Audit and health

| Method | Path | Permission |
|---|---|---|
| GET | `/audit-logs` | `audit:read` |
| GET | `/health` | public |

## List query parameters

Every list endpoint accepts `page` (default 1), `pageSize` (default 20, max
100), `search`, `sortBy` and `sortOrder`. `sortBy` is checked against an
allow-list per endpoint, so `?sortBy=passwordHash` is ignored rather than
obeyed. Responses are:

```jsonc
{ "success": true,
  "data": { "items": [], "page": 1, "pageSize": 20, "total": 42, "totalPages": 3 } }
```
