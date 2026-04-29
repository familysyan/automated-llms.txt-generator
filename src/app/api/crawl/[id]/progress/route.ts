import { query } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const encoder = new TextEncoder();
  let cancelled = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: object) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      let lastPageCount = 0;
      const startTime = Date.now();

      const interval = setInterval(async () => {
        if (cancelled) {
          clearInterval(interval);
          return;
        }

        try {
          const { rows: crawlRows } = await query(
            "SELECT status, pages_found, error_message FROM crawl WHERE id = $1",
            [id]
          );

          if (crawlRows.length === 0) {
            send("error", { message: "Crawl not found" });
            clearInterval(interval);
            controller.close();
            return;
          }

          const crawl = crawlRows[0];
          const pagesFound = crawl.pages_found as number;

          if (pagesFound > lastPageCount) {
            const { rows: newPages } = await query(
              `SELECT url, title, depth, status_code
               FROM page WHERE crawl_id = $1
               ORDER BY crawled_at ASC
               OFFSET $2 LIMIT $3`,
              [id, lastPageCount, pagesFound - lastPageCount]
            );

            for (const page of newPages) {
              send("page", {
                url: page.url,
                title: page.title,
                depth: page.depth,
                status: page.status_code && page.status_code < 400 ? "done" : "error",
              });
            }

            lastPageCount = pagesFound;
          }

          send("progress", {
            pagesFound,
            pagesProcessed: pagesFound,
            currentDepth: 0,
          });

          if (crawl.status === "completed") {
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            send("complete", { totalPages: pagesFound, elapsed });
            clearInterval(interval);
            controller.close();
          } else if (crawl.status === "failed") {
            send("error", {
              message: crawl.error_message || "Crawl failed",
            });
            clearInterval(interval);
            controller.close();
          }
        } catch (err) {
          console.error("[SSE] poll error:", err);
        }
      }, 500);

      req.signal.addEventListener("abort", () => {
        cancelled = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
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
