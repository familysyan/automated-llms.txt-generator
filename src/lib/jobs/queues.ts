export const QUEUES = {
  CRAWL: "crawl",
  MONITOR_CHECK: "monitor-check",
} as const;

export interface CrawlJobPayload {
  crawlId: string;
  url: string;
  maxDepth: number;
  maxPages: number;
}

export interface MonitorCheckPayload {
  monitorId: string;
  siteId: string;
  url: string;
}
