-- TRINETRA schema
-- Run this in Supabase SQL Editor BEFORE seed.sql
-- Requires the postgis extension (Database > Extensions > postgis)

create extension if not exists postgis;
create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ---------------------------------------------------------------------------
-- states: the four study states, with the context stats used on the landing
-- page and dashboard
-- ---------------------------------------------------------------------------
create table if not exists states (
  code text primary key,                 -- 'MP' | 'OD' | 'TS' | 'TR'
  name text not null,
  forest_cover_pct numeric,
  tribal_population_pct numeric
);

-- ---------------------------------------------------------------------------
-- claimants: the person/household behind a claim
-- ---------------------------------------------------------------------------
create table if not exists claimants (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  village text not null,
  district text not null,
  state_code text not null references states(code),
  category text not null check (category in ('ST', 'OTFD')), -- Scheduled Tribe / Other Traditional Forest Dweller
  household_size int not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists idx_claimants_state on claimants(state_code);

-- ---------------------------------------------------------------------------
-- claims: one FRA claim filed by a claimant
-- ---------------------------------------------------------------------------
create table if not exists claims (
  id uuid primary key default gen_random_uuid(),
  claimant_id uuid not null references claimants(id) on delete cascade,
  state_code text not null references states(code),
  claim_type text not null check (claim_type in ('IFR', 'CR', 'CFR')), -- Individual / Community / Community Forest Resource
  area_claimed_hectares numeric not null,
  status text not null check (status in ('approved', 'pending', 'rejected')),
  submitted_on date not null,
  decided_on date,
  rejection_reason text,
  digitized boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_claims_state on claims(state_code);
create index if not exists idx_claims_status on claims(status);
create index if not exists idx_claims_claimant on claims(claimant_id);

-- ---------------------------------------------------------------------------
-- land_parcels: geospatial footprint of a claim, used by the Atlas map
-- ---------------------------------------------------------------------------
create table if not exists land_parcels (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims(id) on delete cascade,
  ulpin text,
  geom geometry(Polygon, 4326) not null,
  centroid geometry(Point, 4326) not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_land_parcels_geom on land_parcels using gist(geom);
create index if not exists idx_land_parcels_centroid on land_parcels using gist(centroid);
create index if not exists idx_land_parcels_claim on land_parcels(claim_id);

-- ---------------------------------------------------------------------------
-- schemes: government scheme reference data used by the DSS (Day 5)
-- eligibility_json is deliberately loose now — the Day 5 rule engine defines
-- and consumes its exact shape.
-- ---------------------------------------------------------------------------
create table if not exists schemes (
  code text primary key,                 -- 'PM_KISAN' | 'MGNREGA' | 'JJM' | 'DAJGUA'
  name text not null,
  description text,
  eligibility_json jsonb not null default '{}'::jsonb
);

-- ---------------------------------------------------------------------------
-- scheme_matches: computed eligibility results (populated by the DSS rule
-- engine on Day 5 — table exists now so the schema is stable)
-- ---------------------------------------------------------------------------
create table if not exists scheme_matches (
  id uuid primary key default gen_random_uuid(),
  claimant_id uuid not null references claimants(id) on delete cascade,
  scheme_code text not null references schemes(code),
  eligible boolean not null,
  reason text,
  matched_at timestamptz not null default now(),
  unique (claimant_id, scheme_code)
);

-- ---------------------------------------------------------------------------
-- Row Level Security: this is a public demo, so allow anonymous read access
-- to everything. No writes are exposed to the anon key.
-- ---------------------------------------------------------------------------
alter table states enable row level security;
alter table claimants enable row level security;
alter table claims enable row level security;
alter table land_parcels enable row level security;
alter table schemes enable row level security;
alter table scheme_matches enable row level security;

create policy "public read states" on states for select using (true);
create policy "public read claimants" on claimants for select using (true);
create policy "public read claims" on claims for select using (true);
create policy "public read land_parcels" on land_parcels for select using (true);
create policy "public read schemes" on schemes for select using (true);
create policy "public read scheme_matches" on scheme_matches for select using (true);
