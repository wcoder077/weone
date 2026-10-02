# Database backups

`.github/workflows/db-backup.yml` dumps the Supabase database every Sunday (and on
demand: Actions → Database backup → Run workflow). The dump is encrypted with
`BACKUP_PASSPHRASE` and kept as a workflow artifact for 90 days. It never goes into git.

Contents: `roles.sql`, `schema.sql`, `data.sql` (all tables incl. `auth.users`).
Not included: Storage files (images, videos) — only their metadata rows.

Weekly, not daily: every dump downloads the whole database and counts toward
Supabase egress.

## Secrets (GitHub → Settings → Secrets and variables → Actions)
- `SUPABASE_DB_URL`: Supabase → Connect → **Session pooler** URI, with the database password filled in.
- `BACKUP_PASSPHRASE`: a long random passphrase. Keep a copy outside GitHub; without it the backups cannot be opened.

## Restore
1. Download the artifact zip from the workflow run and unzip it.
2. `gpg -d weone-db-YYYY-MM-DD.tar.gz.gpg > backup.tar.gz && tar -xzf backup.tar.gz`
3. Into a new or empty project (Session pooler URI of the target):
   ```
   psql --single-transaction --variable ON_ERROR_STOP=1 \
     --file backup/roles.sql --file backup/schema.sql \
     --command 'SET session_replication_role = replica' \
     --file backup/data.sql --dbname "$TARGET_DB_URL"
   ```
Never restore over the live database without a fresh backup first.
