-- Migration 001: Profiles and User Roles
create extension if not exists pgcrypto;
create extension if not exists postgis;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique,
  phone text,
  role text not null check (
    role in (
      'claimant',
      'gram_sabha_member',
      'frc_officer',
      'field_officer',
      'sdlc_officer',
      'dlc_officer',
      'admin',
      'super_admin'
    )
  ) default 'claimant',
  state_code text references states(code),
  district text,
  block text,
  village text,
  preferred_language text default 'eng',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_profiles_state on profiles(state_code);
