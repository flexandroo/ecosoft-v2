-- Three new Ecosoft Core DV cabinet systems (Clack® DV valve), copied from
-- ecosoft.ua. USD prices are set so that at the 2026-10-09 NBU rate (44.8526)
-- they match Ecosoft's retail prices: 47 700 / 43 560 / 53 550 ₴.
-- All three are part of the October sale (−15% until 31.10, see
-- 20261009120000_october_sale.sql) and go to the "Акційні пропозиції" tab.
--
-- ecosoft.ua shows the same spec table on all three pages, and the Core 300 DV
-- "Опис" tab is copied from the FK (Ecomix A) model, so Core 300 DV gets only
-- its own product text.

insert into public.products
  (slug, sku, category, name, price, price_usd, in_stock, cta_type, description, image, images, details, attributes, is_hidden, is_hit, is_promo, sort)
values
(
  'kompaktnyi-filtr-ecosoft-core-gold-250-dv', 'FK1035CABDVMIXACR', 'filtration-systems',
  'Компактний фільтр знезалізнення та пом''якшення води Ecosoft Core Gold 250 DV',
  47700, 1063.48, true, 'buy',
  'Компактний фільтр знезалізнення та пом''якшення води Ecosoft Core Gold 250 DV — ефективне рішення для комплексного покращення якості води у вашому домі…',
  '/images/meta-products/FK1035CABDVMIXACR.jpg',
  '["/images/meta-products/FK1035CABDVMIXACR.jpg",
    "/images/product-gallery/8ea1c433f8fcc259-fk1035cabdvmixacr_001_1200x1200.webp",
    "/images/product-gallery/f898a2135c3e3074-fk1035cabdvmixacr_003_1200x1200.webp",
    "/images/product-gallery/79f1b85137b2d961-fk1035cabdvmixacr_004_1200x1200.webp",
    "/images/product-gallery/9629fb48522b4e1d-fk1035cabdvmixacr_005_1200x1200.webp",
    "/images/product-gallery/e1dfbedb8f7d6a36-fk1035cabdvmixacr_006_1200x1200.webp",
    "/images/product-gallery/d995e9735ea45825-fk1035cabdvmixacr_007_1200x1200.webp",
    "/images/product-gallery/4f361b57b60def14-fk1035cabdvmixacr_008_1200x1200.webp",
    "/images/product-gallery/6de79392e6f842f9-fk1035cabdvmixacr_009_1200x1200.webp",
    "/images/product-gallery/4494b3164a025daa-fk1035cabdvmixacr_010_1200x1200.webp",
    "/images/product-gallery/0b4fc2aac181491f-fk1035cabdvmixacr_011_1200x1200.webp",
    "/images/product-gallery/6a2ab27fbb8921b7-fk1035cabdvmixacr_013_1200x1200.webp"]'::jsonb,
  '{}'::jsonb, '{}'::jsonb, false, false, false, 381
),
(
  'kompaktnyi-filtr-ecosoft-core-gold-370-dv', 'FK1235CABDVMIXACR', 'filtration-systems',
  'Компактний фільтр знезалізнення та пом''якшення води Ecosoft Core Gold 370 DV',
  53550, 1193.92, true, 'buy',
  'Компактний фільтр знезалізнення та пом''якшення води Ecosoft Core Gold 370 DV — ефективне рішення для комплексного покращення якості води у вашому домі…',
  '/images/meta-products/FK1235CABDVMIXACR.jpg',
  '["/images/meta-products/FK1235CABDVMIXACR.jpg",
    "/images/product-gallery/8ea1c433f8fcc259-fk1035cabdvmixacr_001_1200x1200.webp",
    "/images/product-gallery/f898a2135c3e3074-fk1035cabdvmixacr_003_1200x1200.webp",
    "/images/product-gallery/79f1b85137b2d961-fk1035cabdvmixacr_004_1200x1200.webp",
    "/images/product-gallery/9629fb48522b4e1d-fk1035cabdvmixacr_005_1200x1200.webp",
    "/images/product-gallery/e1dfbedb8f7d6a36-fk1035cabdvmixacr_006_1200x1200.webp",
    "/images/product-gallery/d995e9735ea45825-fk1035cabdvmixacr_007_1200x1200.webp",
    "/images/product-gallery/4f361b57b60def14-fk1035cabdvmixacr_008_1200x1200.webp",
    "/images/product-gallery/6de79392e6f842f9-fk1035cabdvmixacr_009_1200x1200.webp",
    "/images/product-gallery/4494b3164a025daa-fk1035cabdvmixacr_010_1200x1200.webp",
    "/images/product-gallery/0b4fc2aac181491f-fk1035cabdvmixacr_011_1200x1200.webp",
    "/images/product-gallery/6a2ab27fbb8921b7-fk1035cabdvmixacr_013_1200x1200.webp"]'::jsonb,
  '{}'::jsonb, '{}'::jsonb, false, false, false, 382
),
(
  'kompaktnyi-filtr-ecosoft-core-300-dv', 'FU1035CABDVCR', 'filtration-systems',
  'Компактний фільтр пом''якшення води Ecosoft Core 300 DV',
  43560, 971.18, true, 'buy',
  'Компактний фільтр пом''якшення води Ecosoft Core 300 DV — практичне рішення для зменшення жорсткості води та комфортного користування нею в усьому домі…',
  '/images/meta-products/FU1035CABDVCR.jpg',
  '["/images/meta-products/FU1035CABDVCR.jpg",
    "/images/product-gallery/e068d2af42ac167a-fu1035cabdvcr_001_1200x1200.webp",
    "/images/product-gallery/0e38533cc7f423c1-fu1035cabdvcr_003_1200x1200.webp",
    "/images/product-gallery/38abee879c6189f1-fu1035cabdvcr_004_1200x1200.webp",
    "/images/product-gallery/83b3e4a28a6ac59b-fu1035cabdvcr_005_1200x1200.webp",
    "/images/product-gallery/b02980082c5e1149-fu1035cabdvcr_006_1200x1200.webp",
    "/images/product-gallery/1f87ae28c85ec05a-fu1035cabdvcr_007_1200x1200.webp",
    "/images/product-gallery/3857ad25b0a5afd0-fu1035cabdvcr_008_1200x1200.webp",
    "/images/product-gallery/14432bb31b4bcd80-fu1035cabdvcr_009_1200x1200.webp",
    "/images/product-gallery/081911d62bc6dce5-fu1035cabdvcr_010_1200x1200.webp",
    "/images/product-gallery/3398a3614853c7be-fu1035cabdvcr_011_1200x1200.webp",
    "/images/product-gallery/246c690150699b57-fu1035cabdvcr_013_1200x1200.webp"]'::jsonb,
  '{}'::jsonb, '{}'::jsonb, false, false, false, 331
);

