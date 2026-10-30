-- Customer Telegram bot "Помічник Sofiivka Water" (@sofiivkawater_service_bot):
-- customers register their drinking-water filters, log cartridge changes and
-- get reminders 7 days before and on the due day; plus FAQ, replacement
-- guides, targeted promo/news broadcasts and a support chat relayed to the
-- managers' group. Everything is edited in /admin/bot.
--
-- The bot server uses the secret key (bypasses RLS); staff manage the data
-- through RLS; anon has no access.

-- ---------------------------------------------------------------------------
-- Content: guides and FAQ
-- ---------------------------------------------------------------------------
create table public.bot_guides (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text not null default '',
  video_url    text not null default '' check (video_url = '' or video_url ~ '^https://'),
  sort         integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.bot_faq (
  id           uuid primary key default gen_random_uuid(),
  question     text not null,
  answer       text not null default '',
  sort         integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Replacement schedule per filter model (a product of the catalogue)
-- ---------------------------------------------------------------------------
create table public.bot_service_items (
  id                   uuid primary key default gen_random_uuid(),
  product_id           uuid not null references public.products (id) on delete cascade,
  title                text not null,
  interval_days        integer not null check (interval_days between 7 and 3650),
  cartridge_product_id uuid references public.products (id) on delete set null,
  guide_id             uuid references public.bot_guides (id) on delete set null,
  sort                 integer not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index bot_service_items_product_idx on public.bot_service_items (product_id, sort);
create index bot_service_items_cartridge_idx on public.bot_service_items (cartridge_product_id);
create index bot_service_items_guide_idx on public.bot_service_items (guide_id);

-- ---------------------------------------------------------------------------
-- Customers, their filters and replacement history
-- ---------------------------------------------------------------------------
create table public.bot_clients (
  id            uuid primary key default gen_random_uuid(),
  tg_user_id    bigint not null unique,
  tg_username   text,
  tg_first_name text not null default '',
  name          text not null default '',
  phone         text not null default '',
  -- {reminders, remind_before_days, promo, news}
  settings      jsonb not null default '{"reminders": true, "remind_before_days": 7, "promo": true, "news": true}'::jsonb,
  -- Conversation step while the bot waits for typed input.
  state         jsonb not null default '{}'::jsonb,
  is_blocked    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);
create index bot_clients_created_idx on public.bot_clients (created_at desc);

create table public.bot_client_filters (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.bot_clients (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  label       text not null default '',
  created_at  timestamptz not null default now()
);
create index bot_client_filters_client_idx on public.bot_client_filters (client_id);
create index bot_client_filters_product_idx on public.bot_client_filters (product_id);

create table public.bot_replacements (
  id               bigint generated always as identity primary key,
  client_filter_id uuid not null references public.bot_client_filters (id) on delete cascade,
  service_item_id  uuid not null references public.bot_service_items (id) on delete cascade,
  replaced_on      date not null,
  created_at       timestamptz not null default now()
);
create index bot_replacements_lookup_idx on public.bot_replacements (client_filter_id, service_item_id, replaced_on desc);
create index bot_replacements_item_idx on public.bot_replacements (service_item_id);

-- One reminder of each kind per due date.
create table public.bot_reminders (
  client_filter_id uuid not null references public.bot_client_filters (id) on delete cascade,
  service_item_id  uuid not null references public.bot_service_items (id) on delete cascade,
  due_on           date not null,
  kind             text not null check (kind in ('before', 'due')),
  sent_at          timestamptz not null default now(),
  primary key (client_filter_id, service_item_id, due_on, kind)
);
create index bot_reminders_item_idx on public.bot_reminders (service_item_id);

-- ---------------------------------------------------------------------------
-- Broadcasts and support chat
-- ---------------------------------------------------------------------------
create table public.bot_broadcasts (
  id            uuid primary key default gen_random_uuid(),
  topic         text not null default 'promo' check (topic in ('promo', 'news')),
  title         text not null,
  body          text not null default '',
  button_label  text not null default '',
  button_url    text not null default '' check (button_url = '' or button_url ~ '^https://'),
  -- {product_ids: uuid[], due_within_days: int|null}; empty = everyone subscribed to the topic
  audience      jsonb not null default '{}'::jsonb,
  status        text not null default 'draft' check (status in ('draft', 'sending', 'sent')),
  recipients    integer not null default 0,
  delivered     integer not null default 0,
  failed        integer not null default 0,
  created_by    uuid references public.admin_users (user_id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  sent_at       timestamptz
);
create index bot_broadcasts_sent_idx on public.bot_broadcasts (status, sent_at desc);
create index bot_broadcasts_created_by_idx on public.bot_broadcasts (created_by);

-- Who received which broadcast ("Акції та новини" shows a customer's own history).
create table public.bot_broadcast_deliveries (
  broadcast_id uuid not null references public.bot_broadcasts (id) on delete cascade,
  client_id    uuid not null references public.bot_clients (id) on delete cascade,
  sent_at      timestamptz not null default now(),
  primary key (broadcast_id, client_id)
);
create index bot_broadcast_deliveries_client_idx on public.bot_broadcast_deliveries (client_id, sent_at desc);

create table public.bot_support_messages (
  id               bigint generated always as identity primary key,
  client_id        uuid not null references public.bot_clients (id) on delete cascade,
  direction        text not null check (direction in ('in', 'out')),
  text             text not null,
  author           text not null default '',
  group_message_id bigint,
  created_at       timestamptz not null default now()
);
create index bot_support_client_idx on public.bot_support_messages (client_id, created_at desc);
create index bot_support_group_msg_idx on public.bot_support_messages (group_message_id);

-- ---------------------------------------------------------------------------
-- Triggers, RLS, grants
-- ---------------------------------------------------------------------------
create trigger bot_guides_touch before update on public.bot_guides for each row execute function public.touch_updated_at();
create trigger bot_faq_touch before update on public.bot_faq for each row execute function public.touch_updated_at();
create trigger bot_service_items_touch before update on public.bot_service_items for each row execute function public.touch_updated_at();
create trigger bot_clients_touch before update on public.bot_clients for each row execute function public.touch_updated_at();
create trigger bot_broadcasts_touch before update on public.bot_broadcasts for each row execute function public.touch_updated_at();

do $$
declare t text;
begin
  foreach t in array array['bot_guides', 'bot_faq', 'bot_service_items', 'bot_clients', 'bot_client_filters',
                           'bot_replacements', 'bot_reminders', 'bot_broadcasts', 'bot_broadcast_deliveries', 'bot_support_messages'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon', t);
    execute format('create policy "staff read %1$s" on public.%1$I for select to authenticated using ((select private.is_staff()))', t);
    execute format('create policy "staff add %1$s" on public.%1$I for insert to authenticated with check ((select private.is_staff()))', t);
    execute format('create policy "staff edit %1$s" on public.%1$I for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()))', t);
    execute format('create policy "staff remove %1$s" on public.%1$I for delete to authenticated using ((select private.is_staff()))', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Starter content (edit in /admin/bot)
-- ---------------------------------------------------------------------------
insert into public.bot_guides (title, body, sort) values
  ('Заміна картриджів 1-2-3 у фільтрі зворотного осмосу',
   'Перекрийте подачу води і кран накопичувального бака, відкрийте кран чистої води, щоб скинути тиск.

1. Відкрутіть колби передфільтрів ключем із комплекту (над тазом — у них залишиться вода).
2. Вийміть старі картриджі, промийте колби і перевірте ущільнювальні кільця.
3. Встановіть нові картриджі в порядку 1-2-3, як на маркуванні, і закрутіть колби від руки, дотягнувши ключем.
4. Відкрийте воду, перевірте, чи немає протікань, і злийте перші 10–15 хвилин води.',
   10),
  ('Заміна постфільтра і мінералізатора',
   'Постфільтр і мінералізатор — швидкороз''ємні картриджі горизонтально над мембраною.

1. Перекрийте воду і скиньте тиск, відкривши кран чистої води.
2. Натисніть фіксуюче кільце фітинга і витягніть трубку з обох боків картриджа.
3. Встановіть новий картридж за стрілкою напрямку потоку і вставте трубки до упору.
4. Відкрийте воду і злийте перший бак очищеної води.',
   20),
  ('Заміна картриджа в магістральному фільтрі',
   '1. Перекрийте кран перед фільтром і натисніть кнопку скидання тиску (якщо є).
2. Відкрутіть колбу ключем, вийміть старий картридж, промийте колбу.
3. Перевірте ущільнювальне кільце, встановіть новий картридж по центру і закрутіть колбу.
4. Плавно відкрийте воду і перевірте, чи немає протікань.',
   30);

insert into public.bot_faq (question, answer, sort) values
  ('Навіщо вчасно міняти картриджі?',
   'Відпрацьований картридж перестає затримувати домішки, а з часом сам стає джерелом забруднення. Крім того, забиті передфільтри скорочують термін служби мембрани — найдорожчої частини фільтра.', 10),
  ('Як бот рахує дату наступної заміни?',
   'Від дати останньої заміни, яку ви відмітили, плюс рекомендований інтервал для вашої моделі. Якщо вода дуже забруднена або ви споживаєте її багато, міняйте картриджі частіше.', 20),
  ('Чи можна замовити картриджі з доставкою?',
   'Так. У нагадуванні є кнопка «Замовити картридж» — вона відкриває потрібний товар на сайті sofiivkawater.com. Або напишіть нам через «Звʼязатись з адміністратором».', 30);

-- Replacement schedules. Default intervals follow Ecosoft's recommendations:
-- pre-filters / post-filters / mineralizers every 6 months, RO membranes every
-- 2 years, mainline sediment cartridges every 3 months.
insert into public.bot_service_items (product_id, title, interval_days, cartridge_product_id, guide_id, sort)
select f.id, s.title, s.days, c.id, g.id, s.sort
from (values
  -- Standard / Standard PRO
  ('MO550MECOSTD',     'Картриджі 1-2-3 (передфільтри)', 180, 'CPV3ECOSTD',     'Заміна картриджів 1-2-3 у фільтрі зворотного осмосу', 10),
  ('MO550MECOSTD',     'Вугільний постфільтр',           180, 'CHV2010ECOPKG',  'Заміна постфільтра і мінералізатора', 20),
  ('MO550MECOSTD',     'Мінералізатор',                  180, 'PD2010ECOPKG',   'Заміна постфільтра і мінералізатора', 30),
  ('MO550MECOSTD',     'Мембрана 50 GPD',                730, 'CSV181250ECO',   null, 40),
  ('MO550MPECOSTD',    'Картриджі 1-2-3 (передфільтри)', 180, 'CPV3ECOSTD',     'Заміна картриджів 1-2-3 у фільтрі зворотного осмосу', 10),
  ('MO550MPECOSTD',    'Вугільний постфільтр',           180, 'CHV2010ECOPKG',  'Заміна постфільтра і мінералізатора', 20),
  ('MO550MPECOSTD',    'Мінералізатор',                  180, 'PD2010ECOPKG',   'Заміна постфільтра і мінералізатора', 30),
  ('MO550MPECOSTD',    'Мембрана 50 GPD',                730, 'CSV181250ECO',   null, 40),
  ('MO650MECOSTD',     'Картриджі 1-2-3 (передфільтри)', 180, 'CPV3ECOSTD',     'Заміна картриджів 1-2-3 у фільтрі зворотного осмосу', 10),
  ('MO650MECOSTD',     'Вугільний постфільтр',           180, 'CHV2010ECOPKG',  'Заміна постфільтра і мінералізатора', 20),
  ('MO650MECOSTD',     'Мінералізатор',                  180, 'PD2010ECOPKG',   'Заміна постфільтра і мінералізатора', 30),
  ('MO650MECOSTD',     'Мембрана 50 GPD',                730, 'CSV181250ECO',   null, 40),
  -- Absolute
  ('MO675MECO',        'Комплект картриджів Absolute «6 місяців»', 180, 'CHV5ECOABS', 'Заміна картриджів 1-2-3 у фільтрі зворотного осмосу', 10),
  ('MO675MECO',        'Мембрана 75 GPD',                730, 'CSV181275ECO',   null, 20),
  ('MO675MPSECO',      'Комплект картриджів Absolute «6 місяців»', 180, 'CHV5ECOABS', 'Заміна картриджів 1-2-3 у фільтрі зворотного осмосу', 10),
  ('MO675MPSECO',      'Мембрана 75 GPD',                730, 'CSV181275ECO',   null, 20),
  -- PURE
  ('MO675PUREMACECO',  'Комплект картриджів PURE AquaCalcium Mint «6 місяців»', 180, 'CHV5PUREMAC', null, 10),
  ('MO675PUREMACECO',  'Мембрана 75 GPD',                730, 'CSV181275ECO',   null, 20),
  ('MO675PSMACECO',    'Комплект картриджів PURE AquaCalcium Mint «6 місяців»', 180, 'CHV5PUREMAC', null, 10),
  ('MO675PSMACECO',    'Мембрана 75 GPD',                730, 'CSV181275ECO',   null, 20),
  ('MO675MPUREBALECO', 'Комплект картриджів PURE Balance «6 місяців»', 180, 'CHV5PUREBAL', null, 10),
  ('MO675MPUREBALECO', 'Мембрана 75 GPD',                730, 'CSV181275ECO',   null, 20),
  ('MO675MBALPSECO',   'Комплект картриджів PURE Balance «6 місяців»', 180, 'CHV5PUREBAL', null, 10),
  ('MO675MBALPSECO',   'Мембрана 75 GPD',                730, 'CSV181275ECO',   null, 20),
  -- CROSS (cartridges are not in the catalogue yet)
  ('MO1500PECO',       'Картридж попереднього очищення CROSS', 180, null, null, 10),
  ('MO1500PECO',       'Мембранний картридж CROSS',      730, null,             null, 20),
  ('MO2800PECO',       'Картридж попереднього очищення CROSS', 180, null, null, 10),
  ('MO2800PECO',       'Мембранний картридж CROSS',      730, null,             null, 20),
  ('MO3400PECO',       'Картридж попереднього очищення CROSS', 180, null, null, 10),
  ('MO3400PECO',       'Мембранний картридж CROSS',      730, null,             null, 20),
  ('MO3600PECO',       'Картридж попереднього очищення CROSS', 180, null, null, 10),
  ('MO3600PECO',       'Мембранний картридж CROSS',      730, null,             null, 20),
  ('MO3600MPECO',      'Картридж попереднього очищення CROSS', 180, null, null, 10),
  ('MO3600MPECO',      'Мембранний картридж CROSS',      730, null,             null, 20),
  -- Under-sink triple filter
  ('FMV3ECOSTD',       'Комплект картриджів для потрійного фільтра', 180, 'CMV3ECO', 'Заміна картриджа в магістральному фільтрі', 10),
  -- Mainline sediment filters
  ('FPV12ECO',         'Картридж механічного очищення 2,5"×10"', 90, 'CPV25105ECO', 'Заміна картриджа в магістральному фільтрі', 10),
  ('FPV34ECO',         'Картридж механічного очищення 2,5"×10"', 90, 'CPV25105ECO', 'Заміна картриджа в магістральному фільтрі', 10),
  ('FPV12PECO',        'Картридж механічного очищення 2,5"×10"', 90, 'CPV25105ECO', 'Заміна картриджа в магістральному фільтрі', 10),
  ('FPV34PECO',        'Картридж механічного очищення 2,5"×10"', 90, 'CPV25105ECO', 'Заміна картриджа в магістральному фільтрі', 10),
  ('FPV12HWECO',       'Картридж для гарячої води',      90, null,             'Заміна картриджа в магістральному фільтрі', 10),
  ('FPV4510ECOGR',     'Картридж механічного очищення 4,5"×10"', 90, 'CPV45105ECO', 'Заміна картриджа в магістральному фільтрі', 10),
  ('FPV4520ECOGR',     'Картридж механічного очищення 4,5"×20"', 90, 'CPV45205ECO', 'Заміна картриджа в магістральному фільтрі', 10),
  -- SCALEX anti-scale
  ('FOSE100ECO',       'Картридж SCALEX',                180, 'PSE2005ECO',     null, 10),
  ('FOSE200ECO',       'Наповнювач SCALEX 200 мл',       180, 'PSE200ECO',      null, 10)
) as s(filter_sku, title, days, cartridge_sku, guide_title, sort)
join public.products f on f.sku = s.filter_sku
left join public.products c on c.sku = s.cartridge_sku
left join public.bot_guides g on g.title = s.guide_title;

-- The storefront shows "Нагадаємо про заміну в Telegram" on product pages of
-- filters that have a schedule: the schedule itself is public information.
create policy "public reads service items" on public.bot_service_items for select to anon using (true);
grant select on table public.bot_service_items to anon;
