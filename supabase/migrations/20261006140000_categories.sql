-- Storefront presentation of catalogue categories (edited in /admin/categories).
-- The key is the URL segment and product.category value and never changes;
-- ad feeds and analytics keep using the built-in technical titles.

create table public.categories (
  key             text primary key,
  title           text not null,
  short_title     text not null default '',
  subtitle        text not null default '',
  seo_title       text not null default '',
  meta_description text not null default '',
  seo_text        text not null default '',
  image           text,
  group_key       text not null default 'drinking' check (group_key in ('drinking', 'household', 'consumables', 'business')),
  sort            integer not null default 0,
  is_hidden       boolean not null default false,
  updated_at      timestamptz not null default now()
);

create trigger categories_touch before update on public.categories
  for each row execute function public.touch_updated_at();

alter table public.categories enable row level security;

create policy "read categories" on public.categories
  for select to anon, authenticated using (true);
create policy "staff edit categories" on public.categories
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

revoke insert, update, delete, truncate, references, trigger on table public.categories from anon;

insert into public.categories (key, title, short_title, subtitle, image, group_key, sort) values
  ('reverse-osmosis', 'Фільтри зворотного осмосу', 'Зворотний осмос',
   'Чиста питна вода для дому та офісу — багатоступенева очистка зі збалансованим мінеральним складом.',
   '/images/category-scenes-v3/reverse-osmosis.png', 'drinking', 10),
  ('flow-filters', 'Проточні фільтри', 'Проточні',
   'Компактні проточні фільтри під мийку для щоденного приготування та пиття.',
   '/images/category-scenes-v3/flow-filters.png', 'drinking', 20),
  ('filtration-systems', 'Фільтраційні системи', 'Системи',
   'Помʼякшення, знезалізнення та механічне очищення води для квартири й будинку.',
   '/images/category-scenes-v3/filtration-systems.png', 'household', 30),
  ('mainline-filters', 'Магістральні фільтри', 'Магістральні',
   'Захист сантехніки, котла й техніки — очищення води на вході в будинок.',
   '/images/category-scenes-v3/mainline-filters.png', 'household', 40),
  ('ro-cartridges', 'Картриджі для фільтрів води', 'Картриджі осмос',
   'Оригінальні змінні картриджі та мембрани для систем зворотного осмосу.',
   '/images/category-scenes-v3/ro-cartridges.png', 'consumables', 50),
  ('mainline-cartridges', 'Картриджі магістральні', 'Картриджі магістр.',
   'Змінні картриджі для магістральних фільтрів холодної та гарячої води.',
   '/images/category-scenes-v3/mainline-cartridges.png', 'consumables', 60),
  ('filter-media', 'Матеріали для фільтрів', 'Матеріали',
   'Засипки, таблетована сіль, іонообмінні смоли та вугілля для фільтрів.',
   '/images/category-scenes-v3/filter-media.png', 'consumables', 70),
  ('horeca', 'Для кафе, ресторанів, готелів', 'HoReCa',
   'Підготовка води для кавʼярень, ресторанів і готелів — стабільна якість напоїв.',
   '/images/category-scenes-v3/horeca.png', 'business', 80)
on conflict (key) do nothing;
