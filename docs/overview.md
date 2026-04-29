# Profound — Design Overview

A web app that crawls any website, extracts its structure, generates an `llms.txt` file, and continuously monitors the site for changes.

---

## 1. User Experience

### Core Flow

1. **Submit a URL** — the user pastes a site URL and kicks off a crawl.
2. **Watch progress** — a real-time progress view (SSE, polling every 500 ms) shows pages discovered and crawled.
3. **View on dashboard** — once complete, the site appears on the dashboard with page count, crawl status, and monitoring badge.
4. **Inspect details** — drill into any site to see its page tree, metadata, and the generated `llms.txt`.
5. **Re-crawl** — trigger a manual re-crawl at any time. The site is also **automatically monitored** on a daily schedule (see §4).

### Not Implemented

- **Re-crawl notifications** — no email/webhook alert when a monitored re-crawl detects changes. Useful for production but omitted for simplicity.
- **Configurable re-crawl schedule** — the automatic monitor is hardcoded to **daily** (`0 0 * * *`). The interval column supports `hourly` / `daily` / `weekly`, but there is no UI to change it.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (React 19), Tailwind CSS 4, Framer Motion |
| **API** | Next.js Route Handlers (`src/app/api/`) |
| **Database** | PostgreSQL (Neon on Vercel in production; Docker Postgres for local dev) |
| **Job queue** | pg-boss (backed by the same Postgres) |
| **Monitor scheduling** | pg-boss cron schedules (same Postgres) |

Runtime/hosting: deployed on **Vercel** at `https://project-rfd8u.vercel.app`.

The worker starts inside the Next.js `instrumentation` hook so no separate process is needed in local/dev setup.

---

## 3. Crawling

Crawling is a **BFS over same-origin pages**, driven by a pg-boss job.

```
API  ──send──▶  pg-boss "crawl" queue  ──work──▶  executeCrawl()
```

Inside `executeCrawl`:

1. Fetch `robots.txt` and build allow/disallow rules.
2. Fetch the seed URL, parse it, store the page, and push discovered links into a FIFO `urlQueue` at depth 1.
3. **BFS loop** — shift the next URL off the queue, fetch & parse it, enqueue any new same-origin links at `depth + 1`. Up to **5 pages are fetched concurrently**.
4. Stop when the queue is empty, `maxDepth` (3) or `maxPages` (200) is reached.
5. Generate `llms.txt` from the crawled pages and mark the crawl complete.

---

## 4. Monitoring

After a site's first successful crawl, a **monitor** record is automatically created with a **daily** schedule. pg-boss's built-in cron fires a `monitor-check` job which runs a full re-crawl (same BFS, depth 3, max 200 pages), diffs the pages against the previous crawl via `computeDiff()`, and stores a `monitor_check` row with `has_changes` and a JSONB diff.

The monitor can be paused/resumed or deleted via the API. Changing the interval unschedules the old cron and registers a new one.

---

## 5. Data Model

```
┌────────────┐
│    site     │
├────────────┤
│ id (PK)    │
│ url        │        ┌──────────────┐
│ name       │        │    crawl     │
│ description│        ├──────────────┤        ┌────────────────┐
│ created_at │◄──┐    │ id (PK)      │        │     page       │
│ updated_at │   ├────│ site_id (FK) │        ├────────────────┤
└────────────┘   │    │ status       │◄───┐   │ id (PK)        │
                 │    │ pages_found  │    ├───│ crawl_id (FK)  │
                 │    │ llms_txt     │    │   │ url            │
                 │    │ max_depth    │    │   │ title          │
                 │    │ max_pages    │    │   │ description    │
                 │    │ started_at   │    │   │ content_hash   │
                 │    │ completed_at │    │   │ depth          │
                 │    │ error_message│    │   │ section        │
                 │    └──────────────┘    │   │ importance     │
                 │                        │   │ status_code    │
                 │    ┌──────────────┐    │   │ crawled_at     │
                 │    │   monitor    │    │   └────────────────┘
                 │    ├──────────────┤    │
                 └────│ site_id (FK) │    │
                      │ id (PK)      │    │   ┌─────────────────┐
                      │ active       │◄───┐   │  monitor_check  │
                      │ interval     │    │   ├─────────────────┤
                      │ last_check_at│    ├───│ monitor_id (FK) │
                      │last_change_at│    └───│ crawl_id (FK)   │
                      │ created_at   │        │ id (PK)         │
                      └──────────────┘        │ checked_at      │
                                              │ has_changes     │
                                              │ diff (JSONB)    │
                                              └─────────────────┘
```

- `site 1──* crawl 1──* page`
- `site 1──1 monitor 1──* monitor_check`
- Each `monitor_check` also references the `crawl` it triggered

---

## 6. API Surface

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/crawl` | Start a new crawl |
| GET | `/api/crawl/[id]/progress` | SSE stream of crawl progress |
| GET | `/api/sites` | List all sites with latest crawl & monitor |
| GET | `/api/sites/[id]` | Site detail + crawl + monitor history |
| DELETE | `/api/sites/[id]` | Remove a site and its data |
| POST | `/api/sites/[id]/recrawl` | Trigger a manual re-crawl |
| GET/POST | `/api/monitors` | List or create monitors |
| PATCH/DELETE | `/api/monitors/[id]` | Update interval / toggle active / delete |

---

## 7. Next Steps

Current limitation: the pg-boss worker is started inside the Next.js server process. On Vercel serverless, this is not a stable long-running worker model, so long crawl/monitor jobs may be interrupted or not continuously processed.

To support reliable production crawling, move job execution to a stable worker runtime. Practical options:

1. **Separate worker service (recommended)** — keep Vercel for web/API, run a dedicated Node worker on a persistent host (for example, Fly.io) connected to the same Postgres/pg-boss queues.
2. **Event/queue platform migration** — move background processing to a Kinesis-based solution for more durable queueing and worker scaling.
