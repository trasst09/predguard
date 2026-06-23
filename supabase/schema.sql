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
  last_login_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

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

alter table public.profiles enable row level security;

create policy "Profiles are readable by service role only"
on public.profiles
for select
to service_role
using (true);

create policy "Profiles are writable by service role only"
on public.profiles
for all
to service_role
using (true)
with check (true);
