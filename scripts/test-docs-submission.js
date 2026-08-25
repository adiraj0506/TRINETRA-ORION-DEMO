const { Client } = require('pg');

const directUrl = "postgresql://postgres:xIy96TVREz0Z2Z5Q@db.gpkduddahwgvoxobvqzo.supabase.co:5432/postgres";

async function testSubmissionWithDocs() {
  console.log("=== Testing Claim Submission with Supplementary Identification Documents ===");
  const client = new Client({ connectionString: directUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // Test inserting claimant
  const cRes = await client.query(`
    insert into claimants (full_name, guardian_name, village, gram_panchayat, district, state_code, category, household_size)
    values ('Aditya Raj (KYC Test)', 'S. Raj', 'Ramgaon', 'Ramgaon GP', 'Betul', 'MP', 'ST', 5)
    returning id;
  `);
  const claimantId = cRes.rows[0].id;

  // Test inserting claim with village & district columns
  const clRes = await client.query(`
    insert into claims (
      claimant_id, state_code, claim_type, claim_number, application_number,
      area_claimed_hectares, status, current_stage, submitted_on,
      survey_number, plot_number, village, gram_panchayat, block, district,
      priority_score, digitized, digitization_status, verification_status
    ) values (
      $1, 'MP', 'IFR', 'CLM-KYC-01', 'FRA-MP-2026-991122',
      2.4, 'submitted', 'verification', current_date,
      'SV-24', 'PL-12', 'Ramgaon', 'Ramgaon GP', 'Betul', 'Betul',
      80, true, 'completed', 'pending'
    ) returning id;
  `, [claimantId]);
  const claimId = clRes.rows[0].id;
  console.log(`✓ Inserted Claim: ${claimId}`);

  // Test inserting Primary Claim Form + Aadhaar + Gram Sabha Letter + Patta
  await client.query(`
    insert into claim_documents (claim_id, document_type, document_name, document_ref_number, storage_path, ocr_status, review_status)
    values 
      ($1, 'claim_form', 'scanned_claim_form.png', null, 'documents/test.png', 'completed', 'verified'),
      ($1, 'identity_document', 'aadhaar_card_scanned.pdf', 'XXXX-XXXX-9876', 'documents/aadhaar.pdf', 'skipped', 'verified'),
      ($1, 'gram_sabha_resolution', 'gram_sabha_resolution_letter.pdf', 'GS-BETUL-2024-88', 'documents/gs_letter.pdf', 'skipped', 'verified'),
      ($1, 'patta', 'legacy_patta_receipt.pdf', 'PATTA-MP-1998-44', 'documents/patta.pdf', 'skipped', 'verified');
  `, [claimId]);
  console.log("✓ Attached 4 documents (Claim Form, Aadhaar, Gram Sabha Letter, Patta)");

  // Query back attached docs
  const docList = await client.query(`
    select document_type, document_name, document_ref_number from claim_documents
    where claim_id = $1
    order by created_at;
  `, [claimId]);
  console.log("✓ Retrieved Documents from Supabase:", docList.rows);

  // Clean up test records
  await client.query(`delete from claimants where id = $1;`, [claimantId]);
  console.log("✓ Cleanup complete.");

  await client.end();
  console.log("=== All Tests Passed Successfully! ===");
}

testSubmissionWithDocs().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
