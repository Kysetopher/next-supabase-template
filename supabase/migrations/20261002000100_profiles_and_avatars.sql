-- Reference pattern for user-owned data: copy this shape for every new table.
--
--   * Keyed on (or carrying) a user id that references auth.users with
--     `on delete cascade`, so deleteAccount() tears the user's rows down.
--   * RLS on, with one policy per operation the user is allowed, each scoped
--     to `(select auth.uid())` (the subselect makes Postgres evaluate it once
--     per query instead of once per row).
--   * Table and column grants as narrow as the policies: RLS decides *which
--     rows*, grants decide *which operations and columns*. Here users can read
--     their profile and update two columns; they can't insert (the trigger
--     does), delete (the cascade does) or touch id/created_at.
--   * anon gets nothing.

-- ---------------------------------------------------------------- profiles

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 100),
  -- Object path inside the `avatars` bucket, e.g. '<user id>/avatar.png'.
  avatar_path text check (char_length(avatar_path) <= 512),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, avatar_path) on public.profiles to authenticated;
grant all on public.profiles to service_role;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- One profile per user, created with the account. security definer because
-- the inserting role is Supabase Auth's, which has no grant on this table.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- avatars bucket

-- Private: files are served through signed URLs
-- (supabase.storage.from('avatars').createSignedUrl(path, seconds)), never a
-- public link. Each user's files live under a folder named after their id;
-- the policies below only allow that folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

create policy "Users can read their own avatar files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can upload to their own avatar folder"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can replace their own avatar files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can delete their own avatar files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Storage objects don't cascade from auth.users. deleteAccount() has to
-- remove the user's `avatars/<user id>/` files through the Storage API
-- before deleting the user (see src/lib/actions/account.ts).
