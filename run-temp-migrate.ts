import { createClient } from "@libsql/client";

const client = createClient({
  url: "libsql://axa-project-v2-axaindopratama.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzU5NzYyMDcsImlkIjoiMDE5ZDgwNmQtYmYwMS03ZDE5LWFlYjItNjgyMWZhNGMxYzVlIiwicmlkIjoiODEwZjBjMzEtOWNhNC00MzMyLTgyNTYtOTM5MTExNmM4MDAwIn0.tdntT-pEHnfsq8efoB8OGBdVIJYeLm6ws_usesiGlrkC6LuUM2gU4G9SEEHBf509Rkatnb3GHfe5kiHj_nPQAg",
});

async function main() {
  const statements = [
    "ALTER TABLE `tasks` ADD `assigned_to` text REFERENCES entities(id);"
  ];

  for (const stmt of statements) {
    if (stmt.trim()) {
      console.log("Executing:", stmt.trim());
      try {
        await client.execute(stmt);
      } catch(e) {
        console.error("Error executing:", stmt, e.message);
      }
    }
  }

  console.log("Migration completed!");
  process.exit(0);
}

main();