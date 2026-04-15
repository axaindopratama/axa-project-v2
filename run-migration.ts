import { createClient } from '@libsql/client';
import * as fs from 'fs';

async function main() {
  const client = createClient({
    url: 'libsql://axa-project-v2-axaindopratama.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzU5NzYyMDcsImlkIjoiMDE5ZDgwNmQtYmYwMS03ZDE5LWFlYjItNjgyMWZhNGMxYzVlIiwicmlkIjoiODEwZjBjMzEtOWNhNC00MzMyLTgyNTYtOTM5MTExNmM4MDAwIn0.tdntT-pEHnfsq8efoB8OGBdVIJYeLm6ws_usesiGlrkC6LuUM2gU4G9SEEHBf509Rkatnb3GHfe5kiHj_nPQAg',
  });

  const sql = fs.readFileSync('./migrations/add_company_id_to_users.sql', 'utf-8');
  const statements = sql.split(';').filter(s => s.trim());

  for (const stmt of statements) {
    if (stmt.trim()) {
      console.log('Executing:', stmt.trim().substring(0, 80) + '...');
      await client.execute(stmt);
    }
  }

  console.log('company_id migration completed!');
  await client.close();
}

main();