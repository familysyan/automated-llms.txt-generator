const USER_AGENT = "ProfoundBot/1.0 (+https://profound.dev)";
const TIMEOUT_MS = 10_000;
const MAX_BODY_SIZE = 5 * 1024 * 1024; // 5 MB

const lastRequestPerDomain = new Map<string, number>();

export interface FetchResult {
  url: string;
  statusCode: number;
  html: string;
  error?: string;
}

async function rateLimitWait(domain: string, minDelayMs: number) {
  const last = lastRequestPerDomain.get(domain) ?? 0;
  const elapsed = Date.now() - last;
  if (elapsed < minDelayMs) {
    await new Promise((r) => setTimeout(r, minDelayMs - elapsed));
  }
  lastRequestPerDomain.set(domain, Date.now());
}

export async function fetchPage(
  url: string,
  rateLimitMs = 1000
): Promise<FetchResult> {
  const domain = new URL(url).hostname;
  await rateLimitWait(domain, rateLimitMs);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    clearTimeout(timeout);

    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
      return { url, statusCode: res.status, html: "", error: "Body too large" };
    }

    if (!res.ok) {
      return { url: res.url, statusCode: res.status, html: "" };
    }

    const html = await res.text();
    if (html.length > MAX_BODY_SIZE) {
      return {
        url: res.url,
        statusCode: res.status,
        html: "",
        error: "Body too large",
      };
    }

    return { url: res.url, statusCode: res.status, html };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.name === "AbortError"
          ? "Timeout"
          : err.message
        : "Unknown error";
    return { url, statusCode: 0, html: "", error: message };
  }
}
