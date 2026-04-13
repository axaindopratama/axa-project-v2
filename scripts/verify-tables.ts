import { createClient } from "@libsql/client";

const client = createClient({
  url: "libsql://axa-project-v2-axaindopratama.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzU5NzYyMDcsImlkIjoiMDE5ZDgwNmQtYmYwMS03ZDE5LWFlYjItNjgyMWZhNGMxYzVlIiwicmlkIjoiODEwZjBjMzEtOWNhNC00MzMyLTgyNTYtOTM5MTExNmM4MDAwIn0.tdntT-pEHnfsq8efoB8OGBdVIJYeLm6ws_usesiGlrkC6LuUM2gU4G9SEEHBf509Rkatnb3GHfe5kiHj_nPQAg",
});

async function main() {
  const result = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log("Tables:", result.rows.map(r => r.name).join(", "));
  await client.close();
}

main().catch(console.error);
