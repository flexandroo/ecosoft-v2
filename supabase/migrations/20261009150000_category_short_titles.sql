-- Category pill labels: "Системи" → "Комплексні очистки",
-- "Картриджі магістр." → "Картриджі магістральні" (already applied on dev).
update public.categories set short_title = 'Комплексні очистки' where key = 'filtration-systems';
update public.categories set short_title = 'Картриджі магістральні' where key = 'mainline-cartridges';
