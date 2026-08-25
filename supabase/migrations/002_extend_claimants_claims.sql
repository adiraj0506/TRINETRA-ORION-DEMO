-- Migration 002: Extend Claimants and Claims tables
-- Adds demographic, administrative, and tracking fields

-- 1. Extend claimants table
alter table if exists claimants
  add column if not exists guardian_name text,
  add column if not exists gender text check (gender in ('M', 'F', 'Other')),
  add column if not exists date_of_birth date,
  add column if not exists phone text,
  add column if not exists gram_panchayat text,
  add column if not exists block text,
  add column if not exists preferred_language text default 'eng',
  add column if not exists updated_at timestamptz not null default now();

-- 2. Extend claims table
alter table if exists claims
  add column if not exists claim_number text,
  add column if not exists application_number text,
  add column if not exists current_stage text default 'review_pending',
  add column if not exists area_verified_hectares numeric,
  add column if not exists survey_number text,
  add column if not exists plot_number text,
  add column if not exists village text,
  add column if not exists district text,
  add column if not exists gram_panchayat text,
  add column if not exists block text,
  add column if not exists revenue_village text,
  add column if not exists forest_range text,
  add column if not exists submitted_by uuid,
  add column if not exists verified_by uuid,
  add column if not exists approved_by uuid,
  add column if not exists return_reason text,
  add column if not exists priority_score int default 50,
  add column if not exists digitization_status text default 'completed',
  add column if not exists verification_status text default 'pending',
  add column if not exists updated_at timestamptz not null default now();

-- Ensure status check includes the extended statuses if new rows are inserted
-- We adjust or drop old check constraint if necessary, or keep standard statuses:
-- ('draft', 'digitization_pending', 'review_pending', 'submitted', 'verification_pending', 'field_verification', 'committee_review', 'approved', 'rejected', 'returned_for_correction', 'archived')
do $$
begin
  alter table claims drop constraint if exists claims_status_check;
  alter table claims add constraint claims_status_check check (
    status in (
      'draft',
      'digitization_pending',
      'review_pending',
      'submitted',
      'verification_pending',
      'field_verification',
      'committee_review',
      'approved',
      'rejected',
      'returned_for_correction',
      'archived',
      'pending' -- preserve backwards compat
    )
  );
exception
  when others then null;
end $$;

create index if not exists idx_claims_application on claims(application_number);
create index if not exists idx_claims_stage on claims(current_stage);
create index if not exists idx_claims_priority on claims(priority_score);
