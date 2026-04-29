import { getBoss } from "@/lib/boss";
import { QUEUES, type CrawlJobPayload, type MonitorCheckPayload } from "./queues";
import { executeCrawl } from "@/lib/crawler";
import { executeMonitorCheck } from "@/lib/monitor/scheduler";

export async function startWorker() {
  const boss = await getBoss();

  await boss.work<CrawlJobPayload>(QUEUES.CRAWL, async (jobs) => {
    for (const job of jobs) {
      console.log(`[worker] starting crawl job ${job.id}`);
      await executeCrawl(job.data);
      console.log(`[worker] completed crawl job ${job.id}`);
    }
  });

  await boss.work<MonitorCheckPayload>(
    QUEUES.MONITOR_CHECK,
    { localConcurrency: 1 },
    async (jobs) => {
      for (const job of jobs) {
        console.log(`[worker] starting monitor check ${job.id}`);
        await executeMonitorCheck(job.data);
        console.log(`[worker] completed monitor check ${job.id}`);
      }
    }
  );

  console.log("[worker] pgboss worker started, listening for jobs");
}
