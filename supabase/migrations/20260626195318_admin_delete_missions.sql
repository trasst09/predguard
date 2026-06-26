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
