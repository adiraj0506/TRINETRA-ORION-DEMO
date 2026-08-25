-- Day 11: Dispute Zones & Spatial Intersection Setup
-- Run this in the Supabase SQL Editor.

-- 1. Create dispute_zones table
create table if not exists dispute_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  zone_type text not null check (zone_type in ('canopy_loss', 'restricted_zone')),
  geom geometry(Polygon, 4326) not null,
  created_at timestamptz not null default now()
);

-- Spatial index for dispute_zones
create index if not exists idx_dispute_zones_geom on dispute_zones using gist(geom);

-- Enable RLS and setup select policy for public read access
alter table dispute_zones enable row level security;

create policy "public read dispute_zones" on dispute_zones
  for select using (true);

grant select on dispute_zones to anon, authenticated;

-- 2. Seed dispute zones by drawing slightly buffered zones around a subset of existing claims.
-- This ensures that some claims will have a real spatial intersection.
-- Note: We use ST_Buffer(geom, 0.002) for canopy loss (~200m buffer) and ST_Buffer(geom, 0.003) for restricted zones.
insert into dispute_zones (name, zone_type, geom)
select 
  'Active Canopy Loss Zone ' || substring(claim_id::text, 1, 8),
  'canopy_loss',
  ST_Buffer(geom, 0.002)
from land_parcels
limit 25;

insert into dispute_zones (name, zone_type, geom)
select 
  'Restricted Conservation Zone ' || substring(claim_id::text, 1, 8),
  'restricted_zone',
  ST_Buffer(geom, 0.003)
from land_parcels
offset 25
limit 15;

-- 3. Recreate the claims_map view to include spatial intersection check flags
create or replace view claims_map as
select
  c.id as claim_id,
  c.state_code,
  s.name as state_name,
  c.claim_type,
  c.area_claimed_hectares,
  c.status,
  c.submitted_on,
  c.decided_on,
  c.rejection_reason,
  c.digitized,
  cl.full_name,
  cl.village,
  cl.district,
  cl.category,
  cl.household_size,
  ST_Y(lp.centroid) as lat,
  ST_X(lp.centroid) as lng,
  lp.ulpin,
  ST_AsGeoJSON(lp.geom)::json as geom_geojson,
  exists(
    select 1 from dispute_zones dz
    where ST_Intersects(lp.geom, dz.geom) and dz.zone_type = 'canopy_loss'
  ) as has_canopy_violation,
  exists(
    select 1 from dispute_zones dz
    where ST_Intersects(lp.geom, dz.geom) and dz.zone_type = 'restricted_zone'
  ) as has_restricted_zone_overlap
from claims c
join claimants cl on cl.id = c.claimant_id
join states s on s.code = c.state_code
join land_parcels lp on lp.claim_id = c.id;

grant select on claims_map to anon, authenticated;

-- 4. Create dispute_zones_map view to serve polygons directly as GeoJSON to the client
create or replace view dispute_zones_map as
select
  id,
  name,
  zone_type,
  ST_AsGeoJSON(geom)::json as geojson
from dispute_zones;

grant select on dispute_zones_map to anon, authenticated;
