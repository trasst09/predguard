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

alter table public.app_sessions enable row level security;

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
