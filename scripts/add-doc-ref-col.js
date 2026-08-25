const { Client } = require('pg');

const directUrl = "postgresql://postgres:xIy96TVREz0Z2Z5Q@db.gpkduddahwgvoxobvqzo.supabase.co:5432/postgres";

async function addCol() {
  const client = new Client({ connectionString: directUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected to Supabase PostgreSQL...");

  await client.query(`
    alter table claim_documents
      add column if not exists document_ref_number text;
  `);
  console.log("✓ Added document_ref_number to claim_documents table!");

  await client.end();
}

addCol().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
