---
name: sql-migrations
description: Create and manage raw SQL database migrations in the migrate/ folder. Use when the user asks to add a migration, change the database schema, add a table, add a column, create an index, or modify the database structure. Also use when asked to roll back, check migration status, or troubleshoot migration issues.
---

# SQL Migrations

## Convention

Migrations live in `migrate/` as numbered subdirectories. Each contains `up.sql` and `down.sql`.

```
migrate/
├── run.sh
├── 0001-initial-schema/
│   ├── up.sql
│   └── down.sql
├── 0002-add-crawl-error-log/
│   ├── up.sql
│   └── down.sql
└── ...
```

## Creating a New Migration

1. **Find the next number**: List `migrate/` to find the highest existing number, then increment by 1. Pad to 4 digits.

2. **Pick a descriptive kebab-case name**: The name should describe what changes, not why.
   - Good: `0002-add-crawl-error-log`, `0003-add-page-content-column`
   - Bad: `0002-fix-bug`, `0003-update`

3. **Create the directory and both files**:

```
migrate/NNNN-name/
├── up.sql     # Apply the change
└── down.sql   # Revert the change exactly
```

4. **Write the up.sql**: Pure SQL, no transactions needed (the runner handles each file atomically). Use `IF NOT EXISTS` / `IF EXISTS` where appropriate for safety.

5. **Write the down.sql**: Must exactly undo up.sql. Drop what was created, remove what was added. Order matters -- drop dependents before parents (foreign keys).

## SQL Style Rules

- Table and column names: **snake_case** (e.g., `site_id`, `created_at`)
- Use `TEXT` for strings (not VARCHAR), `TIMESTAMPTZ` for timestamps, `INTEGER`/`BIGINT` for numbers
- Always set `NOT NULL` unless the column is genuinely optional
- Always add `DEFAULT` values where sensible
- Foreign keys must specify `ON DELETE` behavior (typically `CASCADE`)
- Name indexes as `idx_{table}_{columns}` (e.g., `idx_crawl_site_id`)
- Name constraints explicitly rather than relying on auto-generated names

## Example Migration

**up.sql**:
```sql
ALTER TABLE crawl ADD COLUMN error_message TEXT;
CREATE INDEX idx_crawl_error ON crawl(status) WHERE status = 'failed';
```

**down.sql**:
```sql
DROP INDEX IF EXISTS idx_crawl_error;
ALTER TABLE crawl DROP COLUMN IF EXISTS error_message;
```

## Running Migrations

The runner uses `docker exec` against the `profound-postgres-1` container.

| Command                                          | What it does                      |
| ------------------------------------------------ | --------------------------------- |
| `npm run db:migrate`                             | Apply all pending migrations      |
| `npm run db:migrate:status`                      | Show applied and pending          |
| `npm run db:migrate:down -- 0002-add-something`  | Revert a specific migration       |

## Tracking

Applied migrations are recorded in the `_migration` table (auto-created by `run.sh`). Each row stores the migration folder name and the timestamp it was applied. The runner skips migrations already in this table.

## Gotchas

- **No partial runs**: If `up.sql` fails midway, manually inspect and fix the DB state, then retry.
- **down.sql must be tested**: Always verify the down path works before committing.
- **Never edit an applied migration**: If a migration has been applied (locally or in CI), create a new migration to fix it instead.
- **Destructive changes**: Dropping columns or tables loses data. Add a comment in the migration noting this.
