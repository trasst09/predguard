alter table public.user_quests
  add column if not exists submission_text text not null default '';

alter table public.user_quests
  add column if not exists submission_attachments jsonb not null default '[]'::jsonb;

create table if not exists public.mission_comments (
  id uuid primary key default gen_random_uuid(),
  mission_id text not null references public.missions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists mission_comments_set_updated_at on public.mission_comments;

create trigger mission_comments_set_updated_at
before update on public.mission_comments
for each row
execute function public.set_profiles_updated_at();

alter table public.mission_comments enable row level security;

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
