-- Migration 005: Field Verifications and Evidence

-- 1. field_verifications
create table if not exists field_verifications (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims(id) on delete cascade,
  officer_id uuid,
  visit_date date not null default current_date,
  latitude numeric,
  longitude numeric,
  accuracy_m numeric,
  geom geometry(Point, 4326),
  observed_area numeric,
  land_use text,
  occupation_type text,
  forest_presence boolean default true,
  claimant_present boolean default true,
  documents_verified boolean default true,
  photo_evidence jsonb default '[]'::jsonb,
  notes text,
  recommendation text check (
    recommendation in ('recommend_approval', 'recommend_rejection', 'requires_resurvey', 'boundary_dispute')
  ),
  status text not null default 'completed' check (
    status in ('scheduled', 'in_progress', 'completed', 'cancelled')
  ),
  created_at timestamptz not null default now()
);

create index if not exists idx_field_verif_claim on field_verifications(claim_id);
create index if not exists idx_field_verif_geom on field_verifications using gist(geom);

-- 2. field_evidence
create table if not exists field_evidence (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims(id) on delete cascade,
  verification_id uuid references field_verifications(id) on delete set null,
  evidence_type text not null check (
    evidence_type in ('photo', 'video', 'document', 'voice_note', 'gps_track', 'other')
  ),
  file_path text not null,
  latitude numeric,
  longitude numeric,
  captured_at timestamptz not null default now(),
  uploaded_by uuid,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists idx_field_evidence_claim on field_evidence(claim_id);
create index if not exists idx_field_evidence_verif on field_evidence(verification_id);
