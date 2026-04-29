import type { DiffResult } from "./diff";

export interface WebhookPayload {
  siteId: string;
  monitorId: string;
  crawlId: string;
  changes: DiffResult | null;
  llmsTxt: string | null;
}

export async function sendWebhook(
  webhookUrl: string,
  payload: WebhookPayload
): Promise<void> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "site.changed",
        timestamp: new Date().toISOString(),
        ...payload,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error(
        `[webhook] failed: ${response.status} ${response.statusText}`
      );
    }
  } catch (error) {
    console.error("[webhook] delivery error:", error);
  }
}
