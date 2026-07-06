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

create table if not exists public.missions (
  id text primary key,
  type text not null check (type in ('online', 'hybrid', 'realworld')),
  risk text not null default '',
  title text not null,
  quest_giver text not null default '',
  quest_confirmer text not null default '',
  description text not null default '',
  location text not null default '',
  schedule text not null default '',
  roles text[] not null default '{}',
  protocol text not null default '',
  minimum_role text not null default 'Spotter / Tipster',
  min_readiness integer not null default 0 check (min_readiness >= 0 and min_readiness <= 100),
  xp_reward integer not null default 0 check (xp_reward >= 0),
  readiness_reward integer not null default 0 check (readiness_reward >= 0 and readiness_reward <= 100),
  reward_label text not null default '',
  steps text[] not null default '{}',
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mission_id text not null,
  status text not null default 'accepted' check (status in ('accepted', 'submitted', 'needs_revision', 'confirmed')),
  progress_percent integer not null default 0 check (progress_percent >= 0 and progress_percent <= 100),
  notes text not null default '',
  submission_text text not null default '',
  submission_attachments jsonb not null default '[]'::jsonb,
  xp_reward integer not null default 0 check (xp_reward >= 0),
  readiness_reward integer not null default 0 check (readiness_reward >= 0),
  started_at timestamptz not null default timezone('utc', now()),
  submitted_at timestamptz,
  reward_granted_at timestamptz,
  confirmed_at timestamptz,
  confirmed_by uuid references public.profiles(id) on delete set null,
  confirmation_notes text not null default '',
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, mission_id)
);

create table if not exists public.mission_comments (
  id uuid primary key default gen_random_uuid(),
  mission_id text not null references public.missions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
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

create table if not exists public.app_sessions (
  token_hash text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists app_sessions_user_id_idx
on public.app_sessions(user_id);

create index if not exists app_sessions_expires_at_idx
on public.app_sessions(expires_at);

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

alter table public.user_quests
  drop constraint if exists user_quests_status_check;

alter table public.user_quests
  add constraint user_quests_status_check
  check (status in ('accepted', 'submitted', 'needs_revision', 'confirmed'));

alter table public.user_quests add column if not exists submitted_at timestamptz;
alter table public.user_quests add column if not exists reward_granted_at timestamptz;
alter table public.user_quests add column if not exists confirmed_at timestamptz;
alter table public.user_quests add column if not exists confirmed_by uuid references public.profiles(id) on delete set null;
alter table public.user_quests add column if not exists confirmation_notes text not null default '';
alter table public.user_quests add column if not exists submission_text text not null default '';
alter table public.user_quests add column if not exists submission_attachments jsonb not null default '[]'::jsonb;

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

drop trigger if exists missions_set_updated_at on public.missions;

create trigger missions_set_updated_at
before update on public.missions
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

drop trigger if exists mission_comments_set_updated_at on public.mission_comments;

create trigger mission_comments_set_updated_at
before update on public.mission_comments
for each row
execute function public.set_profiles_updated_at();

alter table public.profiles enable row level security;
alter table public.missions enable row level security;
alter table public.user_quests enable row level security;
alter table public.identity_verifications enable row level security;
alter table public.mission_comments enable row level security;
alter table public.app_sessions enable row level security;

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

drop policy if exists "Missions are readable by service role only" on public.missions;
create policy "Missions are readable by service role only"
on public.missions
for select
to service_role
using (true);

drop policy if exists "Missions are writable by service role only" on public.missions;
create policy "Missions are writable by service role only"
on public.missions
for all
to service_role
using (true)
with check (true);

drop policy if exists "Authenticated users can read missions" on public.missions;
create policy "Authenticated users can read missions"
on public.missions
for select
to authenticated
using (true);

drop policy if exists "Admins can create missions" on public.missions;
create policy "Admins can create missions"
on public.missions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where id = auth.uid() and is_admin = true
  )
);

drop policy if exists "Admins can update missions" on public.missions;
create policy "Admins can update missions"
on public.missions
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where id = auth.uid() and is_admin = true
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where id = auth.uid() and is_admin = true
  )
);

