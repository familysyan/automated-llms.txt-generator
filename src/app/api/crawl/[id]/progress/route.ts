import { fakeCrawlProgress } from "@/lib/fake-data";

// TODO: replace with real SSE from DB polling
export async function GET() {
  const encoder = new TextEncoder();
  let index = 0;
  let cancelled = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: object) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      const interval = setInterval(() => {
        if (cancelled) {
          clearInterval(interval);
          return;
        }

        if (index < fakeCrawlProgress.length) {
          const page = fakeCrawlProgress[index];
          index++;
          send("page", page);
          send("progress", {
            pagesFound: index,
            pagesProcessed: index,
            currentDepth: page.depth,
          });
        } else {
          send("complete", { totalPages: fakeCrawlProgress.length, elapsed: 12 });
          clearInterval(interval);
          controller.close();
        }
      }, 400);
    },
    cancel() {
      cancelled = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
