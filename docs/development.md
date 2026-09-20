# Development

## Day-to-day

```bash
npm run db:up        # PostgreSQL in Docker
npm run dev          # API on :3001, web on :3000
npm run test         # backend tests
npm run typecheck    # both apps
```

`npm run dev`, `npm run build` and `npm run test` all rebuild
`packages/shared` first automatically (via `predev` / `pretest`, and `build`
itself). That package ships TypeScript source, and Node resolves
`@cms/shared` through its compiled `dist/` folder, so if you ever see
`Cannot find module '@cms/shared'`, run `npm run build -w @cms/shared`
directly and restart. A fresh `npm install` also triggers this build through
`postinstall`.

Prisma Studio (`npm run db:studio`) is the fastest way to see what the database
actually contains while you work.

## Adding a backend module

Take `departments` as the template — it shows every piece in the smallest
possible form.

1. Add the models to `prisma/schema.prisma`, then
   `npm run db:migrate -- --name add_<thing>`.
2. Add the permissions to `packages/shared/src/permissions.ts` and grant them in
   `ROLE_MATRIX`. Re-run `npm run db:seed` to push the change into the database.
3. Create `apps/api/src/modules/<thing>/` with `dto/`, a service, a controller
   and a module.
4. Guard each route with `@RequirePermission(...)`, and build list queries
   through `ScopeService.buildWhere(...)`.
5. Register the module in `app.module.ts`.
6. Write tests for the scope behaviour: an employee must not see another
   employee's rows.

## Adding a screen

1. Add the route under `apps/web/src/app/(app)/`.
2. Add it to `nav.ts` with the permission that should reveal it.
3. Fetch through `api()` and `useRequest()`; never call `fetch` directly.
4. Handle all four states — loading, error, empty, and content. `DataTable`
   does this for you.

## Conventions that matter

- **No `any`.** ESLint fails the build on it. If a type is hard, model it.
- **No business logic in components or controllers.** Both are hard to test.
- **Explicit `select` in Prisma queries** rather than fetching whole rows.
- **Multi-table writes go in `prisma.$transaction`.**
- Derived values (achievement %, profit) are calculated on read, never stored.

## When a build error appears

Read it, find the cause, fix the code. Do not reach for `any`, `@ts-ignore`,
`skipLibCheck`, or a dependency upgrade to make a message disappear — those
convert a compile-time error you can see into a runtime error you cannot.
