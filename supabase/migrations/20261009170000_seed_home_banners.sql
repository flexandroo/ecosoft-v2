-- Homepage hero banners created in the dev admin. Their photos now ship with
-- the site (public/images/banners) instead of the dev project's Storage, so a
-- fresh database gets the same slider. No-op where banners already exist.
insert into public.banners (placement, eyebrow, title, subtitle, cta_label, href, image_desktop, image_mobile, theme, sort, is_active)
select * from (values
  ('hero', 'Питна вода на кухні', 'Чиста вода просто з крана',
   'Зворотний осмос з мінералізатором: очищення до 99% домішок і корисні мінерали. Монтаж під ключ.',
   'Обрати фільтр', '/catalog/reverse-osmosis',
   '/images/banners/ro-standard-pro-desktop.webp', '/images/banners/ro-standard-pro-mobile.webp', 'light', 10, true),
  ('hero', 'Вода для всього будинку', 'Комплексне очищення води',
   'Помʼякшення і знезалізнення в одній системі. Підберемо під аналіз вашої води.',
   'Підібрати систему', '/catalog/filtration-systems',
   '/images/banners/complex-filter-desktop.webp', '/images/banners/complex-filter-mobile.webp', 'light', 20, true),
  ('hero', 'Смарт фільтри CROSS', 'Чиста вода без бака і зайвого місця',
   'Компактний зворотний осмос зі SMART-індикацією стану картриджів. Вміщується під мийкою навіть у тісній шафці.',
   'Обрати CROSS', '/catalog/reverse-osmosis?line=CROSS',
   '/images/banners/cross-line-desktop.webp', '/images/banners/cross-line-mobile.webp', 'dark', 30, true),
  ('hero', 'Для кавʼярень і HoReCa', 'Ідеальна вода для кави',
   'Системи зворотного осмосу RObust стабілізують мінералізацію, захищають кавомашину від накипу і зберігають смак кожної чашки.',
   'Обрати систему', '/catalog/horeca',
   '/images/banners/robust-coffee-desktop.webp', '/images/banners/robust-coffee-mobile.webp', 'dark', 40, true)
) as b (placement, eyebrow, title, subtitle, cta_label, href, image_desktop, image_mobile, theme, sort, is_active)
where not exists (select 1 from public.banners);
