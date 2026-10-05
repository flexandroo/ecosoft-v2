-- SCALEX filler and replacement cartridge belong to "Картриджі магістральні"
-- (as on ecosoft.ua), not to "Магістральні фільтри". Old URLs redirect in next.config.ts.

update public.products set category = 'mainline-cartridges'
where slug in ('kartridzh-dlya-filtra-ot-nakipi-ecosoft-scalex', 'napolnitel-dlya-filtrov-ot-nakipi-ecosoft-scalex-200-ml')
  and category = 'mainline-filters';