-- Shared spec table (as published on ecosoft.ua for all three models).
with specs as (
  select '[
    {"label": "Продуктивність робоча/максимальна, м³/год", "value": "2,0/2,5"},
    {"label": "Об''єм фільтрувального матеріалу, л", "value": "30"},
    {"label": "Ресурс, м³ (при твердості 5 мг-екв/л)", "value": "6"},
    {"label": "Витрата солі на регенерацію, кг", "value": "3,0…4,0"},
    {"label": "Витрата води на регенерацію (об''єм стоків), м³", "value": "0,3"},
    {"label": "Тривалість регенерації, хв", "value": "80…110"},
    {"label": "Перепад тиску в робочому режимі, бар", "value": "0,5"},
    {"label": "Робочий тиск, бар", "value": "2…6"},
    {"label": "Електроживлення", "value": "230 В, 50 Гц"},
    {"label": "Енергоспоживання, Вт", "value": "30"},
    {"label": "Діаметр підключення трубопроводу", "value": "1\""},
    {"label": "Вага, кг", "value": "35"},
    {"label": "Габаритні розміри фільтра (В х Ш х Г), см", "value": "103 х 36 х 56,5"},
    {"label": "Твердість, мг-екв/л", "value": "15"},
    {"label": "Вміст заліза, мг/л", "value": "0,2"},
    {"label": "Вміст мангану, мг/л", "value": "0,05"},
    {"label": "Перманганатна окиснюваність, мг O₂/л", "value": "5"},
    {"label": "Амоній, мг/л", "value": "4"},
    {"label": "Необхідний рівень очищення від механічних домішок, мкм", "value": "100"},
    {"label": "Температура вхідної води, °C", "value": "+4…+30"}
  ]'::jsonb as v
),
how_it_works as (
  select 'Як працює фільтр

Фільтр підключається до водопроводу подачі холодної води, ефективно очищає воду та самостійно контролює всі процеси своєї роботи. Попередньо очищена від механічних домішок вода надходить у корпус фільтра, всередині якого міститься фільтрувальний матеріал Ecomix A. Матеріал складається з п''яти компонентів, які послідовно затримують залізо, манган, органічні домішки та солі твердості. Очищена вода через центральну трубу корпуса подається користувачу.

Коли ресурс фільтрувального матеріалу вичерпується, фільтр самостійно виходить на регенерацію, але лише тоді, коли водою користуються мінімально. Керуючий клапан запам''ятовує інтенсивність користування водою в різний час і адаптується так, щоб чистої води вистачало навіть під час пікового користування, наприклад на вихідних.

' as v
),
service as (
  select 'Обслуговування

Завдяки використанню багатофункціонального клапана фільтр не потребує постійної уваги. Єдиною важливою задачею користувача є вчасне засипання солі. Це гарантує ефективну регенерацію фільтрувального матеріалу, незмінно високий ресурс та якість води. У разі виникнення будь-яких проблем клапан проінформує текстовим повідомленням на дисплеї та покаже контакти сервісного центру.' as v
)
update public.products p
set details = jsonb_build_object(
      'specs', (select v from specs),
      'documents', jsonb_build_array(
        jsonb_build_object(
          'href', case when p.sku = 'FU1035CABDVCR'
            then 'https://ecosoft.ua/sites/default/files/2026-09/TDS_FU1035CABDVCR_UA.pdf'
            else 'https://ecosoft.ua/sites/default/files/2026-09/TDS_FK1235CABDVMIXACR_FK1035CABDVMIXACR_UA.pdf' end,
          'name', 'Технічна характеристика Ecosoft Core'),
        jsonb_build_object('href', 'https://ecosoft.ua/ua/catalog/EcosoftCatalog2026.pdf', 'name', 'Каталог продукції')),
      'longDescription', case p.sku
        when 'FK1035CABDVMIXACR' then 'Компактний фільтр знезалізнення та пом''якшення води Ecosoft Core Gold 250 DV — ефективне рішення для комплексного покращення якості води у вашому домі. Система допомагає зменшити жорсткість води та вміст заліза, забезпечуючи комфортне користування водою та захист домашнього обладнання.

Модель оснащена надійним керуючим клапаном Clack® DV американського виробництва з алмазно-вуглецевим покриттям. Процеси очищення й регенерації відбуваються автоматично, тому система потребує мінімальної уваги під час експлуатації.

Одна з переваг Ecosoft Core Gold 250 DV — збільшена ємність для солі до 88 кг. Повного завантаження достатньо до 11 місяців роботи до наступного поповнення солі, що робить обслуговування фільтра зручнішим.

Завдяки компактній та міцній конструкції система не займає багато місця та чудово підходить для встановлення в котельнях і підвалах.

' || (select v from how_it_works) || (select v from service)
        when 'FK1235CABDVMIXACR' then 'Компактний фільтр знезалізнення та пом''якшення води Ecosoft Core Gold 370 DV — ефективне рішення для комплексного покращення якості води у вашому домі. Система допомагає зменшити жорсткість води та вміст заліза, забезпечуючи комфортне користування водою та захист домашнього обладнання від негативного впливу домішок.

Модель оснащена надійним керуючим клапаном Clack® DV американського виробництва з алмазно-вуглецевим покриттям. Фільтр працює автоматично, а процес регенерації не потребує постійного контролю з боку користувача, що робить експлуатацію системи максимально зручною.

Повної сольової ємності достатньо до 7 місяців роботи до наступного поповнення солі. Завдяки компактній та міцній конструкції фільтр зручно розміщувати в котельнях і підвалах.

' || (select v from how_it_works) || (select v from service)
        else 'Компактний фільтр пом''якшення води Ecosoft Core 300 DV — практичне рішення для зменшення жорсткості води та комфортного користування нею в усьому домі. Система допомагає захистити домашнє обладнання та сантехніку від утворення накипу, забезпечуючи м’яку воду для щоденних потреб.

Для більш комфортного переходу на м’яку воду фільтр оснащений вбудованим клапаном підмісу, за допомогою якого можна налаштувати необхідний рівень жорсткості та поступово звикнути до м’якої води.

Надійну роботу системи забезпечує керуючий клапан Clack® DV американського виробництва з алмазно-вуглецевим покриттям. Завдяки компактній і міцній конструкції фільтр зручно встановлювати в котельнях і підвалах, не займаючи зайвого простору.

' || (select v from service)
      end),
    attributes = case when p.sku = 'FU1035CABDVCR' then '{
        "line": "Core", "type": "Пом''якшення", "tags": ["cabinet-systems", "Core"],
        "filters": {"line": ["Core"], "task": ["Пом''якшення"], "level": ["Стандарт"], "media": ["Іонообмінна смола"],
                    "format": ["Кабінетна"], "series": ["FU", "Core"], "problem": ["Жорсткість"],
                    "purpose": ["Весь будинок"], "installation": ["Кабінетний"]},
        "problem": ["Жорсткість"], "purpose": ["Весь будинок"],
        "subcategory": "softening-systems", "installation": "Кабінетний"}'::jsonb
      else '{
        "line": "Core", "type": "Знезалізнення та пом''якшення", "tags": ["cabinet-systems", "Core"],
        "filters": {"line": ["Core"], "task": ["Знезалізнення та пом''якшення"], "level": ["Стандарт"], "media": ["ECOMIX"],
                    "format": ["Кабінетна"], "series": ["FK", "Core"], "problem": ["Залізо", "Жорсткість"],
                    "purpose": ["Весь будинок"], "installation": ["Кабінетний"]},
        "problem": ["Залізо", "Жорсткість"], "purpose": ["Весь будинок"],
        "subcategory": "iron-softening-systems", "installation": "Кабінетний"}'::jsonb
      end
where p.sku in ('FK1035CABDVMIXACR', 'FK1235CABDVMIXACR', 'FU1035CABDVCR');

-- October sale: −15% until 31.10, ended by private.end_october_sale_2026().
insert into private.october_sale_2026 (sku)
values ('FK1035CABDVMIXACR'), ('FK1235CABDVMIXACR'), ('FU1035CABDVCR');

update public.products p
set old_price_usd = p.price_usd,
    price_usd = round(p.price_usd * 0.85, 2),
    is_promo = true
where p.sku in ('FK1035CABDVMIXACR', 'FK1235CABDVMIXACR', 'FU1035CABDVCR');

insert into public.collection_items (collection_id, product_id, sort)
select c.id, p.id, s.sort
from public.collections c
cross join (values ('FK1235CABDVMIXACR', 102), ('FK1035CABDVMIXACR', 104), ('FU1035CABDVCR', 106)) s (sku, sort)
join public.products p on p.sku = s.sku
where c.slug = 'promo';

insert into private.october_sale_2026_added (product_id)
select id from public.products
where sku in ('FK1035CABDVMIXACR', 'FK1235CABDVMIXACR', 'FU1035CABDVCR');
