-- Migration 006: GIS Layers, Spatial Conflicts, and Satellite Monitoring

-- 1. Extend land_parcels
alter table if exists land_parcels
  add column if not exists survey_number text,
  add column if not exists plot_number text,
  add column if not exists area_calculated numeric,
  add column if not exists land_use text default 'forest_agriculture',
  add column if not exists source text default 'gps_survey',
  add column if not exists confidence numeric default 95.0,
  add column if not exists updated_at timestamptz not null default now();

-- 2. gis_layers
create table if not exists gis_layers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  layer_type text not null check (
    layer_type in (
      'forest',
      'revenue',
      'administrative',
      'water',
      'agriculture',
      'land_use',
      'protected_area',
      'road',
      'village_boundary',
      'cfr',
      'custom'
    )
  ),
  source text,
  description text,
  storage_url text,
  visibility boolean not null default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. spatial_conflicts
create table if not exists spatial_conflicts (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims(id) on delete cascade,
  conflict_type text not null check (
    conflict_type in (
      'forest_overlap',
      'revenue_overlap',
      'protected_area',
      'waterbody_overlap',
      'duplicate_claim',
      'parcel_overlap',
      'land_use_mismatch',
      'canopy_loss',
      'restricted_zone',
      'other'
    )
  ),
  severity text not null default 'medium' check (
    severity in ('low', 'medium', 'high', 'critical')
  ),
  description text not null,
  intersecting_layer text,
  intersection_area numeric,
  geometry geometry(Polygon, 4326),
  confidence numeric default 90.0,
  status text not null default 'active' check (
    status in ('active', 'investigating', 'resolved', 'dismissed')
  ),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_spatial_conflicts_claim on spatial_conflicts(claim_id);
create index if not exists idx_spatial_conflicts_type on spatial_conflicts(conflict_type);
create index if not exists idx_spatial_conflicts_geom on spatial_conflicts using gist(geometry);

-- 4. satellite_observations
create table if not exists satellite_observations (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid references claims(id) on delete cascade,
  parcel_id uuid references land_parcels(id) on delete set null,
  source text not null default 'Sentinel-2',
  image_date date not null default current_date,
  cloud_cover numeric default 2.5,
  land_use_before text,
  land_use_after text,
  change_detected boolean not null default false,
  change_confidence numeric,
  geometry geometry(Polygon, 4326),
  evidence_url text,
  model_version text default 'v1.2.0-canopy-diff',
  created_at timestamptz not null default now()
);

create index if not exists idx_sat_obs_claim on satellite_observations(claim_id);
create index if not exists idx_sat_obs_geom on satellite_observations using gist(geometry);
