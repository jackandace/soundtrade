// docs/migrations/*.sql をファイル名順にトランザクション付きで実行する。
// 使い方: node --env-file=.env.local scripts/run-migrations.mjs
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";

const MIGRATIONS_DIR = "docs/migrations";
const url = process.env.SUPABASE_DB_URL;

if (!url) {
  console.error("ERROR: SUPABASE_DB_URL が未設定です。.env.local を確認してください。");
  process.exit(1);
}

const allFiles = await readdir(MIGRATIONS_DIR);
const sqlFiles = allFiles.filter((f) => f.endsWith(".sql")).sort();

if (sqlFiles.length === 0) {
  console.error(`ERROR: ${MIGRATIONS_DIR} に .sql ファイルが見つかりません。`);
  process.exit(1);
}

console.log(`対象: ${sqlFiles.length} ファイル`);
sqlFiles.forEach((f) => console.log(`  - ${f}`));
console.log();

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

let failedFile = null;
try {
  for (const file of sqlFiles) {
    const sql = await readFile(join(MIGRATIONS_DIR, file), "utf8");
    const sizeKb = (sql.length / 1024).toFixed(1);
    process.stdout.write(`▶ ${file.padEnd(28)} (${sizeKb.padStart(7)} KB) ... `);
    const start = Date.now();

    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("COMMIT");
      console.log(`✓ ${Date.now() - start}ms`);
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      console.log("✗ FAILED");
      console.error(`  ${e.message}`);
      if (e.position) console.error(`  position: ${e.position}`);
      if (e.hint) console.error(`  hint: ${e.hint}`);
      failedFile = file;
      throw e;
    }
  }
  console.log("\nすべて成功しました。");
} catch {
  console.error(`\n${failedFile} で停止しました。それ以前のファイルはコミット済みです。`);
  process.exitCode = 1;
} finally {
  await client.end();
}
