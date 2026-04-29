import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

const MIGRATE_DIR = path.resolve("migrate");

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required. Pull Vercel env first: vercel env pull .env.production.local --environment production",
    );
  }

  const migrationDirs = fs
    .readdirSync(MIGRATE_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d+/.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migration (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    const appliedRows = await client.query(
      "SELECT name FROM _migration ORDER BY id",
    );
    const applied = new Set(appliedRows.rows.map((row) => row.name));

    for (const name of migrationDirs) {
      if (applied.has(name)) {
        console.log(`skip ${name}`);
        continue;
      }

      const sqlPath = path.join(MIGRATE_DIR, name, "up.sql");
      const sql = fs.readFileSync(sqlPath, "utf8");

      console.log(`apply ${name}`);
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO _migration (name) VALUES ($1)", [name]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    console.log("remote migrations complete");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
