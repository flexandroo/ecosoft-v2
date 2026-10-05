-- Product collections ("Підбірки"): hand-ordered product lists shown as
-- homepage rails (Хіти, Акції, Картриджі, custom ones).

create table public.collections (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  eyebrow     text not null default '',
  link_href   text not null default '',
  link_label  text not null default '',
  show_on_home boolean not null default true,
  sort        integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger collections_touch before update on public.collections
  for each row execute function public.touch_updated_at();

create table public.collection_items (
  collection_id uuid not null references public.collections (id) on delete cascade,
  product_id    uuid not null references public.products (id) on delete cascade,
  sort          integer not null default 0,
  primary key (collection_id, product_id)
);

create index collection_items_product_idx on public.collection_items (product_id);
create index collection_items_order_idx on public.collection_items (collection_id, sort);

alter table public.collections enable row level security;
alter table public.collection_items enable row level security;

create policy "read collections" on public.collections for select to anon, authenticated using (true);
create policy "staff add collections" on public.collections for insert to authenticated with check ((select private.is_staff()));
create policy "staff edit collections" on public.collections for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "staff remove collections" on public.collections for delete to authenticated using ((select private.is_staff()));

create policy "read collection items" on public.collection_items for select to anon, authenticated using (true);
create policy "staff add collection items" on public.collection_items for insert to authenticated with check ((select private.is_staff()));
create policy "staff edit collection items" on public.collection_items for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "staff remove collection items" on public.collection_items for delete to authenticated using ((select private.is_staff()));

revoke insert, update, delete, truncate, references, trigger on table public.collections, public.collection_items from anon;

-- Seed the three homepage rails with the products the homepage showed before.
insert into public.collections (slug, title, eyebrow, link_href, link_label, sort) values
  ('hits', 'Хіти продажів', '', '/catalog', 'Весь каталог', 10),
  ('promo', 'Акційні пропозиції', '', '/catalog', 'Весь каталог', 20),
  ('cartridges', 'Картриджі на заміну', 'Обслуговування', '/catalog/ro-cartridges', 'Усі картриджі', 30)
on conflict (slug) do nothing;

insert into public.collection_items (collection_id, product_id, sort)
select c.id, p.id, s.ord * 10
from (values
  ('hits', 'MO550MECOSTD', 1), ('hits', 'MO650MECOSTD', 2), ('hits', 'MO1500PECO', 3), ('hits', 'FMV3ECOSTD', 4),
  ('hits', 'CPV3ECOSTD', 5), ('hits', 'FOSE100ECO', 6), ('hits', 'FPV34ECO', 7), ('hits', 'FK1054CIMIXP', 8),
  ('promo', 'MO675MECO', 1), ('promo', 'MO550MPECOSTD', 2), ('promo', 'FU1054CI', 3), ('promo', 'FOSE200ECO', 4),
  ('promo', 'FPV12ECO', 5), ('promo', 'CHV3ECO', 6), ('promo', 'CPV4POST', 7), ('promo', 'ROBUST1000STD', 8)
) as s(collection, sku, ord)
join public.collections c on c.slug = s.collection
join public.products p on p.sku = s.sku
on conflict do nothing;

insert into public.collection_items (collection_id, product_id, sort)
select c.id, p.id, row_number() over (order by p.sort) * 10
from public.collections c
join lateral (
  select id, sort from public.products
  where category = 'ro-cartridges' and in_stock and not is_hidden
  order by sort limit 10
) p on true
where c.slug = 'cartridges'
on conflict do nothing;
