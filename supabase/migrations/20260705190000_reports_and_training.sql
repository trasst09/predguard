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
