import robotsParser from "robots-parser";

const USER_AGENT = "ProfoundBot/1.0 (+https://profound.dev)";
const DEFAULT_DELAY_MS = 1000;
const MAX_DELAY_MS = 10_000;

export interface RobotsChecker {
  isAllowed(url: string): boolean;
  crawlDelay: number;
}

export async function loadRobots(siteUrl: string): Promise<RobotsChecker> {
  const origin = new URL(siteUrl).origin;
  const robotsUrl = `${origin}/robots.txt`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(robotsUrl, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return permissive();
    }

    const text = await res.text();
    const robots = robotsParser(robotsUrl, text);

    const rawDelay = robots.getCrawlDelay(USER_AGENT);
    const delayMs = rawDelay
      ? Math.min(rawDelay * 1000, MAX_DELAY_MS)
      : DEFAULT_DELAY_MS;

    return {
      isAllowed: (url: string) => robots.isAllowed(url, USER_AGENT) !== false,
      crawlDelay: delayMs,
    };
  } catch {
    return permissive();
  }
}

function permissive(): RobotsChecker {
  return {
    isAllowed: () => true,
    crawlDelay: DEFAULT_DELAY_MS,
  };
}
