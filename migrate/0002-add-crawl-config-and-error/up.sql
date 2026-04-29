ALTER TABLE crawl ADD COLUMN max_depth INTEGER NOT NULL DEFAULT 3;
ALTER TABLE crawl ADD COLUMN max_pages INTEGER NOT NULL DEFAULT 200;
ALTER TABLE crawl ADD COLUMN error_message TEXT;

CREATE INDEX idx_crawl_error ON crawl(status) WHERE status = 'failed';

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_site_updated_at
  BEFORE UPDATE ON site
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
