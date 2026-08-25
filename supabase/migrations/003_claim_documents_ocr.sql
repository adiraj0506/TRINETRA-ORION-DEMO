-- Migration 003: Claim Documents, OCR Jobs, and Extracted Fields

-- 1. claim_documents
create table if not exists claim_documents (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims(id) on delete cascade,
  document_type text not null check (
    document_type in (
      'claim_form',
      'patta',
      'gram_sabha_resolution',
      'identity_document',
      'land_record',
      'supporting_evidence',
      'field_photo',
      'other'
    )
  ),
  document_name text not null,
  storage_path text not null,
  document_url text,
  mime_type text,
  file_size bigint,
  language text default 'eng',
  uploaded_by uuid,
  uploaded_at timestamptz not null default now(),
  ocr_status text default 'pending' check (
    ocr_status in ('pending', 'processing', 'completed', 'failed', 'skipped')
  ),
  review_status text default 'pending' check (
    review_status in ('pending', 'verified', 'rejected', 'flagged')
  ),
  created_at timestamptz not null default now()
);

create index if not exists idx_claim_docs_claim on claim_documents(claim_id);

-- 2. ocr_jobs
create table if not exists ocr_jobs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references claim_documents(id) on delete cascade,
  status text not null default 'queued' check (
    status in ('queued', 'processing', 'completed', 'failed', 'needs_review')
  ),
  engine text not null default 'tesseract' check (
    engine in ('tesseract', 'paddleocr', 'manual')
  ),
  language text default 'eng',
  started_at timestamptz,
  completed_at timestamptz,
  processing_time_ms int,
  confidence numeric,
  raw_text text,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ocr_jobs_doc on ocr_jobs(document_id);
create index if not exists idx_ocr_jobs_status on ocr_jobs(status);

-- 3. ocr_extracted_fields
create table if not exists ocr_extracted_fields (
  id uuid primary key default gen_random_uuid(),
  ocr_job_id uuid not null references ocr_jobs(id) on delete cascade,
  field_name text not null,
  field_value text,
  normalized_value text,
  confidence numeric,
  bounding_box jsonb,
  validation_status text default 'unverified' check (
    validation_status in ('unverified', 'auto_matched', 'human_verified', 'rejected', 'edited')
  ),
  reviewed_value text,
  reviewed_by uuid,
  reviewed_at timestamptz
);

create index if not exists idx_ocr_fields_job on ocr_extracted_fields(ocr_job_id);
create index if not exists idx_ocr_fields_name on ocr_extracted_fields(field_name);
