# Security

## Passwords

bcrypt with a work factor of 12, salted per password. Hashes are never selected
into an API response — every query uses an explicit `select` list rather than
excluding fields, so a sensitive column added later cannot leak by accident.

Sign-in always runs a bcrypt comparison, even when the email does not exist, so
response timing does not reveal which emails are registered.

## Tokens

| | Access token | Refresh token |
|---|---|---|
| Format | JWT | 48 random bytes |
| Lifetime | 15 minutes | 7 days |
| Stored | nowhere server-side | SHA-256 hash in `refresh_tokens` |
| Delivery | httpOnly cookie, `SameSite=Strict` | same |

Both live in httpOnly cookies, so page JavaScript cannot read them and an XSS
bug cannot steal the session. `SameSite=Strict` is the CSRF defence: the
browser will not attach the cookies to a request started by another site.

Refresh tokens are single-use. Using one revokes it and issues a new pair, so a
stolen token is useless once the real user's browser has refreshed.

Two switches invalidate sessions immediately: `tokenVersion` on the user (every
existing access token stops validating) and revoking the refresh token rows.
Both fire on password change, role change and deactivation.

## Authorisation

Two questions, answered separately:

1. **May they perform this action?** `PermissionsGuard` checks the required
   permission against the caller's live permission set.
2. **On which rows?** `ScopeService` turns the caller's scope into a Prisma
   `where` fragment — `COMPANY`, `DEPARTMENT` (the departments they manage plus
   their own records), or `OWN`.

The filter is built from the session, never from query parameters, so a manager
cannot widen their view by editing a request. Hidden UI is a convenience, not a
control: every endpoint enforces both checks independently.

Two rules protect the company from lockout: a user cannot remove their own
company-head role or deactivate themselves, and the last active company head
cannot be demoted or suspended.

## Input and output

`ValidationPipe` runs with `whitelist` and `forbidNonWhitelisted`, so unknown
fields are not merely dropped — the request is rejected. Prisma parameterises
every query, and React escapes rendered values, so SQL injection and reflected
XSS are both closed by default rather than by discipline.

## Audit log

Sign-ins, failed sign-ins, sign-outs, password changes, role changes, status
changes and record changes are recorded with actor, entity, IP and user agent.
Metadata passes through a redactor that strips anything whose key looks like a
password, token, secret or API key, at any nesting depth.

Audit writes never break the operation that triggered them — a failed write is
logged and swallowed.

## Secrets

Every secret comes from the environment. The API validates its configuration at
startup and refuses to boot in production if the two JWT secrets are equal, if
either is shorter than 32 characters, or if secure cookies are disabled.

## Still to do (Phase 10)

- Password reset over email
- Optional second factor for company head and admin
- Login attempt lockout per account, not only per IP
- Dependency scanning in CI
