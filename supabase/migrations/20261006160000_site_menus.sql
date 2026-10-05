-- Header and footer navigation edited in /admin/menu. One row per menu holds
-- its items as JSON; a missing row means the storefront keeps its built-in menu.

create table public.site_menus (
  key        text primary key check (key in ('header', 'footer')),
  items      jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.admin_users (user_id) on delete set null
);

create index site_menus_updated_by_idx on public.site_menus (updated_by);

create trigger site_menus_touch before update on public.site_menus
  for each row execute function public.touch_updated_at();

alter table public.site_menus enable row level security;

create policy "read menus" on public.site_menus
  for select to anon, authenticated using (true);
create policy "staff add menus" on public.site_menus
  for insert to authenticated with check ((select private.is_staff()));
create policy "staff edit menus" on public.site_menus
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

revoke insert, update, delete, truncate, references, trigger on table public.site_menus from anon;
