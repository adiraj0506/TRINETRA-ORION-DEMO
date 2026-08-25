const { Client } = require('pg');

const directUrl = "postgresql://postgres:xIy96TVREz0Z2Z5Q@db.gpkduddahwgvoxobvqzo.supabase.co:5432/postgres";

async function fix() {
  const client = new Client({ connectionString: directUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected to Supabase PostgreSQL...");

  await client.query(`
    alter table claims
      add column if not exists village text,
      add column if not exists district text;
  `);
  console.log("✓ Added village and district columns to claims table!");

  // Also update 002_extend_claimants_claims.sql to keep migrations in sync
  await client.end();
}

fix().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
