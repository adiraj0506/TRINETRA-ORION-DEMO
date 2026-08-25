import { queryDb } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import type {
  Claim,
  Claimant,
  ClaimDocument,
  ClaimMapRow,
  ClaimReview,
  ClaimStatusHistory,
  FieldVerification,
  Notification,
  OCRExtractedField,
  OCRJob,
  SchemeMatch,
  SpatialConflict,
  WorkflowTask,
} from "@/lib/types";

export interface CreateClaimPayload {
  fullName: string;
  guardianName?: string;
  gender?: "M" | "F" | "Other";
  village: string;
  gramPanchayat?: string;
  block?: string;
  district: string;
  stateCode: string;
  category: "ST" | "OTFD";
  claimType: "IFR" | "CR" | "CFR";
  areaClaimedHectares: number;
  householdSize: number;
  surveyNumber?: string;
  plotNumber?: string;
  documentName?: string;
  documentDataUrl?: string;
  rawOcrText?: string;
  ocrConfidence?: number;
  extractedFields?: Record<string, { value: string; confidence: number }>;
  supplementaryDocuments?: Array<{
    documentType:
      | "claim_form"
      | "patta"
      | "gram_sabha_resolution"
      | "identity_document"
      | "land_record"
      | "supporting_evidence"
      | "field_photo"
      | "other";
    documentName: string;
    documentRefNumber?: string;
    mimeType?: string;
    fileSize?: number;
    previewDataUrl?: string;
  }>;
  lat?: number;
  lng?: number;
}

export interface FullClaimDetails {
  claim: Claim;
  claimant: Claimant;
  documents: ClaimDocument[];
  ocrJobs: (OCRJob & { fields?: OCRExtractedField[] })[];
  reviews: ClaimReview[];
  statusHistory: ClaimStatusHistory[];
  workflowTasks: WorkflowTask[];
  fieldVerifications: FieldVerification[];
  spatialConflicts: SpatialConflict[];
  schemeMatches: SchemeMatch[];
  landParcel?: {
    id: string;
    ulpin?: string;
    survey_number?: string;
    plot_number?: string;
    area_calculated?: number;
    geom_geojson?: any;
    lat?: number;
    lng?: number;
  } | null;
}

