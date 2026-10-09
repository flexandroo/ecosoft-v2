-- October sale: −15% on the products of Ecosoft's "Жовтневі знижки" that we
-- carry (16 of 19; the Core DV models are not in our catalogue), shown on the
-- "Акційні пропозиції" tab (/promo). A one-off pg_cron job ends the sale at
-- 2026-11-01 00:00 Kyiv (2026-10-31 22:00 UTC): prices go back, the products
-- leave the promo collection, and the job unschedules itself.

create table private.october_sale_2026 (sku text primary key);

insert into private.october_sale_2026 (sku) values
  ('MO550MECOSTD'), ('MO550MPECOSTD'), ('FPV12ECO'), ('FPV34ECO'),
  ('CPV3ECOSTD'), ('CHV3ECO'), ('CPV25101ECO'), ('CPV25105ECO'),
  ('CPV251010ECO'), ('CPV251020ECO'), ('CPV25105BECO'), ('CPV2510205ECO'),
  ('CPV45105ECO'), ('CPV45205ECO'), ('CPV452020ECO'), ('CPV4520205ECO');

-- Discount: the current price becomes the crossed-out one. The USD trigger
-- recalculates price / old_price in UAH.
update public.products p
set old_price_usd = p.price_usd,
    price_usd = round(p.price_usd * 0.85, 2),
    is_promo = true
where p.sku in (select sku from private.october_sale_2026)
  and p.price_usd is not null
  and p.old_price_usd is null;

-- Products without a USD price (none today) keep a manual UAH price.
update public.products p
set old_price = p.price,
    price = round(p.price * 0.85),
    is_promo = true
where p.sku in (select sku from private.october_sale_2026)
  and p.price_usd is null
  and p.old_price is null;

-- Add them to the promo tab after the products already there; existing rows
-- (FPV12ECO, CHV3ECO, MO550MPECOSTD) stay where they are.
insert into public.collection_items (collection_id, product_id, sort)
select c.id, p.id, 100 + row_number() over (order by p.price desc)::int * 10
from public.collections c
cross join public.products p
where c.slug = 'promo'
  and p.sku in (select sku from private.october_sale_2026)
on conflict (collection_id, product_id) do nothing;

-- Remember which ones we added, so the end of the sale removes only those.
create table private.october_sale_2026_added (product_id uuid primary key);
insert into private.october_sale_2026_added (product_id)
select p.id from public.products p
where p.sku in (select sku from private.october_sale_2026)
  and p.sku not in ('FPV12ECO', 'CHV3ECO', 'MO550MPECOSTD');

create function private.end_october_sale_2026() returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.products p
  set price_usd = p.old_price_usd, old_price_usd = null, is_promo = false
  where p.sku in (select sku from private.october_sale_2026)
    and p.old_price_usd is not null;

  update public.products p
  set price = p.old_price, old_price = null, is_promo = false
  where p.sku in (select sku from private.october_sale_2026)
    and p.price_usd is null and p.old_price is not null;

  delete from public.collection_items ci
  using public.collections c
  where c.id = ci.collection_id and c.slug = 'promo'
    and ci.product_id in (select product_id from private.october_sale_2026_added);

  perform cron.unschedule('end-october-sale-2026');
end;
$$;

select cron.schedule('end-october-sale-2026', '0 22 31 10 *', 'select private.end_october_sale_2026()');
