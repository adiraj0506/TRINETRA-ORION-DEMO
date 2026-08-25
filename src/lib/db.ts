import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.DIRECT_URL ||
  "postgresql://postgres.gpkduddahwgvoxobvqzo:xIy96TVREz0Z2Z5Q@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres";

// Global singleton pool across serverless invocations
declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

export function getDbPool(): Pool {
  if (!global.__pgPool) {
    global.__pgPool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 8000,
    });
  }
  return global.__pgPool;
}

export async function queryDb<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const pool = getDbPool();
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res.rows as T[];
  } finally {
    client.release();
  }
}
