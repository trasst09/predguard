alter table public.user_quests
  drop constraint if exists user_quests_status_check;

alter table public.user_quests
  alter column status set default 'accepted';

update public.user_quests
set status = case
  when status = 'completed' then 'confirmed'
  else 'accepted'
end
where status not in ('accepted', 'submitted', 'needs_revision', 'confirmed');

alter table public.user_quests add column if not exists submitted_at timestamptz;
alter table public.user_quests add column if not exists reward_granted_at timestamptz;
alter table public.user_quests add column if not exists confirmed_at timestamptz;
alter table public.user_quests add column if not exists confirmed_by uuid references public.profiles(id) on delete set null;
alter table public.user_quests add column if not exists confirmation_notes text not null default '';

alter table public.user_quests
  add constraint user_quests_status_check
  check (status in ('accepted', 'submitted', 'needs_revision', 'confirmed'));

update public.user_quests
set submitted_at = coalesce(submitted_at, completed_at),
    reward_granted_at = coalesce(reward_granted_at, completed_at),
    confirmed_at = coalesce(confirmed_at, completed_at)
where status = 'confirmed';
