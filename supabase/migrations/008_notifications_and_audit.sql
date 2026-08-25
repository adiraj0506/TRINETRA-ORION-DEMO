-- Migration 008: Notifications and Audit Logs

-- 1. notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  claim_id uuid references claims(id) on delete cascade,
  type text not null check (
    type in (
      'new_claim',
      'review_required',
      'claim_approved',
      'claim_rejected',
      'claim_returned',
      'field_verification_required',
      'field_verification_assigned',
      'field_verification_completed',
      'spatial_conflict',
      'monitoring_alert'
    )
  ),
  title text not null,
  message text not null,
  severity text not null default 'info' check (
    severity in ('info', 'warning', 'error', 'success')
  ),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on notifications(user_id);
create index if not exists idx_notifications_claim on notifications(claim_id);
create index if not exists idx_notifications_read on notifications(read);

-- 2. audit_logs
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  old_data jsonb default '{}'::jsonb,
  new_data jsonb default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_entity on audit_logs(entity_type, entity_id);
create index if not exists idx_audit_logs_user on audit_logs(user_id);
create index if not exists idx_audit_logs_action on audit_logs(action);
create index if not exists idx_audit_logs_time on audit_logs(created_at desc);

-- 3. Automatic status transition audit trigger on claims table
create or replace function log_claim_status_changes()
returns trigger as $$
begin
  if (TG_OP = 'UPDATE') then
    if (OLD.status is distinct from NEW.status or OLD.current_stage is distinct from NEW.current_stage) then
      -- Insert status history record
      insert into claim_status_history (
        claim_id,
        old_status,
        new_status,
        changed_by,
        reason,
        metadata
      ) values (
        NEW.id,
        OLD.status,
        NEW.status,
        NEW.verified_by,
        coalesce(NEW.rejection_reason, NEW.return_reason, 'Status update'),
        jsonb_build_object(
          'old_stage', OLD.current_stage,
          'new_stage', NEW.current_stage,
          'decided_on', NEW.decided_on
        )
      );

      -- Insert audit log
      insert into audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        old_data,
        new_data
      ) values (
        NEW.verified_by,
        'claim.status_changed',
        'claim',
        NEW.id,
        jsonb_build_object('status', OLD.status, 'stage', OLD.current_stage),
        jsonb_build_object('status', NEW.status, 'stage', NEW.current_stage, 'reason', coalesce(NEW.rejection_reason, NEW.return_reason))
      );
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_claim_status_audit on claims;
create trigger trg_claim_status_audit
after update on claims
for each row
execute function log_claim_status_changes();
