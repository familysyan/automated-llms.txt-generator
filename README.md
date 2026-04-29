# Profound

Next.js app with PostgreSQL (Docker for local development, Neon on Vercel for production).

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

## Deploy

```bash
npm run deploy
```

Runs production migrations against Vercel `DATABASE_URL` and then deploys to Vercel production.

Production URL: https://project-rfd8u.vercel.app

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

Apply all pending migrations to production (remote Postgres via Vercel env):

```bash
npm run db:migrate:remote
```

Check status:

```bash
npm run db:migrate:status
```

Revert a specific migration:

```bash
npm run db:migrate:down -- 0002-add-something
```
