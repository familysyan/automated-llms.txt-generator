import { query } from "@/lib/db";
import { getBoss } from "@/lib/boss";
import { QUEUES, type MonitorCheckPayload } from "@/lib/jobs/queues";
import { executeCrawl } from "@/lib/crawler";
import { computeDiff } from "./diff";
import { sendWebhook } from "./notifier";

const CRON_MAP: Record<string, string> = {
  hourly: "0 * * * *",
  daily: "0 0 * * *",
  weekly: "0 0 * * 0",
};

export async function scheduleMonitor(monitor: {
  id: string;
  siteId: string;
  interval: string;
  siteUrl: string;
}) {
  const boss = await getBoss();
  const cron = CRON_MAP[monitor.interval];
  if (!cron) return;

  await boss.schedule(
    QUEUES.MONITOR_CHECK,
    cron,
    {
      monitorId: monitor.id,
      siteId: monitor.siteId,
      url: monitor.siteUrl,
    } satisfies MonitorCheckPayload,
    { key: monitor.id }
  );
}

export async function updateMonitorSchedule(monitor: {
  id: string;
  siteId: string;
  interval: string;
  active: boolean;
  siteUrl: string;
}) {
  const boss = await getBoss();
  await boss.unschedule(QUEUES.MONITOR_CHECK, monitor.id);

  if (monitor.active) {
    await scheduleMonitor(monitor);
  }
}

export async function removeMonitorSchedule(monitorId: string) {
  const boss = await getBoss();
  await boss.unschedule(QUEUES.MONITOR_CHECK, monitorId);
}

export async function executeMonitorCheck(payload: MonitorCheckPayload) {
  const { monitorId, siteId, url } = payload;

  const { rows: monitorRows } = await query<{ id: string; active: boolean; webhook_url: string | null }>(
    "SELECT id, active, webhook_url FROM monitor WHERE id = $1",
    [monitorId]
  );
  const monitor = monitorRows[0];
  if (!monitor || !monitor.active) return;

  const { rows: prevCrawlRows } = await query<{ id: string }>(
    `SELECT id FROM crawl
     WHERE site_id = $1 AND status = 'completed'
     ORDER BY completed_at DESC LIMIT 1`,
    [siteId]
  );
  const previousCrawlId = prevCrawlRows[0]?.id ?? null;

  let previousPages: { url: string; title: string | null; description: string | null; content_hash: string | null }[] = [];
  if (previousCrawlId) {
    const { rows } = await query<{ url: string; title: string | null; description: string | null; content_hash: string | null }>(
      "SELECT url, title, description, content_hash FROM page WHERE crawl_id = $1",
      [previousCrawlId]
    );
    previousPages = rows;
  }

  const crawlId = crypto.randomUUID();
  await query(
    "INSERT INTO crawl (id, site_id) VALUES ($1, $2)",
    [crawlId, siteId]
  );

  await executeCrawl({ crawlId, url, maxDepth: 3, maxPages: 200 });

  const { rows: crawlResult } = await query<{ status: string; llms_txt: string | null }>(
    "SELECT status, llms_txt FROM crawl WHERE id = $1",
    [crawlId]
  );
  const completedCrawl = crawlResult[0];

  if (!completedCrawl || completedCrawl.status !== "completed") {
    await query(
      "UPDATE monitor SET last_check_at = now() WHERE id = $1",
      [monitorId]
    );
    const checkId = crypto.randomUUID();
    await query(
      `INSERT INTO monitor_check (id, monitor_id, crawl_id, has_changes, diff)
       VALUES ($1, $2, $3, false, NULL)`,
      [checkId, monitorId, crawlId]
    );
    return;
  }

  const { rows: newPages } = await query<{ url: string; title: string | null; description: string | null; content_hash: string | null }>(
    "SELECT url, title, description, content_hash FROM page WHERE crawl_id = $1",
    [crawlId]
  );

  const diff = previousCrawlId
    ? computeDiff(previousPages, newPages)
    : null;

  const hasChanges = diff
    ? diff.added.length > 0 || diff.removed.length > 0 || diff.modified.length > 0
    : true;

  await query(
    `UPDATE monitor SET last_check_at = now()${hasChanges ? ", last_change_at = now()" : ""} WHERE id = $1`,
    [monitorId]
  );

  const checkId = crypto.randomUUID();
  await query(
    `INSERT INTO monitor_check (id, monitor_id, crawl_id, has_changes, diff)
     VALUES ($1, $2, $3, $4, $5)`,
    [checkId, monitorId, crawlId, hasChanges, diff ? JSON.stringify(diff) : null]
  );

  if (hasChanges && monitor.webhook_url) {
    await sendWebhook(monitor.webhook_url, {
      siteId,
      monitorId,
      crawlId,
      changes: diff,
      llmsTxt: completedCrawl.llms_txt,
    });
  }
}
