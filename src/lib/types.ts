export type ClaimStatus =
  | "approved"
  | "pending"
  | "rejected"
  | "draft"
  | "digitization_pending"
  | "review_pending"
  | "submitted"
  | "verification_pending"
  | "field_verification"
  | "committee_review"
  | "returned_for_correction"
  | "archived";

export type ClaimType = "IFR" | "CR" | "CFR";
export type ClaimantCategory = "ST" | "OTFD";
export type StateCode = "MP" | "OD" | "TS" | "TR";

export type UserRole =
  | "claimant"
  | "gram_sabha_member"
  | "frc_officer"
  | "field_officer"
  | "sdlc_officer"
  | "dlc_officer"
  | "admin"
  | "super_admin"
  | "community"
  | "verifier";

export interface Profile {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  role: UserRole;
  state_code?: StateCode | null;
  district?: string | null;
  block?: string | null;
  village?: string | null;
  preferred_language?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Claimant {
  id: string;
  full_name: string;
  guardian_name?: string | null;
  gender?: "M" | "F" | "Other" | null;
  date_of_birth?: string | null;
  phone?: string | null;
  village: string;
  gram_panchayat?: string | null;
  block?: string | null;
  district: string;
  state_code: StateCode;
  category: ClaimantCategory;
  household_size: number;
  preferred_language?: string;
  created_at: string;
  updated_at?: string;
}

export interface Claim {
  id: string;
  claimant_id: string;
  state_code: StateCode;
  claim_type: ClaimType;
  claim_number?: string | null;
  application_number?: string | null;
  submitted_on: string;
  status: ClaimStatus;
  current_stage: string;
  area_claimed_hectares: number;
  area_verified_hectares?: number | null;
  survey_number?: string | null;
  plot_number?: string | null;
  village?: string | null;
  gram_panchayat?: string | null;
  block?: string | null;
  district?: string | null;
  revenue_village?: string | null;
  forest_range?: string | null;
  submitted_by?: string | null;
  verified_by?: string | null;
  approved_by?: string | null;
  decided_on?: string | null;
  rejection_reason?: string | null;
  return_reason?: string | null;
  priority_score?: number;
  digitization_status?: string;
  verification_status?: string;
  digitized: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ClaimDocument {
  id: string;
  claim_id: string;
  document_type:
    | "claim_form"
    | "patta"
    | "gram_sabha_resolution"
    | "identity_document"
    | "land_record"
    | "supporting_evidence"
    | "field_photo"
    | "other";
  document_name: string;
  document_ref_number?: string | null;
  storage_path: string;
  document_url?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  language?: string;
  uploaded_by?: string | null;
  uploaded_at: string;
  ocr_status: "pending" | "processing" | "completed" | "failed" | "skipped";
  review_status: "pending" | "verified" | "rejected" | "flagged";
  created_at: string;
}

export interface OCRJob {
  id: string;
  document_id: string;
  status: "queued" | "processing" | "completed" | "failed" | "needs_review";
  engine: "paddleocr" | "tesseract" | "manual";
  language: string;
  started_at?: string | null;
  completed_at?: string | null;
  processing_time_ms?: number | null;
  confidence?: number | null;
  raw_text?: string | null;
  error_message?: string | null;
  created_at: string;
}

export interface OCRExtractedField {
  id: string;
  ocr_job_id: string;
  field_name: string;
  field_value?: string | null;
  normalized_value?: string | null;
  confidence?: number | null;
  bounding_box?: Record<string, unknown> | null;
  validation_status: "unverified" | "auto_matched" | "human_verified" | "rejected" | "edited";
  reviewed_value?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
}

export interface ClaimReview {
  id: string;
  claim_id: string;
  reviewer_id?: string | null;
  review_stage: "digitization" | "document_review" | "field_verification" | "frc" | "sdlc" | "dlc" | "admin";
  decision: "approved" | "rejected" | "returned" | "needs_field_verification" | "under_review";
  comments?: string | null;
  reviewed_at: string;
}

export interface ClaimStatusHistory {
  id: string;
  claim_id: string;
  old_status?: string | null;
  new_status: string;
  changed_by?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface WorkflowTask {
  id: string;
  claim_id: string;
  assigned_to?: string | null;
  assigned_role?: string | null;
  stage: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  due_date?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FieldVerification {
  id: string;
  claim_id: string;
  officer_id?: string | null;
  visit_date: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracy_m?: number | null;
  observed_area?: number | null;
  land_use?: string | null;
  occupation_type?: string | null;
  forest_presence: boolean;
  claimant_present: boolean;
  documents_verified: boolean;
  photo_evidence?: string[] | Record<string, unknown>[];
  notes?: string | null;
  recommendation?: "recommend_approval" | "recommend_rejection" | "requires_resurvey" | "boundary_dispute" | null;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  created_at: string;
}

export interface FieldEvidence {
  id: string;
  claim_id: string;
  verification_id?: string | null;
  evidence_type: "photo" | "video" | "document" | "voice_note" | "gps_track" | "other";
  file_path: string;
  latitude?: number | null;
  longitude?: number | null;
  captured_at: string;
  uploaded_by?: string | null;
  description?: string | null;
  created_at: string;
}

export interface LandParcel {
  id: string;
  claim_id: string;
  ulpin?: string | null;
  survey_number?: string | null;
  plot_number?: string | null;
  area_calculated?: number | null;
  land_use?: string | null;
  source?: string | null;
  confidence?: number;
  geom?: unknown;
  centroid?: unknown;
  created_at: string;
  updated_at?: string;
}

export interface SpatialConflict {
  id: string;
  claim_id: string;
  conflict_type:
    | "forest_overlap"
    | "revenue_overlap"
    | "protected_area"
    | "waterbody_overlap"
    | "duplicate_claim"
    | "parcel_overlap"
    | "land_use_mismatch"
    | "canopy_loss"
    | "restricted_zone"
    | "other";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  intersecting_layer?: string | null;
  intersection_area?: number | null;
  confidence?: number;
  status: "active" | "investigating" | "resolved" | "dismissed";
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

export interface SatelliteObservation {
  id: string;
  claim_id?: string | null;
  parcel_id?: string | null;
  source: string;
  image_date: string;
  cloud_cover?: number | null;
  land_use_before?: string | null;
  land_use_after?: string | null;
  change_detected: boolean;
  change_confidence?: number | null;
  evidence_url?: string | null;
  model_version?: string;
  created_at: string;
}

export interface Scheme {
  code: string;
  name: string;
  department?: string | null;
  description: string | null;
  eligibility_json?: Record<string, unknown>;
  eligibility_rules?: Record<string, unknown>;
  benefit_description?: string | null;
  official_url?: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SchemeMatch {
  id: string;
  claimant_id: string;
  claim_id?: string | null;
  scheme_code: string;
  eligible: boolean;
  confidence?: number;
  reason?: string | null;
  matched_rules?: Record<string, unknown>[];
  status?: "recommended" | "applied" | "disbursed" | "rejected";
  reviewed_by?: string | null;
  matched_at: string;
  updated_at?: string;
}

export interface DSSRecommendation {
  id: string;
  claim_id: string;
  recommendation_type:
    | "scheme"
    | "field_verification"
    | "spatial_review"
    | "document_review"
    | "priority_claim"
    | "monitoring_alert";
  priority: "low" | "medium" | "high" | "urgent";
  recommendation: string;
  reason: string;
  evidence?: Record<string, unknown>;
  confidence?: number;
  generated_by?: string;
  model_version?: string;
  status: "pending" | "accepted" | "dismissed" | "actioned";
  created_at: string;
}

export interface Notification {
  id: string;
  user_id?: string | null;
  claim_id?: string | null;
  type:
    | "new_claim"
    | "review_required"
    | "claim_approved"
    | "claim_rejected"
    | "claim_returned"
    | "field_verification_required"
    | "field_verification_assigned"
    | "field_verification_completed"
    | "spatial_conflict"
    | "monitoring_alert";
  title: string;
  message: string;
  severity: "info" | "warning" | "error" | "success";
  read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  ip_address?: string | null;
  created_at: string;
}

export interface ClaimMapRow {
  claim_id: string;
  state_code: StateCode;
  state_name: string;
  claim_type: ClaimType;
  claim_number?: string | null;
  application_number?: string | null;
  area_claimed_hectares: number;
  area_verified_hectares?: number | null;
  status: ClaimStatus;
  current_stage?: string;
  priority_score?: number;
  submitted_on: string;
  decided_on: string | null;
  rejection_reason: string | null;
  return_reason?: string | null;
  digitized: boolean;
  claimant_id?: string;
  full_name: string;
  guardian_name?: string | null;
  gender?: "M" | "F" | "Other" | null;
  village: string;
  gram_panchayat?: string;
  block?: string;
  district: string;
  category: ClaimantCategory;
  household_size: number;
  phone?: string | null;
  lat: number;
  lng: number;
  ulpin?: string;
  geom_geojson?: any;
  has_canopy_violation?: boolean;
  has_restricted_zone_overlap?: boolean;
  has_spatial_conflict?: boolean;
  conflict_count?: number;
  created_at?: string;
}

export const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  IFR: "Individual Forest Rights",
  CR: "Community Rights",
  CFR: "Community Forest Resource Rights",
};

export const STATUS_COLORS: Record<string, string> = {
  approved: "var(--color-approved, #15803d)",
  pending: "var(--color-pending, #b45309)",
  rejected: "var(--color-rejected, #b91c1c)",
  submitted: "var(--color-water, #0284c7)",
  review_pending: "var(--color-pending, #b45309)",
  field_verification: "var(--color-water, #0284c7)",
  returned_for_correction: "var(--color-clay, #c2410c)",
};

export const STATUS_LABELS: Record<string, string> = {
  approved: "Approved",
  pending: "Pending Review",
  rejected: "Rejected",
  draft: "Draft",
  digitization_pending: "Digitizing",
  review_pending: "Review Pending",
  submitted: "Submitted",
  verification_pending: "Verification Pending",
  field_verification: "Field Verification",
  committee_review: "Committee Review",
  returned_for_correction: "Returned for Correction",
  archived: "Archived",
};
