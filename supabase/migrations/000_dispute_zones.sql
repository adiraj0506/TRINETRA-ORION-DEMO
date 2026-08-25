-- Migration 000: Dispute Zones setup
create table if not exists dispute_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  zone_type text not null check (zone_type in ('canopy_loss', 'restricted_zone')),
  geom geometry(Polygon, 4326) not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_dispute_zones_geom on dispute_zones using gist(geom);

alter table dispute_zones enable row level security;

do $$
begin
  drop policy if exists "public read dispute_zones" on dispute_zones;
  create policy "public read dispute_zones" on dispute_zones for select using (true);
exception when others then null;
end $$;

grant select on dispute_zones to anon, authenticated;

-- Seed dispute zones around a sample of land parcels if empty
do $$
begin
  if not exists (select 1 from dispute_zones limit 1) then
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
  end if;
end $$;

create or replace view dispute_zones_map as
select
  id,
  name,
  zone_type,
  ST_AsGeoJSON(geom)::json as geojson
from dispute_zones;

grant select on dispute_zones_map to anon, authenticated;
