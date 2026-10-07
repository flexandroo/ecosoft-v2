-- Integrity rules that so far lived only in the admin code (audit ECO-013, ECO-023, ECO-024).

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------

-- A product's category must exist; a category key never changes, but cascade
-- just in case so products can't silently disappear from the storefront.
alter table public.products
  add constraint products_category_fkey
  foreign key (category) references public.categories (key) on update cascade;

-- The order API charges exactly this price: a purchasable product is never free,
-- and a "discount" must actually be one.
alter table public.products
  add constraint products_price_positive check (price > 0 or cta_type = 'request'),
  add constraint products_old_price_above_price check (old_price is null or old_price > price);

-- The Meta Pixel / catalogue feed id.
alter table public.products alter column sku set not null;

-- `image` is the first of `images`; older seeded rows only had `image`.
update public.products
set images = jsonb_build_array(image)
where image is not null and image <> '' and images = '[]'::jsonb;

-- Removing a product breaks its public URL, ads and collections: admins only.
drop policy "staff remove products" on public.products;
create policy "admins remove products" on public.products
  for delete to authenticated using ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- Audit trail: staff can only write entries in their own name
-- ---------------------------------------------------------------------------

drop policy "staff add audit" on public.audit_log;
create policy "staff add own audit" on public.audit_log
  for insert to authenticated
  with check ((select private.is_staff()) and actor = (select auth.uid()));

drop policy "staff add lead events" on public.lead_events;
create policy "staff add own lead events" on public.lead_events
  for insert to authenticated
  with check ((select private.is_staff()) and actor = (select auth.uid()));
