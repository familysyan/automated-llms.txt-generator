import type {
  Site,
  Crawl,
  Page,
  Monitor,
  MonitorCheck,
  CrawlProgressEvent,
} from "@/types";

const SAMPLE_LLMS_TXT = `# Vercel

> Vercel is the platform for frontend developers, providing the speed and reliability innovators need to create at the moment of inspiration.

Vercel enables developers to host websites and web services that deploy instantly, scale automatically, and require no supervision.

## Documentation

- [Getting Started](https://vercel.com/docs): Learn how to deploy your first project
- [Frameworks](https://vercel.com/docs/frameworks): Supported frameworks and configurations
- [CLI Reference](https://vercel.com/docs/cli): Command-line interface documentation
- [Edge Functions](https://vercel.com/docs/functions/edge-functions): Deploy serverless functions at the edge

## Guides

- [Deploy Next.js](https://vercel.com/guides/deploying-nextjs): Step-by-step Next.js deployment guide
- [Custom Domains](https://vercel.com/guides/custom-domains): Configure your own domain
- [Environment Variables](https://vercel.com/guides/environment-variables): Managing secrets and config

## API Reference

- [REST API](https://vercel.com/docs/rest-api): Programmatic access to Vercel
- [Webhooks](https://vercel.com/docs/webhooks): Event-driven integrations

## Optional

- [Blog](https://vercel.com/blog): Company news and updates
- [Changelog](https://vercel.com/changelog): Product updates and releases
- [About](https://vercel.com/about): Company information`;

const SAMPLE_LLMS_TXT_2 = `# Stripe

> Financial infrastructure for the internet. Millions of businesses use Stripe to accept payments, grow their revenue, and accelerate new business opportunities.

## Documentation

- [Quick Start](https://docs.stripe.com/get-started): Start integrating Stripe
- [Payments](https://docs.stripe.com/payments): Accept online payments
- [Billing](https://docs.stripe.com/billing): Subscriptions and invoicing

## API Reference

- [API Overview](https://docs.stripe.com/api): Complete API reference
- [SDKs](https://docs.stripe.com/sdks): Client and server libraries

## Optional

- [Blog](https://stripe.com/blog): News and updates`;

const SAMPLE_LLMS_TXT_3 = `# Linear

> Linear is the issue tracking tool you'll enjoy using. Built for modern software teams.

## Documentation

- [Getting Started](https://linear.app/docs): Introduction to Linear
- [Integrations](https://linear.app/docs/integrations): Connect your tools

## Optional

- [Changelog](https://linear.app/changelog): Product updates`;

const pages: Page[] = [
  { id: "p1", crawlId: "c1", url: "https://vercel.com", title: "Vercel: Build and deploy the best web experiences", description: "Vercel is the platform for frontend developers.", contentHash: "a1b2c3", depth: 0, section: "Main", importance: 1.0, statusCode: 200, crawledAt: "2026-04-28T10:00:00Z" },
  { id: "p2", crawlId: "c1", url: "https://vercel.com/docs", title: "Documentation", description: "Learn how to deploy your first project.", contentHash: "d4e5f6", depth: 1, section: "Documentation", importance: 0.9, statusCode: 200, crawledAt: "2026-04-28T10:00:01Z" },
  { id: "p3", crawlId: "c1", url: "https://vercel.com/docs/frameworks", title: "Frameworks", description: "Supported frameworks and configurations.", contentHash: "g7h8i9", depth: 2, section: "Documentation", importance: 0.6, statusCode: 200, crawledAt: "2026-04-28T10:00:02Z" },
  { id: "p4", crawlId: "c1", url: "https://vercel.com/docs/cli", title: "CLI Reference", description: "Command-line interface documentation.", contentHash: "j0k1l2", depth: 2, section: "Documentation", importance: 0.5, statusCode: 200, crawledAt: "2026-04-28T10:00:03Z" },
  { id: "p5", crawlId: "c1", url: "https://vercel.com/guides/deploying-nextjs", title: "Deploy Next.js", description: "Step-by-step Next.js deployment guide.", contentHash: "m3n4o5", depth: 2, section: "Guides", importance: 0.55, statusCode: 200, crawledAt: "2026-04-28T10:00:04Z" },
  { id: "p6", crawlId: "c1", url: "https://vercel.com/blog", title: "Blog", description: "Company news and updates.", contentHash: "p6q7r8", depth: 1, section: "Optional", importance: 0.15, statusCode: 200, crawledAt: "2026-04-28T10:00:05Z" },
];

