-- Defence in depth: the public (anon) role never needs these tables at all,
-- and only reads the catalogue tables. RLS already hides the rows.
revoke all on table public.leads, public.lead_events, public.audit_log, public.admin_users from anon;
revoke insert, update, delete, truncate, references, trigger on table public.products, public.banners from anon;
