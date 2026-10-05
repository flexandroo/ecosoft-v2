-- Site-wide settings edited in /admin/settings (contacts, hours, socials, legal
-- details, notification recipients). Public rows are read by the storefront;
-- private rows (e.g. Telegram recipients) only by the server and staff.

create table public.site_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  is_public  boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.admin_users (user_id) on delete set null
);

create index site_settings_updated_by_idx on public.site_settings (updated_by);

create trigger site_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();

alter table public.site_settings enable row level security;

create policy "read public settings" on public.site_settings
  for select to anon, authenticated using (is_public or (select private.is_staff()));
create policy "admins add settings" on public.site_settings
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins edit settings" on public.site_settings
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

revoke insert, update, delete, truncate, references, trigger on table public.site_settings from anon;
