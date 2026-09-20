# Database

PostgreSQL 16, accessed only through Prisma. Schema: `prisma/schema.prisma`.

## Conventions

- Primary keys are UUIDs. They can be generated without a round trip, they do
  not leak how many records exist, and they make a future multi-company merge
  possible.
- Every table has `createdAt` and `updatedAt`. Business tables also carry
  `companyId`, and most carry `createdById` / `updatedById`.
- Table names are snake_case and plural, mapped with `@@map`.
- Statuses are enums, so the database itself rejects a typo.
- Money and derived figures are calculated, not stored.

## Phase 1 tables

| Table | Holds | Notes |
|---|---|---|
| `companies` | Tenant root | Every business row hangs off this |
| `departments` | Sales, Engineering, Finance… | `managerId` drives DEPARTMENT scope |
| `roles` | The five system roles | |
| `permissions` | `resource:action` catalogue | All phases seeded up front |
| `role_permissions` | Which role holds which permission, at which scope | |
| `user_roles` | Many-to-many user ↔ role | |
| `users` | Login identity | `passwordHash` is never selected by any API |
| `refresh_tokens` | Hashed refresh tokens | Rotated on every use |
| `employee_profiles` | HR data | One-to-one with `users` |
| `audit_logs` | Who did what | Secrets redacted before write |
| `system_settings` | Per-company key/value | |

## Why users and employee profiles are separate

They change for different reasons and are read by different people. Login
concerns (password, token version, account status) are security data; HR
concerns (employee code, designation, joining date) are business data. Keeping
them apart means an HR screen never has to select a row containing a password
hash.

## Indexes

Every foreign key is indexed, plus the combinations the app actually queries:
`(companyId, status)` on users and departments, `(companyId, departmentId)` on
employee profiles, and `(companyId, createdAt)` on audit logs for the reverse
chronological list.

## Migrations

```bash
npm run db:migrate -- --name add_sales_tables   # development
npm run db:deploy                                # production, applies only
```

Never edit an applied migration. Write a new one.
