CREATE TABLE site (
  id          TEXT PRIMARY KEY,
  url         TEXT NOT NULL UNIQUE,
  name        TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_site_url ON site(url);

CREATE TABLE crawl (
  id           TEXT PRIMARY KEY,
  site_id      TEXT NOT NULL REFERENCES site(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending',
  pages_found  INTEGER NOT NULL DEFAULT 0,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  llms_txt     TEXT
);

CREATE INDEX idx_crawl_site_id ON crawl(site_id);
CREATE INDEX idx_crawl_status ON crawl(status);

CREATE TABLE page (
  id           TEXT PRIMARY KEY,
  crawl_id     TEXT NOT NULL REFERENCES crawl(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  title        TEXT,
  description  TEXT,
  content_hash TEXT,
  depth        INTEGER NOT NULL DEFAULT 0,
  section      TEXT,
  importance   DOUBLE PRECISION NOT NULL DEFAULT 0,
  status_code  INTEGER,
  crawled_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_page_crawl_id ON page(crawl_id);
CREATE INDEX idx_page_crawl_id_url ON page(crawl_id, url);

CREATE TABLE monitor (
  id             TEXT PRIMARY KEY,
  site_id        TEXT NOT NULL UNIQUE REFERENCES site(id) ON DELETE CASCADE,
  active         BOOLEAN NOT NULL DEFAULT true,
  interval       TEXT NOT NULL DEFAULT 'daily',
  last_check_at  TIMESTAMPTZ,
  last_change_at TIMESTAMPTZ,
  webhook_url    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_monitor_active ON monitor(active);
