-- Migration 004: Workflow Tasks, Reviews, and Status History

-- 1. claim_reviews
create table if not exists claim_reviews (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims(id) on delete cascade,
  reviewer_id uuid,
  review_stage text not null check (
    review_stage in (
      'digitization',
      'document_review',
      'field_verification',
      'frc',
      'sdlc',
      'dlc',
      'admin'
    )
  ),
  decision text not null check (
    decision in ('approved', 'rejected', 'returned', 'needs_field_verification', 'under_review')
  ),
  comments text,
  reviewed_at timestamptz not null default now()
);

create index if not exists idx_claim_reviews_claim on claim_reviews(claim_id);

-- 2. claim_status_history
create table if not exists claim_status_history (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid,
  reason text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_claim_history_claim on claim_status_history(claim_id);

-- 3. workflow_tasks
create table if not exists workflow_tasks (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims(id) on delete cascade,
  assigned_to uuid,
  assigned_role text check (
    assigned_role in (
      'gram_sabha_member',
      'frc_officer',
      'field_officer',
      'sdlc_officer',
      'dlc_officer',
      'admin'
    )
  ),
  stage text not null,
  status text not null default 'pending' check (
    status in ('pending', 'in_progress', 'completed', 'cancelled')
  ),
  priority text not null default 'medium' check (
    priority in ('low', 'medium', 'high', 'urgent')
  ),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_workflow_tasks_claim on workflow_tasks(claim_id);
create index if not exists idx_workflow_tasks_assigned on workflow_tasks(assigned_to);
create index if not exists idx_workflow_tasks_status on workflow_tasks(status);
