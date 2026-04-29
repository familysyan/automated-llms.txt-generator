import { PgBoss } from "pg-boss";

const QUEUES = ["crawl", "monitor-check"];

let boss: PgBoss | null = null;
let initialized = false;

export async function getBoss(): Promise<PgBoss> {
  if (!boss) {
    boss = new PgBoss(process.env.DATABASE_URL!);
    boss.on("error", (error: unknown) => console.error("[pgboss]", error));
    await boss.start();
  }
  if (!initialized) {
    for (const q of QUEUES) {
      await boss.createQueue(q).catch(() => {});
    }
    initialized = true;
  }
  return boss;
}
