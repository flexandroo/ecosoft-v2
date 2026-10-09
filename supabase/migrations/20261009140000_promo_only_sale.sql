-- "Акційні пропозиції" shows only the products that are actually on sale:
-- drop the five undiscounted ones, and let the end of the October sale clear
-- all 19 sale products from the tab (FPV12ECO, CHV3ECO and MO550MPECOSTD were
-- there before the sale, so they were not in the "added" list).

delete from public.collection_items ci
using public.collections c, public.products p
where c.id = ci.collection_id and c.slug = 'promo'
  and p.id = ci.product_id
  and p.sku not in (select sku from private.october_sale_2026);

insert into private.october_sale_2026_added (product_id)
select id from public.products where sku in ('FPV12ECO', 'CHV3ECO', 'MO550MPECOSTD')
on conflict (product_id) do nothing;
