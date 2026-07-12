-- Profile pictures previously lived on local disk, which is ephemeral on
-- Vercel (each serverless instance gets its own /tmp) and caused avatars to
-- 404 intermittently in production. Move them into a public Supabase
-- Storage bucket instead; server.js uploads/deletes through the service-role
-- client, and public reads work directly off the bucket's public URL.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;
