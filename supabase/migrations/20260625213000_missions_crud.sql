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

drop trigger if exists missions_set_updated_at on public.missions;

create trigger missions_set_updated_at
before update on public.missions
for each row
execute function public.set_profiles_updated_at();

alter table public.missions enable row level security;

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

insert into public.missions (
  id,
  type,
  risk,
  title,
  quest_giver,
  quest_confirmer,
  description,
  location,
  schedule,
  roles,
  protocol,
  minimum_role,
  min_readiness,
  xp_reward,
  readiness_reward,
  reward_label,
  steps,
  is_active
)
values
  (
    'quest-shadow',
    'online',
    'Moderate oversight',
    'Patrol the Shadows',
    'Dispatcher Nyra',
    'Moderator Sable',
    'Monitor flagged Discord communities, document suspicious grooming patterns, and prepare moderator-ready notes.',
    'Remote / Pacific time',
    'Tonight, 7:00 PM',
    array['Spotter', 'Verifier'],
    'Evidence template required',
    'Spotter / Tipster',
    30,
    120,
    4,
    'Intel packet + patrol credit',
    array[
      'Review the flagged channel list and confirm observation coverage.',
      'Capture timestamps, usernames, and grooming indicators in the evidence template.',
      'Submit a moderator-ready summary with links and escalation notes.'
    ],
    true
  ),
  (
    'quest-hidden-meet',
    'hybrid',
    'Supervisor approval',
    'Chapter: The Hidden Meet',
    'Supervisor Vale',
    'Commander Imani',
    'Coordinate remote observers, decoy support, and a law-enforcement liaison around a time-boxed meetup window.',
    'San Jose, CA',
    'Wednesday, 5:30 PM',
    array['Decoy', 'Support', 'Officer'],
    'Safety briefing + live check-ins',
    'Decoy / Support',
    55,
    220,
    8,
    'Meetup ops clearance + response credit',
    array[
      'Complete the supervisor briefing and confirm assigned support roles.',
      'Run the live safety check-in cadence during the meetup window.',
      'Close the mission with a debrief, evidence handoff, and incident summary.'
    ],
    true
  ),
  (
    'quest-vigil',
    'realworld',
    'High restriction',
    'Meetup Vigil',
    'Captain Roan',
    'Field Marshal Eden',
    'A tightly controlled support operation with role-gated access, location sharing, and post-event debrief requirements.',
    'Oakland, CA',
    'Saturday, 2:00 PM',
    array['Officer', 'Safety monitor', 'Video recorder'],
    'Location consent expires automatically',
    'Officer / LE Partner',
    80,
    320,
    10,
    'Field command commendation',
    array[
      'Verify all participants, equipment, and consent-based location sharing before deployment.',
      'Maintain field safety oversight and document every checkpoint during the support window.',
      'Finish the post-event debrief with reviewed media, notes, and chain-of-custody records.'
    ],
    true
  ),
  (
    'quest-lantern',
    'online',
    'Open to trained users',
    'Signal Lantern',
    'Archivist Lux',
    'Verifier Quinn',
    'Review tip submissions for completeness, normalize timestamps, and route validated reports to moderators.',
    'Remote / Nationwide',
    'Rolling window',
    array['Spotter', 'Verifier'],
    'Structured report handoff',
    'Spotter / Tipster',
    20,
    90,
    3,
    'Validated tip routing credit',
    array[
      'Open the intake queue and identify submissions missing key evidence fields.',
      'Normalize timestamps, platform handles, and supporting attachments.',
      'Forward validated tips into the reporting queue with a clean summary.'
    ],
    true
  )
on conflict (id) do nothing;
