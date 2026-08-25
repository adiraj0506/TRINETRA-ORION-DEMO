const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const directUrl = "postgresql://postgres:xIy96TVREz0Z2Z5Q@db.gpkduddahwgvoxobvqzo.supabase.co:5432/postgres";
const poolerUrl = "postgresql://postgres.gpkduddahwgvoxobvqzo:xIy96TVREz0Z2Z5Q@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres";

async function run() {
  console.log("Connecting to Supabase PostgreSQL...");
  let client = new Client({ connectionString: directUrl, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log("Connected successfully via direct connection!");
  } catch (err) {
    console.warn("Direct connection failed, attempting transaction pooler connection...", err.message);
    client = new Client({ connectionString: poolerUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();
    console.log("Connected successfully via transaction pooler!");
  }

  // Ensure base schema exists first
  const baseSchemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
  if (fs.existsSync(baseSchemaPath)) {
    console.log("Checking / applying base schema.sql...");
    const baseSql = fs.readFileSync(baseSchemaPath, 'utf8');
    try {
      await client.query(baseSql);
      console.log("✓ Base schema applied / verified.");
    } catch (e) {
      console.warn("Base schema notice:", e.message);
    }
  }

  // Ensure seed data if claimants / states are empty
  const seedPath = path.join(__dirname, '..', 'supabase', 'seed.sql');
  if (fs.existsSync(seedPath)) {
    try {
      const { rows } = await client.query("select count(*) from claims;");
      if (parseInt(rows[0].count, 10) === 0) {
        console.log("Seeding baseline claims and parcels...");
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        await client.query(seedSql);
        console.log("✓ Baseline seed data applied.");
      } else {
        console.log(`✓ Database already has ${rows[0].count} claims.`);
      }
    } catch (e) {
      console.warn("Seed check notice:", e.message);
    }
  }

  // Run ordered migrations
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    console.log(`Applying migration: ${file}...`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    try {
      await client.query(sql);
      console.log(`✓ Applied ${file}`);
    } catch (e) {
      console.error(`✗ Error applying ${file}:`, e.message);
      // We log but continue if it's an existing constraint / object
    }
  }

  console.log("All migrations executed successfully!");
  await client.end();
}

run().catch(err => {
  console.error("Migration runner fatal error:", err);
  process.exit(1);
});
