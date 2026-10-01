-- ONLY for the disposable native Postgres runner, never deploy this file.
-- Minimal Supabase platform dependencies; application schema/migrations are unmodified.
-- This does not emulate the Auth HTTP service or Storage HTTP service.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create schema storage;
create schema extensions;
grant usage on schema public, auth, storage to anon, authenticated, service_role;
create table auth.users (
 id uuid primary key, email text, raw_user_meta_data jsonb default '{}',
 raw_app_meta_data jsonb default '{}', email_confirmed_at timestamptz
);
create function auth.uid() returns uuid language sql stable as $$
 select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),
 (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub'))::uuid
$$;
create table storage.buckets (
 id text primary key, name text not null, public boolean default false,
 file_size_limit bigint, allowed_mime_types text[]
);
create table storage.objects (
 id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id),
 name text, owner_id text, metadata jsonb, unique(bucket_id,name)
);
alter table storage.objects enable row level security;
grant select,insert,update,delete on storage.objects to anon, authenticated, service_role;
create function storage.foldername(name text) returns text[] language sql immutable as $$
 select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1]
$$;
alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
alter default privileges in schema public grant all on sequences to anon,authenticated,service_role;
