# Supabase Migrations

This repo now uses `supabase/migrations` as the deployable source of truth for remote schema changes.

## Local usage

Create a new migration:

```powershell
npm run supabase:new -- your_change_name
```

Apply pending migrations to the linked Supabase project:

```powershell
npm run supabase:push
```

## GitHub Actions setup

Add these repository secrets before the workflow can deploy:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`

The workflow in `.github/workflows/supabase-db-push.yml` runs automatically on pushes to `main`
when files under `supabase/migrations/` change, and it can also be run manually from the Actions tab.

## Notes

- `supabase/schema.sql` remains a readable schema snapshot.
- New production changes should be added as timestamped files in `supabase/migrations/`.
