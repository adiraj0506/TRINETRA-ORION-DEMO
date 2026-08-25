-- Migration 010: Row Level Security Policies and Realtime Setup

-- Enable RLS on all newly created tables
alter table if exists profiles enable row level security;
alter table if exists claim_documents enable row level security;
alter table if exists ocr_jobs enable row level security;
alter table if exists ocr_extracted_fields enable row level security;
alter table if exists claim_reviews enable row level security;
alter table if exists claim_status_history enable row level security;
alter table if exists workflow_tasks enable row level security;
alter table if exists field_verifications enable row level security;
alter table if exists field_evidence enable row level security;
alter table if exists gis_layers enable row level security;
alter table if exists spatial_conflicts enable row level security;
alter table if exists satellite_observations enable row level security;
alter table if exists dss_recommendations enable row level security;
alter table if exists notifications enable row level security;
alter table if exists audit_logs enable row level security;

-- Drop any previous conflicting policies safely
do $$
begin
  drop policy if exists "allow select profiles" on profiles;
  drop policy if exists "allow insert profiles" on profiles;
  drop policy if exists "allow update profiles" on profiles;
  drop policy if exists "allow insert claimants" on claimants;
  drop policy if exists "allow update claimants" on claimants;
  drop policy if exists "allow insert claims" on claims;
  drop policy if exists "allow update claims" on claims;
  drop policy if exists "allow insert land_parcels" on land_parcels;
  drop policy if exists "allow update land_parcels" on land_parcels;
  drop policy if exists "allow all claim_documents" on claim_documents;
  drop policy if exists "allow all ocr_jobs" on ocr_jobs;
  drop policy if exists "allow all ocr_extracted_fields" on ocr_extracted_fields;
  drop policy if exists "allow all claim_reviews" on claim_reviews;
  drop policy if exists "allow all claim_status_history" on claim_status_history;
  drop policy if exists "allow all workflow_tasks" on workflow_tasks;
  drop policy if exists "allow all field_verifications" on field_verifications;
  drop policy if exists "allow all field_evidence" on field_evidence;
  drop policy if exists "allow all gis_layers" on gis_layers;
  drop policy if exists "allow all spatial_conflicts" on spatial_conflicts;
  drop policy if exists "allow all satellite_observations" on satellite_observations;
  drop policy if exists "allow all schemes" on schemes;
  drop policy if exists "allow all scheme_matches" on scheme_matches;
  drop policy if exists "allow all dss_recommendations" on dss_recommendations;
  drop policy if exists "allow all notifications" on notifications;
  drop policy if exists "allow all audit_logs" on audit_logs;
exception when others then null;
end $$;

-- Create fresh comprehensive policies
create policy "allow select profiles" on profiles for select using (true);
create policy "allow insert profiles" on profiles for insert with check (true);
create policy "allow update profiles" on profiles for update using (true);

create policy "allow insert claimants" on claimants for insert with check (true);
create policy "allow update claimants" on claimants for update using (true);

create policy "allow insert claims" on claims for insert with check (true);
create policy "allow update claims" on claims for update using (true);

create policy "allow insert land_parcels" on land_parcels for insert with check (true);
create policy "allow update land_parcels" on land_parcels for update using (true);

create policy "allow all claim_documents" on claim_documents for all using (true) with check (true);
create policy "allow all ocr_jobs" on ocr_jobs for all using (true) with check (true);
create policy "allow all ocr_extracted_fields" on ocr_extracted_fields for all using (true) with check (true);

create policy "allow all claim_reviews" on claim_reviews for all using (true) with check (true);
create policy "allow all claim_status_history" on claim_status_history for all using (true) with check (true);
create policy "allow all workflow_tasks" on workflow_tasks for all using (true) with check (true);

create policy "allow all field_verifications" on field_verifications for all using (true) with check (true);
create policy "allow all field_evidence" on field_evidence for all using (true) with check (true);

create policy "allow all gis_layers" on gis_layers for all using (true) with check (true);
create policy "allow all spatial_conflicts" on spatial_conflicts for all using (true) with check (true);
create policy "allow all satellite_observations" on satellite_observations for all using (true) with check (true);

create policy "allow all schemes" on schemes for all using (true) with check (true);
create policy "allow all scheme_matches" on scheme_matches for all using (true) with check (true);
create policy "allow all dss_recommendations" on dss_recommendations for all using (true) with check (true);

create policy "allow all notifications" on notifications for all using (true) with check (true);
create policy "allow all audit_logs" on audit_logs for all using (true) with check (true);

grant all on all tables in schema public to anon, authenticated, postgres, service_role;
grant all on all sequences in schema public to anon, authenticated, postgres, service_role;
grant all on all routines in schema public to anon, authenticated, postgres, service_role;
