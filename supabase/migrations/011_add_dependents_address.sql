-- Migration 011: Add Dependents and Address to Claimants
-- Aligns schema with official Annexure-II structure

alter table if exists claimants
  add column if not exists dependents text,
  add column if not exists address text;

-- Drop view to prevent column matching errors during replacement
drop view if exists claims_map cascade;

-- Update the claims_map view to include these columns
create or replace view claims_map as
select
  c.id as claim_id,
  c.state_code,
  s.name as state_name,
  c.claim_type,
  c.claim_number,
  c.application_number,
  c.area_claimed_hectares,
  c.area_verified_hectares,
  c.status,
  c.current_stage,
  c.priority_score,
  c.submitted_on,
  c.decided_on,
  c.rejection_reason,
  c.return_reason,
  c.digitized,
  cl.id as claimant_id,
  cl.full_name,
  cl.guardian_name,
  cl.gender,
  cl.village,
  coalesce(c.gram_panchayat, cl.gram_panchayat, cl.village) as gram_panchayat,
  coalesce(c.block, cl.block, cl.district) as block,
  cl.district,
  cl.category,
  cl.household_size,
  cl.phone,
  cl.dependents,
  cl.address,
  coalesce(ST_Y(lp.centroid), 20.9517) as lat,
  coalesce(ST_X(lp.centroid), 85.0985) as lng,
  lp.ulpin,
  case 
    when lp.geom is not null then ST_AsGeoJSON(lp.geom)::json
    else null
  end as geom_geojson,
  exists(
    select 1 from spatial_conflicts sc
    where sc.claim_id = c.id and sc.conflict_type = 'canopy_loss' and sc.status = 'active'
  ) or exists(
    select 1 from dispute_zones dz
    where lp.geom is not null and ST_Intersects(lp.geom, dz.geom) and dz.zone_type = 'canopy_loss'
  ) as has_canopy_violation,
  exists(
    select 1 from spatial_conflicts sc
    where sc.claim_id = c.id and sc.conflict_type in ('restricted_zone', 'protected_area') and sc.status = 'active'
  ) or exists(
    select 1 from dispute_zones dz
    where lp.geom is not null and ST_Intersects(lp.geom, dz.geom) and dz.zone_type = 'restricted_zone'
  ) as has_restricted_zone_overlap,
  exists(
    select 1 from spatial_conflicts sc
    where sc.claim_id = c.id and sc.status = 'active'
  ) as has_spatial_conflict,
  (
    select count(*) from spatial_conflicts sc
    where sc.claim_id = c.id and sc.status = 'active'
  ) as conflict_count,
  c.created_at
from claims c
join claimants cl on cl.id = c.claimant_id
join states s on s.code = c.state_code
left join land_parcels lp on lp.claim_id = c.id;

grant select on claims_map to anon, authenticated;
