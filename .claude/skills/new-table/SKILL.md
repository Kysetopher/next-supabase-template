---
name: new-table
description: Use when adding a database table, column, storage bucket, or any other schema change to this repo — writes a versioned Supabase migration following the profiles RLS pattern, regenerates types, wires account-deletion cleanup, and checks the security advisors. Not for one-off data fixes in a hosted project.
---

# Add a table (or any schema change)

Full rules: docs/PRACTICES.md → *Data and security*. Reference migration:
`supabase/migrations/*_profiles_and_avatars.sql` — copy its shape and comment style.

## 1. Create the migration

```bash
npm run db:new <short_snake_case_name>
```

Never edit an already-applied migration; write a new one.

## 2. Write it — the checklist

- [ ] User-owned rows carry `user_id uuid not null references auth.users (id) on delete cascade` (or use the user id as the primary key for one-row-per-user tables).
- [ ] `alter table ... enable row level security;`
- [ ] One policy **per allowed operation**, `to authenticated`, scoped with `(select auth.uid()) = user_id` (the subselect is evaluated once per query, not per row). Updates need both `using` and `with check`.
- [ ] Grants as narrow as the policies: `revoke all ... from anon, authenticated;` then grant only what users do (`select`, `update (col, col)` for column-level updates). `grant all ... to service_role` only if trusted server code writes it.
- [ ] Length / value `check` constraints on free text and enums.
- [ ] Index every foreign key and every column used in a policy or frequent filter.
- [ ] Functions: `security definer` only when needed, always `set search_path = ''`, fully qualified names, and `revoke all on function ... from public, anon, authenticated`.
- [ ] Storage buckets: private, with `file_size_limit` and `allowed_mime_types`, and per-user folder policies on `(storage.foldername(name))[1] = (select auth.uid())::text`.

## 3. Clean up what doesn't cascade

Rows referencing `auth.users` cascade on account deletion. Anything else doesn't:
storage files (add a `deleteUserFiles(service, "<bucket>", user.id)` call in
`deleteAccount()`, `src/lib/actions/account.ts`), external customers, etc. The
cleanup must block the deletion if it fails.

## 4. Apply to the development project and regenerate types

With the **development** Supabase project linked (`npx supabase link --project-ref <dev-ref>`):

```bash
npm run db:push
npm run db:types
```

`db:types` reads the linked project's schema into `src/lib/supabase/types.ts`.

## 5. Check

- `npm run typecheck` and `npm run build` pass.
- If the Supabase MCP or dashboard is available, run the **security advisors** for the dev project and fix any RLS / search_path warnings for the new objects.
- Read and write the table through `db()` (RLS-scoped) in app code — never `createServiceClient()` for user data.

## 6. Ship

Production only after it's merged: link the production project and run `npm run db:push` there.
