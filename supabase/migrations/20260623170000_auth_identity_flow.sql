create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  role text not null default 'Spotter / Tipster',
  region text not null default 'United States',
  verification_status text not null default 'Email verified / ID pending',
  points integer not null default 100 check (points >= 0),
  readiness_score integer not null default 35 check (readiness_score >= 0 and readiness_score <= 100),
  is_admin boolean not null default false,
  legal_version text not null default '2026-06-22',
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  location_tracking_preference text not null default 'unset' check (
    location_tracking_preference in ('unset', 'device', 'manual', 'declined')
  ),
  location_tracking_updated_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mission_id text not null,
  status text not null default 'active' check (status in ('active', 'completed')),
  progress_percent integer not null default 0 check (progress_percent >= 0 and progress_percent <= 100),
  notes text not null default '',
  xp_reward integer not null default 0 check (xp_reward >= 0),
  readiness_reward integer not null default 0 check (readiness_reward >= 0),
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, mission_id)
);

create table if not exists public.identity_verifications (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  legal_name text,
  phone_number text,
  city text,
  state text,
  birth_date date,
  id_document_type text not null default 'unset',
  id_document_last4 text,
  officer_path_requested boolean not null default false,
  officer_department text,
  officer_work_email text,
  background_consent_at timestamptz,
  training_acknowledged_at timestamptz,
  code_of_conduct_accepted_at timestamptz,
  status text not null default 'draft' check (
    status in ('draft', 'submitted', 'in_review', 'changes_requested', 'approved', 'rejected')
  ),
  review_notes text not null default '',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles add column if not exists legal_version text not null default '2026-06-22';
alter table public.profiles add column if not exists terms_accepted_at timestamptz;
alter table public.profiles add column if not exists privacy_accepted_at timestamptz;
alter table public.profiles add column if not exists location_tracking_preference text not null default 'unset';
alter table public.profiles add column if not exists location_tracking_updated_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_location_tracking_preference_check;

alter table public.profiles
  add constraint profiles_location_tracking_preference_check
  check (location_tracking_preference in ('unset', 'device', 'manual', 'declined'));

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();

drop trigger if exists user_quests_set_updated_at on public.user_quests;

create trigger user_quests_set_updated_at
before update on public.user_quests
for each row
execute function public.set_profiles_updated_at();

drop trigger if exists identity_verifications_set_updated_at on public.identity_verifications;

create trigger identity_verifications_set_updated_at
before update on public.identity_verifications
for each row
execute function public.set_profiles_updated_at();

alter table public.profiles enable row level security;
alter table public.user_quests enable row level security;
alter table public.identity_verifications enable row level security;

drop policy if exists "Profiles are readable by service role only" on public.profiles;
create policy "Profiles are readable by service role only"
on public.profiles
for select
to service_role
using (true);

drop policy if exists "Profiles are writable by service role only" on public.profiles;
create policy "Profiles are writable by service role only"
on public.profiles
for all
to service_role
using (true)
with check (true);

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "User quests are readable by service role only" on public.user_quests;
create policy "User quests are readable by service role only"
on public.user_quests
for select
to service_role
using (true);

drop policy if exists "User quests are writable by service role only" on public.user_quests;
create policy "User quests are writable by service role only"
on public.user_quests
for all
to service_role
using (true)
with check (true);

drop policy if exists "Users can read their own quests" on public.user_quests;
create policy "Users can read their own quests"
on public.user_quests
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own quests" on public.user_quests;
create policy "Users can insert their own quests"
on public.user_quests
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own quests" on public.user_quests;
create policy "Users can update their own quests"
on public.user_quests
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Identity verifications are readable by service role only" on public.identity_verifications;
create policy "Identity verifications are readable by service role only"
on public.identity_verifications
for select
to service_role
using (true);

drop policy if exists "Identity verifications are writable by service role only" on public.identity_verifications;
create policy "Identity verifications are writable by service role only"
on public.identity_verifications
for all
to service_role
using (true)
with check (true);

drop policy if exists "Users can read their own identity verification" on public.identity_verifications;
create policy "Users can read their own identity verification"
on public.identity_verifications
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own identity verification" on public.identity_verifications;
create policy "Users can insert their own identity verification"
on public.identity_verifications
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own identity verification" on public.identity_verifications;
create policy "Users can update their own identity verification"
on public.identity_verifications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
