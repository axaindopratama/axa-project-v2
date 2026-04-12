import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

let client: ReturnType<typeof createClient> | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function getDbClient() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    
    if (!url) {
      throw new Error('TURSO_DATABASE_URL is not set');
    }
    
    client = createClient({
      url,
      authToken,
    });
  }
  return client;
}

export function getDb() {
  if (!db) {
    const client = getDbClient();
    db = drizzle(client, { schema });
  }
  return db;
}

// For local SQLite development
export function getLocalDb() {
  const client = createClient({
    url: 'file:local.db',
  });
  return drizzle(client, { schema });
}

export { schema };