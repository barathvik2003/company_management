# Architecture

## Shape: a modular monolith

Two processes and one database. Not microservices — a company of this size
would pay all the cost of distributed systems (network failures, versioned
contracts, distributed transactions) and get none of the benefit. Modules
inside the API are kept independent enough that one could be split out later if
it ever earns it.

```
apps/api/src/modules/
  auth         users        companies    departments   employees
  audit        health       (phase 2+: sales, targets, customers, projects,
                             finance, notifications, reports, dashboard, ai)
```

## The three-layer rule

1. **Controller** — reads the request, validates it through a DTO, calls one
   service method, returns the result. No `if` statements about business rules.
2. **Service** — all business logic. Owns transactions. Decides what is allowed
   beyond the permission check.
3. **Prisma** — the only thing that talks SQL.

A rule that lives in a controller cannot be reused or unit-tested easily, which
is why they stay thin.

## Request lifecycle

```
request
  → JwtAuthGuard        reads the cookie, verifies the signature
  → SessionService      loads live roles and permissions from the database
  → PermissionsGuard    may this person perform this action at all?
  → ThrottlerGuard      rate limit
  → ValidationPipe      is the body the right shape?
  → Controller → Service
       → ScopeService   which rows may they see?
       → Prisma
  → TransformInterceptor   wraps as { success: true, data }
  → AllExceptionsFilter    wraps failures as { success: false, message, code }
```

Permissions are read from the database on every request rather than from the
token. The cost is one indexed query; the benefit is that revoking someone's
access takes effect immediately instead of whenever their token happens to
expire.

## Why these technology choices

**NestJS** gives dependency injection, guards and pipes out of the box. The
structure it imposes is the point: with nineteen modules planned, a framework
that decides where things go prevents nineteen different conventions.

**Prisma** generates types from the schema, so a renamed column becomes a
compile error rather than a runtime surprise. It also parameterises every
query, which removes SQL injection as a class of bug.

**Next.js App Router** allows server components later for heavy dashboard
pages, while Phase 1 screens stay simple client components.

**PostgreSQL** because the data is deeply relational — an employee has targets
which have sales which belong to customers — and because it handles the
aggregate queries the dashboards will need.

## Calculation rules (fixed now, used from Phase 2)

Derived numbers are never stored. A stored total silently goes wrong the moment
someone edits an underlying record.

```
achievement % = target == 0 ? null : (actual / target) * 100
pending       = max(0, target - actual)      // never negative
profit        = revenue - expenses
profit margin = revenue == 0 ? null : (profit / revenue) * 100
```

`null` means "not calculable", and the UI shows a dash, never a misleading 0%.
