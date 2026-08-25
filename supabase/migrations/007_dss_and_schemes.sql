-- Migration 007: Decision Support System (DSS) and Schemes Expansion

-- 1. Extend schemes
alter table if exists schemes
  add column if not exists department text,
  add column if not exists eligibility_rules jsonb default '{}'::jsonb,
  add column if not exists benefit_description text,
  add column if not exists official_url text,
  add column if not exists active boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- 2. Extend scheme_matches
alter table if exists scheme_matches
  add column if not exists claim_id uuid references claims(id) on delete cascade,
  add column if not exists confidence numeric default 100.0,
  add column if not exists matched_rules jsonb default '[]'::jsonb,
  add column if not exists status text default 'recommended' check (
    status in ('recommended', 'applied', 'disbursed', 'rejected')
  ),
  add column if not exists reviewed_by uuid,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_scheme_matches_claim on scheme_matches(claim_id);

-- 3. dss_recommendations
create table if not exists dss_recommendations (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims(id) on delete cascade,
  recommendation_type text not null check (
    recommendation_type in (
      'scheme',
      'field_verification',
      'spatial_review',
      'document_review',
      'priority_claim',
      'monitoring_alert'
    )
  ),
  priority text not null default 'medium' check (
    priority in ('low', 'medium', 'high', 'urgent')
  ),
  recommendation text not null,
  reason text not null,
  evidence jsonb default '{}'::jsonb,
  confidence numeric default 95.0,
  generated_by text default 'rules_engine_v1',
  model_version text default '1.0.0',
  status text not null default 'pending' check (
    status in ('pending', 'accepted', 'dismissed', 'actioned')
  ),
  created_at timestamptz not null default now()
);

create index if not exists idx_dss_rec_claim on dss_recommendations(claim_id);
create index if not exists idx_dss_rec_type on dss_recommendations(recommendation_type);
