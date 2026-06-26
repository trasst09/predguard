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
