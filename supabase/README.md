# Supabase remediation migrations

The root `schema.sql` remains the pre-migration development snapshot. The incremental files in `migrations/` assume that baseline already exists, as it does in the original TCC environment. Do not push them to an empty project without applying the baseline first.

```powershell
npx supabase init
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push --dry-run --linked
npx supabase db push --linked
npx supabase db lint --linked --fail-on error
npx supabase test db --linked
```

Run `supabase init` only while `supabase/config.toml` is absent. Before pushing, confirm the linked project already contains the tables from `schema.sql` and review any sandbox payment rows or duplicate identifiers called out by the migration's safety checks.

For a fresh local verification database with Docker running, apply the preserved baseline before the incremental migrations:

```powershell
npx supabase init
npx supabase start
npx supabase db query --local --file supabase/schema.sql
npx supabase db push --local
npx supabase db lint --local --fail-on error
npx supabase test db --local
```

For an existing local database that already has the baseline:

```powershell
npx supabase db push --local
npx supabase db lint --local --fail-on error
npx supabase test db --local
```

Never place the service-role key in a `NEXT_PUBLIC_` variable. Deployment is a separate, explicitly authorized operation.
