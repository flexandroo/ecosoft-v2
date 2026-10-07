-- Prices follow the NBU USD rate (Ecosoft price list is fixed in USD).
--
-- * products.price_usd / old_price_usd hold the base price; products without
--   price_usd keep a manually set UAH price.
-- * The current rate lives in site_settings 'usd_rate'; a trigger keeps
--   price / old_price = round(USD × rate) on every write.
-- * private.refresh_usd_rate() reads the official rate from bank.gov.ua and
--   reprices the catalogue; pg_cron runs it twice a day (00:05 and 12:05 Kyiv
--   in winter, 01:05 and 13:05 in summer).
-- * Base prices: retail (РРЦ) from "Price Ecosoft POU POE_DT 09_2026"; filter
--   media are priced per litre/kg there and multiplied by the bag size; the 47
--   products missing from the list (kits, BWT, some systems) keep their
--   September price converted at 44.90.

create extension if not exists http with schema extensions;
create extension if not exists pg_cron;

alter table public.products
  add column price_usd numeric(12, 2) check (price_usd is null or price_usd > 0),
  add column old_price_usd numeric(12, 2) check (old_price_usd is null or old_price_usd > 0),
  add constraint products_old_price_usd_above check (old_price_usd is null or price_usd is null or old_price_usd > price_usd);

comment on column public.products.price_usd is 'Base price in USD; when set, price (UAH) follows the NBU rate.';

create function private.usd_rate() returns numeric
language sql stable security definer set search_path = '' as $$
  select (value ->> 'rate')::numeric from public.site_settings where key = 'usd_rate';
$$;

create function private.products_price_from_usd() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  rate numeric := private.usd_rate();
begin
  if new.price_usd is not null and rate is not null then
    new.price := round(new.price_usd * rate);
    new.old_price := case when new.old_price_usd is not null then round(new.old_price_usd * rate) end;
  end if;
  return new;
end;
$$;

create trigger products_price_from_usd
  before insert or update of price, old_price, price_usd, old_price_usd on public.products
  for each row execute function private.products_price_from_usd();

create function private.apply_usd_rate(new_rate numeric, rate_date date) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  changed integer;
begin
  if new_rate is null or new_rate < 20 or new_rate > 200 then
    raise exception 'implausible USD rate: %', new_rate;
  end if;
  insert into public.site_settings (key, value, is_public)
  values ('usd_rate', jsonb_build_object('rate', new_rate, 'date', rate_date, 'updated_at', now()), true)
  on conflict (key) do update set value = excluded.value;

  update public.products
  set price = round(price_usd * new_rate),
      old_price = case when old_price_usd is not null then round(old_price_usd * new_rate) end
  where price_usd is not null
    and (price is distinct from round(price_usd * new_rate)
      or old_price is distinct from case when old_price_usd is not null then round(old_price_usd * new_rate) end);
  get diagnostics changed = row_count;

  insert into public.audit_log (actor, entity, entity_id, action, diff)
  values (null, 'pricing', 'usd_rate', 'rate', jsonb_build_object('rate', new_rate, 'date', rate_date, 'products', changed));
  return changed;
end;
$$;

-- Official NBU rate for today (Kyiv date); returns a short status line for cron logs.
create function private.refresh_usd_rate() returns text
language plpgsql security definer set search_path = '' as $$
declare
  kyiv_date date := (now() at time zone 'Europe/Kyiv')::date;
  response extensions.http_response;
  body jsonb;
  rate numeric;
  rate_date date;
  changed integer;
begin
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '15000');
  select * into response from extensions.http_get(
    'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json&date=' || to_char(kyiv_date, 'YYYYMMDD')
  );
  if response.status <> 200 then
    raise warning 'NBU rate request failed: HTTP %', response.status;
    return 'NBU HTTP ' || response.status;
  end if;
  body := response.content::jsonb;
  rate := (body -> 0 ->> 'rate')::numeric;
  rate_date := to_date(body -> 0 ->> 'exchangedate', 'DD.MM.YYYY');
  changed := private.apply_usd_rate(rate, rate_date);
  return format('USD %s (%s): %s products repriced', rate, rate_date, changed);
end;
$$;

-- "Оновити зараз" in the admin: called from the server with the service key
-- after the staff check, so signed-in users get no direct RPC access.
create function public.refresh_usd_rate() returns text
language plpgsql security definer set search_path = '' as $
begin
  return private.refresh_usd_rate();
end;
$;

