-- Hardening after the release audit: the sale-end function is for pg_cron
-- only, and the private sale tables get RLS (no policies = no API access),
-- which also clears the Supabase security advisor warning.
revoke all on function private.end_october_sale_2026() from public, anon, authenticated;
revoke all on function private.products_price_from_usd() from public, anon, authenticated;

alter table private.october_sale_2026 enable row level security;
alter table private.october_sale_2026_added enable row level security;
