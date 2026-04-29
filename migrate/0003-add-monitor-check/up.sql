CREATE TABLE monitor_check (
  id          TEXT PRIMARY KEY,
  monitor_id  TEXT NOT NULL REFERENCES monitor(id) ON DELETE CASCADE,
  crawl_id    TEXT REFERENCES crawl(id) ON DELETE SET NULL,
  checked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  has_changes BOOLEAN NOT NULL DEFAULT false,
  diff        JSONB
);

CREATE INDEX idx_monitor_check_monitor_id ON monitor_check(monitor_id);
CREATE INDEX idx_monitor_check_checked_at ON monitor_check(monitor_id, checked_at DESC);
