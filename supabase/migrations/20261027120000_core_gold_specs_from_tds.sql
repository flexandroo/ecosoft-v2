-- Core Gold 250 / 370 DV specs from Ecosoft's datasheet
-- (TDS_FK1235CABDVMIXACR_FK1035CABDVMIXACR_UA.pdf). ecosoft.ua showed the
-- Core 300 DV softener table on all three pages; Core 300 DV matches its own
-- datasheet and is left as is. Mechanical pre-filtration and water
-- temperature are not in the datasheet and keep the previous values.

with spec(sku, perf, media, capacity, salt, water, weight) as (values
  ('FK1035CABDVMIXACR', '1,0/1,2', '25', '3,5', '2,5…4,0', '0,25', '30'),
  ('FK1235CABDVMIXACR', '1,6/1,8', '37', '5,2', '3,7…6,0', '0,37', '42')
)
update public.products p
set details = jsonb_set(p.details, '{specs}', jsonb_build_array(
  jsonb_build_object('label', 'Продуктивність робоча/максимальна, м³/год', 'value', s.perf),
  jsonb_build_object('label', 'Об''єм фільтрувального матеріалу ECOMIX A, л', 'value', s.media),
  jsonb_build_object('label', 'Ресурс, м³ (при твердості 5 мг-екв/л)', 'value', s.capacity),
  jsonb_build_object('label', 'Витрата солі на регенерацію, кг', 'value', s.salt),
  jsonb_build_object('label', 'Витрата води на регенерацію (об''єм стоків), м³', 'value', s.water),
  jsonb_build_object('label', 'Тривалість регенерації, хв', 'value', '80…110'),
  jsonb_build_object('label', 'Перепад тиску в робочому режимі, бар', 'value', '0,5'),
  jsonb_build_object('label', 'Робочий тиск, бар', 'value', '2…6'),
  jsonb_build_object('label', 'Електроживлення', 'value', '230 В, 50 Гц'),
  jsonb_build_object('label', 'Енергоспоживання, Вт', 'value', '30'),
  jsonb_build_object('label', 'Діаметр підключення трубопроводу', 'value', '1"'),
  jsonb_build_object('label', 'Вага, кг', 'value', s.weight),
  jsonb_build_object('label', 'Габаритні розміри фільтра (В х Ш х Г), см', 'value', '103 х 36 х 56,5'),
  jsonb_build_object('label', 'Твердість, мг-екв/л', 'value', '15'),
  jsonb_build_object('label', 'Вміст заліза, мг/л', 'value', '15'),
  jsonb_build_object('label', 'Вміст мангану, мг/л', 'value', '3'),
  jsonb_build_object('label', 'Перманганатна окиснюваність, мг O₂/л', 'value', '10'),
  jsonb_build_object('label', 'Амоній, мг/л', 'value', '4'),
  jsonb_build_object('label', 'Необхідний рівень очищення від механічних домішок, мкм', 'value', '100'),
  jsonb_build_object('label', 'Температура вхідної води, °C', 'value', '+4…+30')
))
from spec s
where p.sku = s.sku;
