-- Field operations tooling: consent-based account linking, evidence vault with
-- chain-of-custody events, safety events (check-ins / panic / backup), and
-- expiring location shares. Mirrors the reports/training migration conventions
-- (service_role full access, authenticated own-row access, shared updated_at trigger).

-- 1. Consent-based external account linking ---------------------------------
create table if not exists public.linked_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (
    platform in ('discord', 'instagram', 'snapchat', 'roblox', 'other')
  ),
  handle text not null default '',
  consent_scopes jsonb not null default '[]'::jsonb,
  status text not null default 'linked' check (status in ('linked', 'revoked')),
  linked_at timestamptz not null default timezone('utc', now()),
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, platform)
);

create index if not exists linked_accounts_user_id_idx
on public.linked_accounts(user_id);

-- 2. Evidence vault ----------------------------------------------------------
create table if not exists public.evidence_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  report_id uuid references public.reports(id) on delete set null,
  mission_id text references public.missions(id) on delete set null,
  kind text not null default 'note' check (
    kind in ('photo', 'video', 'audio', 'screenshot', 'note', 'other')
  ),
  label text not null default '',
  notes text not null default '',
  storage_ref text not null default '',
  sensitivity text not null default 'standard' check (
    sensitivity in ('standard', 'sensitive', 'le_only')
  ),
  status text not null default 'sealed' check (status in ('sealed', 'open', 'exported')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists evidence_items_user_id_idx
on public.evidence_items(user_id);

create table if not exists public.evidence_custody_events (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references public.evidence_items(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (
    action in ('created', 'viewed', 'transferred', 'sealed', 'exported', 'note_added')
  ),
  detail text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists evidence_custody_events_evidence_id_idx
on public.evidence_custody_events(evidence_id);

-- 3. Safety events: check-ins, panic escalation, backup requests -------------
create table if not exists public.safety_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mission_id text references public.missions(id) on delete set null,
  type text not null check (type in ('check_in', 'panic', 'backup')),
  status text not null default 'active' check (
    status in ('active', 'acknowledged', 'resolved')
  ),
  message text not null default '',
  location_label text not null default '',
  acknowledged_by uuid references public.profiles(id) on delete set null,
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists safety_events_user_id_idx
on public.safety_events(user_id);

create index if not exists safety_events_status_idx
on public.safety_events(status);

-- 4. Expiring location shares ------------------------------------------------
create table if not exists public.location_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mission_id text references public.missions(id) on delete set null,
  label text not null default '',
  latitude double precision,
  longitude double precision,
  precision text not null default 'approx' check (precision in ('approx', 'exact')),
  status text not null default 'active' check (status in ('active', 'expired', 'revoked')),
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists location_shares_user_id_idx
on public.location_shares(user_id);

-- updated_at triggers (reuse the shared function from the profiles migration) -
drop trigger if exists linked_accounts_set_updated_at on public.linked_accounts;
create trigger linked_accounts_set_updated_at
before update on public.linked_accounts
for each row execute function public.set_profiles_updated_at();

drop trigger if exists evidence_items_set_updated_at on public.evidence_items;
create trigger evidence_items_set_updated_at
before update on public.evidence_items
for each row execute function public.set_profiles_updated_at();

drop trigger if exists safety_events_set_updated_at on public.safety_events;
create trigger safety_events_set_updated_at
before update on public.safety_events
for each row execute function public.set_profiles_updated_at();

drop trigger if exists location_shares_set_updated_at on public.location_shares;
create trigger location_shares_set_updated_at
before update on public.location_shares
for each row execute function public.set_profiles_updated_at();

-- RLS -----------------------------------------------------------------------
alter table public.linked_accounts enable row level security;
alter table public.evidence_items enable row level security;
alter table public.evidence_custody_events enable row level security;
alter table public.safety_events enable row level security;
alter table public.location_shares enable row level security;

-- Service role manages everything (server transport runs as service role).
do $$
declare
  t text;
begin
  foreach t in array array[
    'linked_accounts', 'evidence_items', 'evidence_custody_events',
    'safety_events', 'location_shares'
  ]
  loop
    execute format('drop policy if exists "%s service role" on public.%I', t, t);
    execute format(
      'create policy "%s service role" on public.%I for all to service_role using (true) with check (true)',
      t, t
    );
  end loop;
end $$;

-- Authenticated users can read/write their own rows (browser transport path).
drop policy if exists "Users read own linked accounts" on public.linked_accounts;
create policy "Users read own linked accounts" on public.linked_accounts
for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users write own linked accounts" on public.linked_accounts;
create policy "Users write own linked accounts" on public.linked_accounts
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users read own evidence" on public.evidence_items;
create policy "Users read own evidence" on public.evidence_items
for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users write own evidence" on public.evidence_items;
create policy "Users write own evidence" on public.evidence_items
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users read own custody events" on public.evidence_custody_events;
create policy "Users read own custody events" on public.evidence_custody_events
for select to authenticated using (
  exists (
    select 1 from public.evidence_items e
    where e.id = evidence_id and e.user_id = auth.uid()
  )
);
drop policy if exists "Users add own custody events" on public.evidence_custody_events;
create policy "Users add own custody events" on public.evidence_custody_events
for insert to authenticated with check (
  exists (
    select 1 from public.evidence_items e
    where e.id = evidence_id and e.user_id = auth.uid()
  )
);

drop policy if exists "Users read own safety events" on public.safety_events;
create policy "Users read own safety events" on public.safety_events
for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users write own safety events" on public.safety_events;
create policy "Users write own safety events" on public.safety_events
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users read own location shares" on public.location_shares;
create policy "Users read own location shares" on public.location_shares
for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users write own location shares" on public.location_shares;
create policy "Users write own location shares" on public.location_shares
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
