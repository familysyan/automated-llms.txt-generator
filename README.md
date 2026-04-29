# Profound

Next.js app with PostgreSQL (Docker).

## Setup

```bash
npm install
npm run db:start
npm run db:migrate
```

Requires Docker running.

## Development

```bash
npm run dev
```

This starts the DB container, applies any pending migrations, and starts the Next.js dev server.

To start fresh with a clean database, run `npm run db:clean` before `npm run dev`.

## Production server

```bash
npm run build
npm start
```

Runs the Next.js production server. Does not start Docker or run migrations — ensure the DB is already running.

## Database Migrations

Migrations live in `migrate/` as numbered directories, each with `up.sql` and `down.sql`.

```
migrate/
├── 0001-initial-schema/
│   ├── up.sql
│   └── down.sql
└── 0002-add-something/
    ├── up.sql
    └── down.sql
```

Apply all pending migrations:

```bash
npm run db:migrate
```

Check status:

```bash
npm run db:migrate:status
```

Revert a specific migration:

```bash
npm run db:migrate:down -- 0002-add-something
```