export async function createClaimFromDigitization(payload: CreateClaimPayload): Promise<{ claimId: string; claimantId: string }> {
  // Generate random application number
  const randNum = Math.floor(100000 + Math.random() * 900000);
  const stateCode = payload.stateCode || "OD";
  const appNumber = `FRA-${stateCode}-${new Date().getFullYear()}-${randNum}`;
  const claimNumber = `CLM-${randNum}`;

  // Default coordinate if not provided (e.g., center of state)
  const lat = payload.lat || (stateCode === "OD" ? 20.9517 : stateCode === "MP" ? 23.2599 : stateCode === "TS" ? 17.8496 : 23.9408) + (Math.random() - 0.5) * 0.4;
  const lng = payload.lng || (stateCode === "OD" ? 85.0985 : stateCode === "MP" ? 77.4126 : stateCode === "TS" ? 79.1151 : 91.9882) + (Math.random() - 0.5) * 0.4;

  // 1. Insert Claimant
  const claimantSql = `
    insert into claimants (
      full_name, guardian_name, gender, village, gram_panchayat, block, district, state_code, category, household_size
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    returning id;
  `;
  const claimantRes = await queryDb<{ id: string }>(claimantSql, [
    payload.fullName || "Unnamed Claimant",
    payload.guardianName || null,
    payload.gender || "M",
    payload.village || "Local Village",
    payload.gramPanchayat || payload.village || "Panchayat",
    payload.block || payload.district || "Block",
    payload.district || "District",
    stateCode,
    payload.category || "ST",
    payload.householdSize || 1,
  ]);
  const claimantId = claimantRes[0].id;

  // 2. Insert Claim
  const claimSql = `
    insert into claims (
      claimant_id, state_code, claim_type, claim_number, application_number,
      area_claimed_hectares, status, current_stage, submitted_on,
      survey_number, plot_number, village, gram_panchayat, block, district,
      priority_score, digitized, digitization_status, verification_status
    ) values (
      $1, $2, $3, $4, $5,
      $6, 'submitted', 'verification', current_date,
      $7, $8, $9, $10, $11, $12,
      75, true, 'completed', 'pending'
    ) returning id;
  `;
  const claimRes = await queryDb<{ id: string }>(claimSql, [
    claimantId,
    stateCode,
    payload.claimType || "IFR",
    claimNumber,
    appNumber,
    payload.areaClaimedHectares || 1.5,
    payload.surveyNumber || `SV-${Math.floor(100 + Math.random() * 900)}`,
    payload.plotNumber || `PL-${Math.floor(10 + Math.random() * 90)}`,
    payload.village,
    payload.gramPanchayat || payload.village,
    payload.block || payload.district,
    payload.district,
  ]);
  const claimId = claimRes[0].id;

  // 3. Insert Land Parcel with geometry and polygon buffer
  const ulpinCode = `14IN${stateCode}${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  const parcelSql = `
    insert into land_parcels (
      claim_id, ulpin, survey_number, plot_number, area_calculated, land_use,
      centroid, geom
    ) values (
      $1, $2, $3, $4, $5, 'forest_agriculture',
      ST_SetSRID(ST_MakePoint($6, $7), 4326),
      ST_SetSRID(ST_Buffer(ST_MakePoint($6, $7)::geography, 120)::geometry, 4326)
    );
  `;
  await queryDb(parcelSql, [
    claimId,
    ulpinCode,
    payload.surveyNumber || "SV-01",
    payload.plotNumber || "PL-01",
    payload.areaClaimedHectares || 1.5,
    lng,
    lat,
  ]);

  // 4. Insert Primary Claim Form Document
  const docSql = `
    insert into claim_documents (
      claim_id, document_type, document_name, storage_path, mime_type, file_size, language, ocr_status, review_status
    ) values (
      $1, 'claim_form', $2, $3, 'image/png', 245000, 'eng', 'completed', 'verified'
    ) returning id;
  `;
  const docRes = await queryDb<{ id: string }>(docSql, [
    claimId,
    payload.documentName || "scanned_claim_form.png",
    `documents/${claimId}/scanned_claim_form.png`,
  ]);
  const docId = docRes[0]?.id;

  // 4b. Insert any Supplementary Documents (Aadhaar / ID, Gram Sabha Letter, Patta, Land Record, etc.)
  if (payload.supplementaryDocuments && payload.supplementaryDocuments.length > 0) {
    for (const sDoc of payload.supplementaryDocuments) {
      await queryDb(
        `
        insert into claim_documents (
          claim_id, document_type, document_name, document_ref_number, storage_path,
          mime_type, file_size, language, ocr_status, review_status
        ) values (
          $1, $2, $3, $4, $5,
          $6, $7, 'eng', 'skipped', 'verified'
        );
      `,
        [
          claimId,
          sDoc.documentType || "identity_document",
          sDoc.documentName || "document.pdf",
          sDoc.documentRefNumber || null,
          `documents/${claimId}/${sDoc.documentName || "document.pdf"}`,
          sDoc.mimeType || "application/pdf",
          sDoc.fileSize || 150000,
        ]
      );
    }
  }

  // 5. Insert OCR Job and Extracted Fields
  if (docId) {
    const ocrJobSql = `
      insert into ocr_jobs (
        document_id, status, engine, language, started_at, completed_at, processing_time_ms, confidence, raw_text
      ) values (
        $1, 'completed', 'tesseract', 'eng', now() - interval '2 seconds', now(), 1850, $2, $3
      ) returning id;
    `;
    const ocrJobRes = await queryDb<{ id: string }>(ocrJobSql, [
      docId,
      payload.ocrConfidence || 88.5,
      payload.rawOcrText || "Scanned FRA claim form text",
    ]);
    const ocrJobId = ocrJobRes[0]?.id;

    if (ocrJobId && payload.extractedFields) {
      for (const [key, field] of Object.entries(payload.extractedFields)) {
        await queryDb(
          `
          insert into ocr_extracted_fields (
            ocr_job_id, field_name, field_value, normalized_value, confidence, validation_status
          ) values ($1, $2, $3, $4, $5, 'human_verified');
        `,
          [ocrJobId, key, field.value, field.value, field.confidence]
        );
      }
    }
  }

  // 6. Workflow task
  await queryDb(
    `
    insert into workflow_tasks (
      claim_id, assigned_role, stage, status, priority, due_date
    ) values (
      $1, 'sdlc_officer', 'document_and_spatial_verification', 'pending', 'high', current_date + 14
    );
  `,
    [claimId]
  );

  // 7. Notification
  await queryDb(
    `
    insert into notifications (
      claim_id, type, title, message, severity
    ) values (
      $1, 'new_claim', 'New Claim Registered', concat('Claim ', $2::text, ' for ', $3::text, ' submitted for verification.'), 'info'
    );
  `,
    [claimId, appNumber, payload.fullName]
  );

  // 8. Audit Log
  await queryDb(
    `
    insert into audit_logs (
      action, entity_type, entity_id, new_data
    ) values (
      'claim.created', 'claim', $1, $2::jsonb
    );
  `,
    [
      claimId,
      JSON.stringify({
        application_number: appNumber,
        claimant_name: payload.fullName,
        area_ha: payload.areaClaimedHectares,
      }),
    ]
  );

  return { claimId, claimantId };
}

export async function getFullClaimDetails(claimId: string): Promise<FullClaimDetails | null> {
  const claims = await queryDb<Claim>(`select * from claims where id = $1;`, [claimId]);
  if (!claims || claims.length === 0) return null;
  const claim = claims[0];

  const claimants = await queryDb<Claimant>(`select * from claimants where id = $1;`, [claim.claimant_id]);
  const claimant = claimants[0] || ({} as Claimant);

  const documents = await queryDb<ClaimDocument>(`select * from claim_documents where claim_id = $1 order by created_at desc;`, [claimId]);
  
  const ocrJobs = await queryDb<OCRJob>(
    `
    select oj.* from ocr_jobs oj
    join claim_documents cd on cd.id = oj.document_id
    where cd.claim_id = $1
    order by oj.created_at desc;
  `,
    [claimId]
  );

  for (const job of ocrJobs) {
    const fields = await queryDb<OCRExtractedField>(
      `select * from ocr_extracted_fields where ocr_job_id = $1 order by field_name;`,
      [job.id]
    );
    (job as any).fields = fields;
  }

  const reviews = await queryDb<ClaimReview>(`select * from claim_reviews where claim_id = $1 order by reviewed_at desc;`, [claimId]);
  const statusHistory = await queryDb<ClaimStatusHistory>(`select * from claim_status_history where claim_id = $1 order by created_at desc;`, [claimId]);
  const workflowTasks = await queryDb<WorkflowTask>(`select * from workflow_tasks where claim_id = $1 order by created_at desc;`, [claimId]);
  const fieldVerifications = await queryDb<FieldVerification>(`select * from field_verifications where claim_id = $1 order by visit_date desc;`, [claimId]);
  const spatialConflicts = await queryDb<SpatialConflict>(`select * from spatial_conflicts where claim_id = $1 order by created_at desc;`, [claimId]);
  const schemeMatches = await queryDb<SchemeMatch>(`select * from scheme_matches where claim_id = $1 order by matched_at desc;`, [claimId]);

  const parcels = await queryDb(
    `
    select id, ulpin, survey_number, plot_number, area_calculated,
           ST_Y(centroid) as lat, ST_X(centroid) as lng,
           ST_AsGeoJSON(geom)::json as geom_geojson
    from land_parcels
    where claim_id = $1
    limit 1;
  `,
    [claimId]
  );

  return {
    claim,
    claimant,
    documents,
    ocrJobs,
    reviews,
    statusHistory,
    workflowTasks,
    fieldVerifications,
    spatialConflicts,
    schemeMatches,
    landParcel: parcels[0] || null,
  };
}

export async function approveClaimAction(claimId: string, notes?: string): Promise<boolean> {
  const decidedDate = new Date().toISOString().slice(0, 10);
  
  await queryDb(
    `
    update claims set
      status = 'approved',
      current_stage = 'completed',
      decided_on = $1,
      updated_at = now()
    where id = $2;
  `,
    [decidedDate, claimId]
  );

  // Add review
  await queryDb(
    `
    insert into claim_reviews (
      claim_id, review_stage, decision, comments
    ) values (
      $1, 'sdlc', 'approved', $2
    );
  `,
    [claimId, notes || "Title approved following boundary and eligibility verification."]
  );

  // Update tasks
  await queryDb(
    `
    update workflow_tasks set
      status = 'completed',
      completed_at = now()
    where claim_id = $1 and status != 'completed';
  `,
    [claimId]
  );

  // Notification
  await queryDb(
    `
    insert into notifications (
      claim_id, type, title, message, severity
    ) values (
      $1, 'claim_approved', 'FRA Title Approved', 'Claim has been officially approved and Patta certificate recorded.', 'success'
    );
  `,
    [claimId]
  );

  return true;
}

export async function rejectClaimAction(claimId: string, reason: string): Promise<boolean> {
  const decidedDate = new Date().toISOString().slice(0, 10);

  await queryDb(
    `
    update claims set
      status = 'rejected',
      current_stage = 'completed',
      rejection_reason = $1,
      decided_on = $2,
      updated_at = now()
    where id = $3;
  `,
    [reason, decidedDate, claimId]
  );

  await queryDb(
    `
    insert into claim_reviews (
      claim_id, review_stage, decision, comments
    ) values (
      $1, 'sdlc', 'rejected', $2
    );
  `,
    [claimId, reason]
  );

  await queryDb(
    `
    update workflow_tasks set
      status = 'completed',
      completed_at = now()
    where claim_id = $1 and status != 'completed';
  `,
    [claimId]
  );

  await queryDb(
    `
    insert into notifications (
      claim_id, type, title, message, severity
    ) values (
      $1, 'claim_rejected', 'Claim Rejected', concat('Claim rejected: ', $2::text), 'error'
    );
  `,
    [claimId, reason]
  );

  return true;
}

export async function returnClaimAction(claimId: string, returnReason: string): Promise<boolean> {
  await queryDb(
    `
    update claims set
      status = 'returned_for_correction',
      current_stage = 'digitization_pending',
      return_reason = $1,
      updated_at = now()
    where id = $2;
  `,
    [returnReason, claimId]
  );

  await queryDb(
    `
    insert into claim_reviews (
      claim_id, review_stage, decision, comments
    ) values (
      $1, 'sdlc', 'returned', $2
    );
  `,
    [claimId, returnReason]
  );

  await queryDb(
    `
    insert into workflow_tasks (
      claim_id, assigned_role, stage, status, priority, due_date
    ) values (
      $1, 'gram_sabha_member', 'correct_and_resubmit_documents', 'pending', 'high', current_date + 7
    );
  `,
    [claimId]
  );

  await queryDb(
    `
    insert into notifications (
      claim_id, type, title, message, severity
    ) values (
      $1, 'claim_returned', 'Claim Returned for Correction', $2, 'warning'
    );
  `,
    [claimId, returnReason]
  );

  return true;
}

export async function requestFieldVerificationAction(claimId: string, notes?: string): Promise<boolean> {
  await queryDb(
    `
    update claims set
      status = 'field_verification',
      current_stage = 'field_verification',
      verification_status = 'in_progress',
      updated_at = now()
    where id = $1;
  `,
    [claimId]
  );

  await queryDb(
    `
    insert into field_verifications (
      claim_id, visit_date, status, notes
    ) values (
      $1, current_date + 3, 'scheduled', $2
    );
  `,
    [claimId, notes || "Joint field verification requested for GPS ground truthing."]
  );

  await queryDb(
    `
    insert into workflow_tasks (
      claim_id, assigned_role, stage, status, priority, due_date
    ) values (
      $1, 'field_officer', 'field_ground_verification', 'pending', 'urgent', current_date + 5
    );
  `,
    [claimId]
  );

  await queryDb(
    `
    insert into notifications (
      claim_id, type, title, message, severity
    ) values (
      $1, 'field_verification_assigned', 'Field Survey Assigned', 'Field officer assigned to conduct GPS parcel survey.', 'info'
    );
  `,
    [claimId]
  );

  return true;
}
