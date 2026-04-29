export interface Site {
  id: string;
  url: string;
  name: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  lastCrawl: Crawl | null;
  monitor: Monitor | null;
}

export interface Crawl {
  id: string;
  siteId: string;
  status: "pending" | "running" | "completed" | "failed";
  pagesFound: number;
  startedAt: string;
  completedAt: string | null;
  llmsTxt: string | null;
  pages: Page[];
}

export interface Page {
  id: string;
  crawlId: string;
  url: string;
  title: string | null;
  description: string | null;
  contentHash: string | null;
  depth: number;
  section: string | null;
  importance: number;
  statusCode: number | null;
  crawledAt: string;
}

export interface Monitor {
  id: string;
  siteId: string;
  active: boolean;
  interval: "hourly" | "daily" | "weekly";
  lastCheckAt: string | null;
  lastChangeAt: string | null;
  webhookUrl: string | null;
  createdAt: string;
}

export interface MonitorCheck {
  id: string;
  monitorId: string;
  checkedAt: string;
  hasChanges: boolean;
  diff: DiffResult | null;
}

export interface DiffResult {
  added: { url: string; title: string | null }[];
  removed: { url: string; title: string | null }[];
  modified: {
    url: string;
    oldTitle: string | null;
    newTitle: string | null;
  }[];
  unchanged: number;
}

export interface CrawlProgressEvent {
  url: string;
  title: string | null;
  depth: number;
  status: "crawling" | "done" | "error";
}
