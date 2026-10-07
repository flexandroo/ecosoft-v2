-- Atomic reordering for the admin (audit ECO-024): one call renumbers the whole
-- list in a single statement instead of N separate updates that two managers
-- could interleave. SECURITY INVOKER, so the existing staff-only RLS applies.

create function public.reorder_categories(keys text[])
returns void language sql security invoker set search_path = '' as $$
  update public.categories c
  set sort = o.ord * 10
  from unnest(keys) with ordinality as o(key, ord)
  where c.key = o.key and c.sort is distinct from o.ord * 10;
$$;

create function public.reorder_collections(ids uuid[])
returns void language sql security invoker set search_path = '' as $$
  update public.collections c
  set sort = o.ord * 10
  from unnest(ids) with ordinality as o(id, ord)
  where c.id = o.id and c.sort is distinct from o.ord * 10;
$$;

create function public.reorder_collection_items(collection uuid, product_ids uuid[])
returns void language sql security invoker set search_path = '' as $$
  update public.collection_items i
  set sort = o.ord * 10
  from unnest(product_ids) with ordinality as o(product_id, ord)
  where i.collection_id = collection and i.product_id = o.product_id and i.sort is distinct from o.ord * 10;
$$;

revoke all on function public.reorder_categories(text[]) from public, anon;
revoke all on function public.reorder_collections(uuid[]) from public, anon;
revoke all on function public.reorder_collection_items(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_categories(text[]) to authenticated;
grant execute on function public.reorder_collections(uuid[]) to authenticated;
grant execute on function public.reorder_collection_items(uuid, uuid[]) to authenticated;
