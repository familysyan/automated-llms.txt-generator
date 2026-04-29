-- Drops unused webhook_url column (webhook feature was never shipped)
ALTER TABLE monitor DROP COLUMN IF EXISTS webhook_url;