drop policy if exists "Admins can delete missions" on public.missions;
create policy "Admins can delete missions"
on public.missions
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where id = auth.uid() and is_admin = true
  )
);

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

drop policy if exists "Mission comments are readable by service role only" on public.mission_comments;
create policy "Mission comments are readable by service role only"
on public.mission_comments
for select
to service_role
using (true);

drop policy if exists "Mission comments are writable by service role only" on public.mission_comments;
create policy "Mission comments are writable by service role only"
on public.mission_comments
for all
to service_role
using (true)
with check (true);

drop policy if exists "Authenticated users can read mission comments" on public.mission_comments;
create policy "Authenticated users can read mission comments"
on public.mission_comments
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can create mission comments" on public.mission_comments;
create policy "Authenticated users can create mission comments"
on public.mission_comments
for insert
to authenticated
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

drop policy if exists "App sessions are readable by service role only" on public.app_sessions;
create policy "App sessions are readable by service role only"
on public.app_sessions
for select
to service_role
using (true);

drop policy if exists "App sessions are writable by service role only" on public.app_sessions;
create policy "App sessions are writable by service role only"
on public.app_sessions
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

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mission_id text references public.missions(id) on delete set null,
  category text not null default 'online' check (category in ('online', 'real_world', 'other')),
  platform text not null default '',
  summary text not null default '',
  external_reference text not null default '',
  evidence_attachments jsonb not null default '[]'::jsonb,
  status text not null default 'submitted' check (
    status in ('submitted', 'in_review', 'validated', 'rejected', 'forwarded_to_le')
  ),
  review_notes text not null default '',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  reward_granted_at timestamptz,
  xp_reward integer not null default 0 check (xp_reward >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists reports_user_id_idx
on public.reports(user_id);

create index if not exists reports_status_idx
on public.reports(status);

create table if not exists public.user_training_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_id text not null,
  status text not null default 'not_started' check (
    status in ('not_started', 'in_progress', 'completed')
  ),
  progress_percent integer not null default 0 check (progress_percent >= 0 and progress_percent <= 100),
  quiz_score integer check (quiz_score is null or (quiz_score >= 0 and quiz_score <= 100)),
  attempts integer not null default 0 check (attempts >= 0),
  xp_reward integer not null default 0 check (xp_reward >= 0),
  readiness_reward integer not null default 0 check (readiness_reward >= 0),
  reward_granted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, module_id)
);

create index if not exists user_training_progress_user_id_idx
on public.user_training_progress(user_id);

drop trigger if exists reports_set_updated_at on public.reports;

create trigger reports_set_updated_at
before update on public.reports
for each row
execute function public.set_profiles_updated_at();

drop trigger if exists user_training_progress_set_updated_at on public.user_training_progress;

create trigger user_training_progress_set_updated_at
before update on public.user_training_progress
for each row
execute function public.set_profiles_updated_at();

alter table public.reports enable row level security;
alter table public.user_training_progress enable row level security;

drop policy if exists "Reports are readable by service role only" on public.reports;
create policy "Reports are readable by service role only"
on public.reports
for select
to service_role
using (true);

drop policy if exists "Reports are writable by service role only" on public.reports;
create policy "Reports are writable by service role only"
on public.reports
for all
to service_role
using (true)
with check (true);

drop policy if exists "Users can read their own reports" on public.reports;
create policy "Users can read their own reports"
on public.reports
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their own reports" on public.reports;
create policy "Users can create their own reports"
on public.reports
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Training progress is readable by service role only" on public.user_training_progress;
create policy "Training progress is readable by service role only"
on public.user_training_progress
for select
to service_role
using (true);

drop policy if exists "Training progress is writable by service role only" on public.user_training_progress;
create policy "Training progress is writable by service role only"
on public.user_training_progress
for all
to service_role
using (true)
with check (true);

drop policy if exists "Users can read their own training progress" on public.user_training_progress;
create policy "Users can read their own training progress"
on public.user_training_progress
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can upsert their own training progress" on public.user_training_progress;
create policy "Users can upsert their own training progress"
on public.user_training_progress
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own training progress" on public.user_training_progress;
create policy "Users can update their own training progress"
on public.user_training_progress
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
