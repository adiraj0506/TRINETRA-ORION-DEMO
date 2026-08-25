-- Day 3: Atlas map view
-- Run this in the Supabase SQL Editor AFTER schema.sql and seed.sql.
-- Flattens claim + claimant + state + parcel centroid into one row per
-- claim, with lat/lng as plain floats (instead of PostGIS WKB) so the
-- frontend can consume it directly with no geometry parsing.

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
  ST_AsGeoJSON(lp.geom)::json as geom_geojson
from claims c
join claimants cl on cl.id = c.claimant_id
join states s on s.code = c.state_code
join land_parcels lp on lp.claim_id = c.id;

-- RLS on the base tables doesn't automatically extend to views — grant
-- explicit read access to the anon role Supabase uses for the public site.
grant select on claims_map to anon, authenticated;
