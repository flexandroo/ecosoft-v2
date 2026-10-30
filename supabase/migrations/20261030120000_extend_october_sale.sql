-- The October sale runs through 5 November: it now ends at 2026-11-06 00:00
-- Kyiv (2026-11-05 22:00 UTC, Kyiv is UTC+2 after the DST change) instead of
-- 2026-11-01 00:00. Same job name, so private.end_october_sale_2026() still
-- unschedules it after it runs.

select cron.unschedule('end-october-sale-2026')
where exists (select 1 from cron.job where jobname = 'end-october-sale-2026');

select cron.schedule('end-october-sale-2026', '0 22 5 11 *', 'select private.end_october_sale_2026()');
