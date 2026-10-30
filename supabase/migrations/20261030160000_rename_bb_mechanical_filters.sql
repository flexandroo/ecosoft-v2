-- BB10 / BB20 housings: "Колба механічного очищення" → "Механічний фільтр". Slugs stay.
update public.products
  set name = replace(name, 'Колба механічного очищення', 'Механічний фільтр')
  where slug in ('kolba-mekhanicheskoy-ochistki-ecosoft-bb10-1', 'kolba-mekhanicheskoy-ochistki-ecosoft-bb20-1')
    and name like 'Колба механічного очищення%';
