DROP TRIGGER IF EXISTS trg_site_updated_at ON site;
DROP FUNCTION IF EXISTS update_updated_at();
DROP INDEX IF EXISTS idx_crawl_error;
ALTER TABLE crawl DROP COLUMN IF EXISTS error_message;
ALTER TABLE crawl DROP COLUMN IF EXISTS max_pages;
ALTER TABLE crawl DROP COLUMN IF EXISTS max_depth;
