# Company Management & Performance Monitoring System

A single place for a company's management to see what is actually happening:
who is meeting targets, why sales are stuck, which projects slipped, and where
the money went.

The system follows one loop: **monitor → understand → identify the problem →
suggest an action → get approval → act → track the result.** Software never
makes the business decision; it puts the facts and the options in front of the
person who does.

---

## Status

| Phase | Scope | State |
|---|---|---|
| 1 | Foundation: company, departments, users, RBAC, employees, auth, audit, health, seed | **Built** |
| 2 | Sales targets, sales, pending sales and reasons | Not started |
| 3 | Customers, contacts, follow-ups | Not started |
| 4 | Projects, milestones, tasks | Not started |
| 5 | Revenue, expenses, project financials | Not started |
| 6 | Weekly updates, employee and manager dashboards | Not started |
| 7 | Executive dashboard, action centre, reports | Not started |
| 8 | Notifications | Not started |
| 9 | AI analysis layer with approval workflow | Not started |
| 10 | Hardening, deployment, full documentation | Not started |

## Architecture in one picture

```
Browser ── Nginx (TLS) ──┬── Next.js :3000   UI only, never touches the database
                         └── NestJS :3001    all business logic and permissions
                                    └── Prisma ── PostgreSQL :5432 (localhost only)
```

Why the frontend never reaches the database: anything the browser can call, a
user can call directly with their own tools. Every rule — "a manager only sees
their own department" — therefore lives in the API. The UI hides buttons for
tidiness, never for security.

## Prerequisites

- Node.js 20 or newer
- Docker (for the local PostgreSQL container) or a PostgreSQL 16 server
- npm 10 or newer

## Getting started

```bash
# 1. install
npm install

# 2. configure
cp .env.example .env
#    generate two different secrets and paste them into .env
openssl rand -base64 48   # -> JWT_ACCESS_SECRET
openssl rand -base64 48   # -> JWT_REFRESH_SECRET

# 3. start PostgreSQL
npm run db:up

# 4. create the schema and load demo data
npm run db:migrate -- --name init
npm run db:seed

# 5. run both apps
npm run dev
```

The UI is at http://localhost:3000 and the API at http://localhost:3001/api.

### Demo accounts

All use the password `Demo@Pass123`. **Demo data only — never load it into a
production database.** The seed refuses to run when `NODE_ENV=production`.

| Role | Email |
|---|---|
| Company head | head@demo.local |
| Admin | admin@demo.local |
| Manager (Sales) | manager@demo.local |
| Employee | employee@demo.local |
| Finance | finance@demo.local |

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Runs API and web together |
| `npm run build` | Builds shared, API and web |
| `npm run test` | Runs the backend Jest suite |
| `npm run lint` | Lints both apps |
| `npm run typecheck` | Type-checks everything without emitting |
| `npm run db:up` / `db:down` | Starts and stops local PostgreSQL |
| `npm run db:migrate` | Creates and applies a migration |
| `npm run db:seed` | Loads demo data |
| `npm run db:studio` | Opens Prisma Studio to browse the data |
| `npm run db:reset` | Drops, re-migrates and re-seeds (destroys data) |

## Environment variables

See `.env.example`. The API validates its environment at startup and refuses to
boot if anything is missing or unsafe — for example, if the two JWT secrets are
identical in production, or if secure cookies are turned off.

Never commit a real `.env`.

## Documentation

- `docs/architecture.md` — how the pieces fit and why
- `docs/database.md` — the schema, table by table
- `docs/api.md` — every endpoint in Phase 1
- `docs/security.md` — auth, RBAC and the threat model
- `docs/development.md` — how to add a module
- `docs/deployment.md` — RHEL 9 with Docker, Nginx, backups