const crawls: Crawl[] = [
  { id: "c1", siteId: "s1", status: "completed", pagesFound: 47, startedAt: "2026-04-28T10:00:00Z", completedAt: "2026-04-28T10:00:12Z", llmsTxt: SAMPLE_LLMS_TXT, pages },
  { id: "c2", siteId: "s2", status: "completed", pagesFound: 23, startedAt: "2026-04-27T15:30:00Z", completedAt: "2026-04-27T15:30:08Z", llmsTxt: SAMPLE_LLMS_TXT_2, pages: [] },
  { id: "c3", siteId: "s3", status: "completed", pagesFound: 12, startedAt: "2026-04-26T09:00:00Z", completedAt: "2026-04-26T09:00:05Z", llmsTxt: SAMPLE_LLMS_TXT_3, pages: [] },
];

const monitors: Monitor[] = [
  { id: "m1", siteId: "s1", active: true, interval: "daily", lastCheckAt: "2026-04-28T00:00:00Z", lastChangeAt: null, webhookUrl: null, createdAt: "2026-04-28T10:01:00Z" },
  { id: "m2", siteId: "s2", active: true, interval: "weekly", lastCheckAt: "2026-04-27T00:00:00Z", lastChangeAt: "2026-04-27T00:00:00Z", webhookUrl: "https://hooks.slack.com/services/xxx", createdAt: "2026-04-27T15:31:00Z" },
];

export const fakeSites: Site[] = [
  { id: "s1", url: "https://vercel.com", name: "Vercel", description: "Frontend cloud platform", createdAt: "2026-04-28T10:00:00Z", updatedAt: "2026-04-28T10:00:12Z", lastCrawl: crawls[0], monitor: monitors[0] },
  { id: "s2", url: "https://stripe.com", name: "Stripe", description: "Financial infrastructure for the internet", createdAt: "2026-04-27T15:30:00Z", updatedAt: "2026-04-27T15:30:08Z", lastCrawl: crawls[1], monitor: monitors[1] },
  { id: "s3", url: "https://linear.app", name: "Linear", description: "Issue tracking for modern teams", createdAt: "2026-04-26T09:00:00Z", updatedAt: "2026-04-26T09:00:05Z", lastCrawl: crawls[2], monitor: null },
];

export const fakeMonitorChecks: MonitorCheck[] = [
  { id: "mc1", monitorId: "m1", checkedAt: "2026-04-28T00:00:00Z", hasChanges: false, diff: null },
  { id: "mc2", monitorId: "m1", checkedAt: "2026-04-27T00:00:00Z", hasChanges: false, diff: null },
  { id: "mc3", monitorId: "m2", checkedAt: "2026-04-27T00:00:00Z", hasChanges: true, diff: { added: [{ url: "https://stripe.com/docs/new-feature", title: "New Feature Guide" }], removed: [], modified: [{ url: "https://docs.stripe.com/payments", oldTitle: "Payments", newTitle: "Accept Payments" }, { url: "https://docs.stripe.com/api", oldTitle: "API Reference", newTitle: "API Overview" }], unchanged: 18 } },
  { id: "mc4", monitorId: "m2", checkedAt: "2026-04-26T00:00:00Z", hasChanges: false, diff: null },
  { id: "mc5", monitorId: "m2", checkedAt: "2026-04-25T00:00:00Z", hasChanges: true, diff: { added: [], removed: [{ url: "https://stripe.com/legacy", title: "Legacy Docs" }], modified: [], unchanged: 20 } },
];

export const fakeCrawlProgress: CrawlProgressEvent[] = [
  { url: "https://vercel.com", title: "Vercel: Build and deploy the best web experiences", depth: 0, status: "done" },
  { url: "https://vercel.com/docs", title: "Documentation", depth: 1, status: "done" },
  { url: "https://vercel.com/pricing", title: "Pricing", depth: 1, status: "done" },
  { url: "https://vercel.com/docs/frameworks", title: "Frameworks", depth: 2, status: "done" },
  { url: "https://vercel.com/docs/cli", title: "CLI Reference", depth: 2, status: "done" },
  { url: "https://vercel.com/guides/deploying-nextjs", title: "Deploy Next.js", depth: 2, status: "done" },
  { url: "https://vercel.com/guides/custom-domains", title: "Custom Domains", depth: 2, status: "done" },
  { url: "https://vercel.com/docs/rest-api", title: "REST API", depth: 2, status: "crawling" },
];

export function getSiteById(id: string): Site | undefined {
  return fakeSites.find((s) => s.id === id);
}

export function getMonitorChecks(monitorId: string): MonitorCheck[] {
  return fakeMonitorChecks.filter((mc) => mc.monitorId === monitorId);
}
