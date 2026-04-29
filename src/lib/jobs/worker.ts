import { getBoss } from "@/lib/boss";
import { QUEUES, type CrawlJobPayload } from "./queues";
import { executeCrawl } from "@/lib/crawler";

export async function startWorker() {
  const boss = await getBoss();

  await boss.work<CrawlJobPayload>(QUEUES.CRAWL, async (jobs) => {
    for (const job of jobs) {
      console.log(`[worker] starting crawl job ${job.id}`);
      await executeCrawl(job.data);
      console.log(`[worker] completed crawl job ${job.id}`);
    }
  });

  console.log("[worker] pgboss worker started, listening for jobs");
}
