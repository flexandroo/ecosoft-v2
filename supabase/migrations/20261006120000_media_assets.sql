-- Media library: one row per file uploaded to the public "media" bucket.

create table public.media_assets (
  id          uuid primary key default gen_random_uuid(),
  path        text not null unique,
  url         text not null,
  folder      text not null default 'library',
  mime_type   text not null,
  size_bytes  integer not null default 0,
  width       integer,
  height      integer,
  alt         text not null default '',
  created_by  uuid references public.admin_users (user_id) on delete set null,
  created_at  timestamptz not null default now()
);

create index media_assets_created_idx on public.media_assets (created_at desc);
create index media_assets_folder_idx on public.media_assets (folder, created_at desc);
create index media_assets_created_by_idx on public.media_assets (created_by);

alter table public.media_assets enable row level security;

create policy "staff read media" on public.media_assets
  for select to authenticated using ((select private.is_staff()));
create policy "staff add media" on public.media_assets
  for insert to authenticated with check ((select private.is_staff()));
create policy "staff edit media" on public.media_assets
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "staff remove media" on public.media_assets
  for delete to authenticated using ((select private.is_staff()));

revoke all on table public.media_assets from anon;

