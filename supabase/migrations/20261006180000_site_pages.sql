-- Information pages (Про нас, Доставка, Повернення, Контакти, Політика)
-- edited in /admin/pages. One row per page holds its header and sections as
-- JSON; a missing row means the site shows the built-in content.

create table public.site_pages (
  key        text primary key check (key in ('about', 'delivery', 'returns', 'contacts', 'privacy')),
  content    jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.admin_users (user_id) on delete set null
);

create index site_pages_updated_by_idx on public.site_pages (updated_by);

create trigger site_pages_touch before update on public.site_pages
  for each row execute function public.touch_updated_at();

alter table public.site_pages enable row level security;

create policy "read pages" on public.site_pages
  for select to anon, authenticated using (true);
create policy "staff add pages" on public.site_pages
  for insert to authenticated with check ((select private.is_staff()));
create policy "staff edit pages" on public.site_pages
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "staff remove pages" on public.site_pages
  for delete to authenticated using ((select private.is_staff()));

revoke insert, update, delete, truncate, references, trigger on table public.site_pages from anon;
