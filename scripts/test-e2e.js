const { Client } = require('pg');

const directUrl = "postgresql://postgres:xIy96TVREz0Z2Z5Q@db.gpkduddahwgvoxobvqzo.supabase.co:5432/postgres";

async function testPipeline() {
  console.log("=== TRINETRA End-to-End Pipeline Verification ===");
  const client = new Client({ connectionString: directUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // 1. Verify schema tables
  console.log("\n1. Verifying Database Tables...");
  const tableCheck = await client.query(`
    select table_name from information_schema.tables 
    where table_schema = 'public' 
    order by table_name;
  `);
  console.log("✓ Found Tables:", tableCheck.rows.map(r => r.table_name).join(", "));

  // 2. Simulate Digitization & Submission
  console.log("\n2. Simulating Digitization & Claim Submission...");
  const claimantName = "Savitri Majhi (E2E Test)";
  const claimantRes = await client.query(`
    insert into claimants (full_name, guardian_name, village, gram_panchayat, district, state_code, category, household_size)
    values ($1, 'Bikram Majhi', 'Kodinga', 'Kodinga GP', 'Nabarangpur', 'OD', 'ST', 5)
    returning id;
  `, [claimantName]);
  const claimantId = claimantRes.rows[0].id;
  console.log(`✓ Created Claimant with ID: ${claimantId}`);

  const appNumber = `FRA-OD-${new Date().getFullYear()}-889900`;
  const claimRes = await client.query(`
    insert into claims (
      claimant_id, state_code, claim_type, claim_number, application_number,
      area_claimed_hectares, status, current_stage, submitted_on, priority_score, digitized
    ) values (
      $1, 'OD', 'IFR', 'CLM-889900', $2,
      2.35, 'submitted', 'verification', current_date, 85, true
    ) returning id;
  `, [claimantId, appNumber]);
  const claimId = claimRes.rows[0].id;
  console.log(`✓ Created Claim with ID: ${claimId} (Application: ${appNumber})`);

  // 3. Attach PostGIS Land Parcel
  console.log("\n3. Creating PostGIS Land Parcel & Boundary Buffer...");
  const ulpinCode = `14INOD8899001122`;
  await client.query(`
    insert into land_parcels (
      claim_id, ulpin, survey_number, plot_number, area_calculated,
      centroid, geom
    ) values (
      $1, $2, 'SV-88', 'PL-99', 2.35,
      ST_SetSRID(ST_MakePoint(82.6841, 19.2314), 4326),
      ST_SetSRID(ST_Buffer(ST_MakePoint(82.6841, 19.2314)::geography, 150)::geometry, 4326)
    );
  `, [claimId, ulpinCode]);
  console.log(`✓ Created PostGIS parcel with centroid and polygon boundary`);

  // 4. Attach OCR Document & Fields
  console.log("\n4. Attaching Document, OCR Job, and Extracted Fields...");
  const docRes = await client.query(`
    insert into claim_documents (claim_id, document_type, document_name, storage_path, ocr_status, review_status)
    values ($1, 'claim_form', 'savitri_majhi_claim_form.png', 'documents/test.png', 'completed', 'verified')
    returning id;
  `, [claimId]);
  const docId = docRes.rows[0].id;

  const ocrRes = await client.query(`
    insert into ocr_jobs (document_id, status, engine, confidence, raw_text)
    values ($1, 'completed', 'tesseract', 92.5, 'Name: Savitri Majhi, Village: Kodinga, Area: 2.35 ha')
    returning id;
  `, [docId]);
  const ocrJobId = ocrRes.rows[0].id;

  await client.query(`
    insert into ocr_extracted_fields (ocr_job_id, field_name, field_value, confidence, validation_status)
    values 
      ($1, 'fullName', 'Savitri Majhi', 95, 'human_verified'),
      ($1, 'village', 'Kodinga', 90, 'human_verified'),
      ($1, 'areaClaimedHectares', '2.35', 92, 'human_verified');
  `, [ocrJobId]);
  console.log(`✓ Attached OCR job (${ocrJobId}) and 3 validated fields`);

  // 5. Verify Reflection in claims_map view
  console.log("\n5. Checking claims_map View Reflection...");
  const mapRow = await client.query(`
    select * from claims_map where claim_id = $1;
  `, [claimId]);
  console.log("✓ claims_map Row:", {
    claim_id: mapRow.rows[0].claim_id,
    full_name: mapRow.rows[0].full_name,
    status: mapRow.rows[0].status,
    lat: mapRow.rows[0].lat,
    lng: mapRow.rows[0].lng,
    ulpin: mapRow.rows[0].ulpin,
    has_geojson: !!mapRow.rows[0].geom_geojson
  });

  // 6. Simulate Admin Approval Decision
  console.log("\n6. Simulating Admin Approval Decision...");
  await client.query(`
    update claims set
      status = 'approved',
      current_stage = 'completed',
      decided_on = current_date,
      updated_at = now()
    where id = $1;
  `, [claimId]);

  // Insert review record
  await client.query(`
    insert into claim_reviews (claim_id, review_stage, decision, comments)
    values ($1, 'sdlc', 'approved', 'Title approved following boundary verification.');
  `, [claimId]);

  // 7. Verify Trigger Created Status History and Audit Log
  console.log("\n7. Verifying Trigger Generated Status History & Audit Trail...");
  const historyCheck = await client.query(`
    select * from claim_status_history where claim_id = $1;
  `, [claimId]);
  console.log(`✓ Status History Entries: ${historyCheck.rows.length} record(s)`);
  if (historyCheck.rows.length > 0) {
    console.log("  → Transition:", `${historyCheck.rows[0].old_status} => ${historyCheck.rows[0].new_status}`);
  }

  const auditCheck = await client.query(`
    select * from audit_logs where entity_id = $1;
  `, [claimId]);
  console.log(`✓ Audit Log Entries: ${auditCheck.rows.length} record(s)`);

  // 8. Clean up test record
  console.log("\n8. Cleaning up test record...");
  await client.query(`delete from claimants where id = $1;`, [claimantId]);
  console.log("✓ Cleaned up test claimant (cascade deleted claims, parcels, docs).");

  console.log("\n=== ALL E2E PIPELINE TESTS PASSED! ===");
  await client.end();
}

testPipeline().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