revoke all on function private.usd_rate() from public, anon, authenticated;
revoke all on function private.apply_usd_rate(numeric, date) from public, anon, authenticated;
revoke all on function private.refresh_usd_rate() from public, anon, authenticated;
revoke all on function public.refresh_usd_rate() from public, anon, authenticated;
grant execute on function public.refresh_usd_rate() to service_role;

-- Base prices.
update public.products p
set price_usd = v.usd
from (values
  ('ECOMIXC12', 133.20),
  ('ECOMIXA12', 122.40),
  ('ECOLITEUS25', 115.00),
  ('KECOSIL', 17.50),
  ('MB20', 412.50),
  ('QUS26', 8.75),
  ('ECOMIXC25', 277.50),
  ('ECOMIXA25', 255.00),
  ('FILTR300', 360.00),
  ('CENT1240', 300.00),
  ('HCRSS25', 112.50),
  ('FLAGPL', 73.58),
  ('HCRSS12', 54.00),
  ('FLAG', 38.21),
  ('94241', 41.45),
  ('ECOLITES25', 77.50),
  ('ECOMIXP12', 104.40),
  ('ECOLITED25', 215.00),
  ('ECOMIXP25', 217.50),
  ('FK1035CABCEMIXCOR', 1497.00),
  ('FK1252CEMIXA', 1409.00),
  ('FK1465CIMIXA', 1395.00),
  ('FU1035CABCEMVTA', 1388.00),
  ('FPA1465CT', 1333.00),
  ('FU0835CABCETA', 1317.17),
  ('FU1252CI', 837.00),
  ('FU1013CABCIMVCR', 952.65),
  ('FK1252CIMIXP', 923.50),
  ('FU1354CI', 901.00),
  ('FP1054CTPL', 535.00),
  ('FP1252CTPL', 642.00),
  ('FP1354CTPL', 669.00),
  ('FU1054CI', 760.00),
  ('FK1054CIMIXP', 801.16),
  ('FP1465CTPL', 820.00),
  ('FPC1054CT', 838.00),
  ('FPA1054CT', 854.00),
  ('FK1054CIMIXA', 886.00),
  ('FU1013CABCEMVAS', 1079.60),
  ('FK1465CEMIXA', 1750.00),
  ('FPC1665CT', 1748.00),
  ('FPA1665CT', 1708.00),
  ('FK1235CABCEMIXCOR', 1627.00),
  ('FPC1465CT', 1623.00),
  ('FK1354CEMIXA', 1558.00),
  ('FU1465CI', 1031.00),
  ('FK1354CIMIXP', 1016.24),
  ('FPA1252CT', 990.00),
  ('FU1016CABCIMVCR', 967.64),
  ('FPC1354CT', 1213.00),
  ('FP1665CTPL', 945.00),
  ('FK1018CABCEMIXC', 1310.00),
  ('FK1054CEMIXA', 1260.00),
  ('FPA1354CT', 1250.00),
  ('FU1235CABCETA', 1232.78),
  ('FK1235CABGCIMIXA', 1221.54),
  ('FU1665CI', 1215.00),
  ('FK1354CIMIXA', 1215.00),
  ('FU1018CABCEMV', 1187.00),
  ('FK1465CIMIXP', 1161.27),
  ('FK1035CABGCIMIXA', 1107.59),
  ('FPC1252CT', 1097.00),
  ('FK1252CIMIXA', 1094.00),
  ('FU1035CABGCI', 1051.60),
  ('FU1024CABCIMVCR', 1039.62),
  ('FMV3ECOSTD', 52.00),
  ('ROBUST1000STD', 420.00),
  ('ROBUST1500ECO', 749.00),
  ('ROBUST4000', 1449.00),
  ('ROBUSTCOFFEE', 899.00),
  ('ROBUST3000MAX', 1299.00),
  ('CPV45205ECO', 9.90),
  ('CRVF24520ECO', 94.41),
  ('CPV25101ECO', 1.30),
  ('CPV25105ECO', 1.30),
  ('CPV251020ECO', 1.30),
  ('CPV251010ECO', 1.30),
  ('CPV25105BECO', 2.30),
  ('CPV2510205ECO', 2.30),
  ('CHV2510ECO', 7.00),
  ('PSE2005ECO', 12.00),
  ('PSE200ECO', 6.30),
  ('CRVF2510ECO', 9.80),
  ('CRVS24520ECO', 148.40),
  ('CPN25101ECO', 2.30),
  ('CPN251010ECO', 2.30),
  ('CPN251020ECO', 2.30),
  ('CHVCB2510ECO', 7.40),
  ('CMV2510ECO', 7.40),
  ('CPN25105ECO', 2.30),
  ('CPV4520205ECO', 16.10),
  ('CPV325105ECO', 3.90),
  ('CPV45105ECO', 5.10),
  ('CPV452020ECO', 9.90),
  ('CPN45105ECO', 10.50),
  ('CPV245205ECO', 19.80),
  ('CPV2452020ECO', 19.80),
  ('CPN452020ECO', 20.80),
  ('CHV4510ECO', 28.00),
  ('CHVCB24520ECO', 126.39),
  ('CHVCB4510ECO', 31.60),
  ('CPV24520205ECO', 32.20),
  ('CRVF4520ECO', 47.20),
  ('CHV4520ECO', 62.00),
  ('CHVCB4520ECO', 63.20),
  ('CRVS4520ECO', 74.20),
  ('CHV24520ECO', 124.01),
  ('AQPDUO', 173.00),
  ('FFNN2P1522/0118', 51.49),
  ('FOSE200ECO', 15.70),
  ('FPV12HWECO', 28.00),
  ('FPV34ECO', 16.00),
  ('810548', 100.65),
  ('810549', 120.38),
  ('TXHES3', 264.00),
  ('FOSE100ECO', 6.80),
  ('FPV12PECO', 20.00),
  ('810563', 150.96),
  ('FPV34PECO', 21.00),
  ('810560', 130.24),
  ('FFNS2P1522/0118', 48.04),
  ('TXHES2', 111.00),
  ('FPV4510ECOGR', 47.00),
  ('FPV4520ECOGR', 55.00),
  ('FPV12ECO', 15.00),
  ('MO550MECOSTD', 149.00),
  ('MO3600MPECO', 739.00),
  ('MO675MBALPSECO', 729.00),
  ('MO3600PECO', 695.00),
  ('MO675MPUREBALECO', 599.00),
  ('MO675PSMACECO', 540.00),
  ('MO3400PECO', 500.00),
  ('MO2800PECO', 405.00),
  ('MO675PUREMACECO', 390.00),
  ('MO675MPSECO', 370.00),
  ('MO1500PECO', 329.00),
  ('MO675MECO', 275.00),
  ('MO550MPECOSTD', 245.00),
  ('MO650MECOSTD', 159.00),
  ('CPV9MIN50GPD', 72.32),
  ('CHV5POST75GPD', 50.78),
  ('CPV6POSTMIN50GPD', 47.59),
  ('CPV5MCSVECO', 39.27),
  ('CPV5POST50GPD', 38.53),
  ('CMV3ECO', 21.00),
  ('CHV4POST75GPD', 24.14),
  ('CPV4MIN', 17.04),
  ('CPV4POST', 16.33),
  ('CHV11PUREBAL', 154.14),
  ('CHV11PUREMAC', 136.39),
  ('CHV6PUREBAL', 101.60),
  ('CHV6PUREALC', 97.68),
  ('CHV6PUREMAC', 91.60),
  ('CPV17POSTMIN50GPD', 89.00),
  ('CHV15POST75GPD', 74.94),
  ('CHV5PUREALC', 72.40),
  ('CHV17POSTMIN75GPD', 93.05),
  ('CPV15POST50GPD', 70.87),
  ('CHV6ECOABS', 66.40),
  ('CHV5PUREMAC', 62.00),
  ('CHV3ECO', 15.40),
  ('CHV2010ECOPKG', 9.40),
  ('CHVCB3ECOAGR', 12.00),
  ('PD2010ECOPKG', 10.20),
  ('CPV3ECOSTD', 9.20),
  ('CRV6ECO', 60.36),
  ('CSV1812100ECO', 43.00),
  ('CHV5PUREBAL', 72.00),
  ('CSV181275ECO', 30.00),
  ('CMV6ECO', 37.28),
  ('CHV5ECOABS', 36.80),
  ('CRV3ECO', 34.00),
  ('CSV181250ECO', 25.00),
  ('CPV5POSTMIN', 25.39),
  ('CHV3ECOAGR', 17.80),
  ('CHV11PUREALC', 152.18)
) as v(sku, usd)
where p.sku = v.sku;

-- First repricing with today's rate, then twice a day.
select private.refresh_usd_rate();

select cron.schedule('nbu-usd-rate', '5 10,22 * * *', $$select private.refresh_usd_rate()$$);
