-- Blog articles and case studies ("Блог і кейси"), edited in /admin/blog.
-- Visitors see only published posts whose publication time has come;
-- staff see and edit everything, including drafts and scheduled posts.

create table public.posts (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  kind             text not null default 'article' check (kind in ('article', 'case')),
  title            text not null,
  excerpt          text not null default '',
  body             text not null default '',
  cover_image      text,
  gallery          jsonb not null default '[]'::jsonb,
  location         text not null default '',
  related_href     text not null default '',
  related_label    text not null default '',
  seo_title        text not null default '',
  meta_description text not null default '',
  is_published     boolean not null default false,
  published_at     timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  updated_by       uuid references public.admin_users (user_id) on delete set null
);

create index posts_listing_idx on public.posts (is_published, published_at desc);
create index posts_updated_by_idx on public.posts (updated_by);

create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

alter table public.posts enable row level security;

create policy "read published posts" on public.posts
  for select to anon, authenticated
  using ((is_published and published_at <= now()) or (select private.is_staff()));
create policy "staff add posts" on public.posts
  for insert to authenticated with check ((select private.is_staff()));
create policy "staff edit posts" on public.posts
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "staff remove posts" on public.posts
  for delete to authenticated using ((select private.is_staff()));

revoke insert, update, delete, truncate, references, trigger on table public.posts from anon;

-- The articles that were bundled with the site.
insert into public.posts (slug, kind, title, excerpt, body, related_href, related_label, published_at, is_published) values
  ('yak-vybraty-filtr-dlya-vody-u-kvartyru', 'article', 'Як вибрати фільтр для води у квартиру', 'Розбираємо, з чого почати вибір фільтра для квартири: питна вода, захист техніки та бюджет.',
   'Для квартири найчастіше потрібні два типи рішень: система для питної води на кухні та магістральний фільтр для захисту сантехніки й побутової техніки.

Для питної води зазвичай обирають зворотний осмос — він видаляє більшість домішок і дає стабільно чисту воду для пиття та приготування їжі. Якщо хочеться зберегти у воді корисні мінерали, є моделі з мінералізатором.

Щоб подовжити термін служби бойлера, пральної та посудомийної машини, на вході у квартиру встановлюють механічний або магістральний фільтр. Він затримує пісок, іржу та механічні домішки.

Якщо ви не впевнені, що саме підійде, орієнтуйтеся на якість води та кількість людей у родині — або зверніться за консультацією, ми допоможемо підібрати рішення.',
   '/catalog/reverse-osmosis', 'Системи зворотного осмосу', '2026-02-10 09:00+03', true),
  ('zalizo-u-vodi', 'article', 'Що робити, якщо у воді багато заліза', 'Ознаки надлишку заліза у воді та які системи допомагають його прибрати.',
   'Залізо у воді проявляється жовтуватим нальотом, металевим присмаком і плямами на сантехніці. Особливо часто це трапляється з водою зі свердловини.

Для видалення заліза використовують системи знезалізнення — зазвичай це колонні або кабінетні фільтри з відповідним завантаженням, яке окислює та затримує залізо.

Часто залізо йде в парі з підвищеною жорсткістю, тому застосовують комплексні рішення, що одночасно знезалізнюють і помʼякшують воду.

Перед вибором системи бажано зробити аналіз води — це дозволяє підібрати рішення під реальні показники, а не навмання.',
   '/catalog/filtration-systems?q=залізо', 'Системи знезалізнення', '2026-02-18 09:00+03', true),
  ('zvorotnyy-osmos-yak-pratsyuye', 'article', 'Зворотний осмос: як працює і кому підходить', 'Принцип роботи зворотного осмосу простими словами і для кого він є оптимальним вибором.',
   'Зворотний осмос — це багатоступенева система очищення, у якій вода проходить через мембрану з дуже дрібними порами. Мембрана затримує більшість розчинених домішок, лишаючи чисту воду.

Такі системи дають стабільно високу якість питної води і підходять для квартир, будинків та офісів. Для комфортного смаку часто додають мінералізатор.

Зворотний осмос — оптимальний вибір там, де важлива саме питна вода: для приготування їжі, напоїв і для родин з дітьми.

Для обслуговування системи періодично змінюють картриджі та мембрану — це проста процедура, яку можна робити самостійно або замовити сервіс.',
   '/catalog/reverse-osmosis', 'Зворотний осмос', '2026-03-02 09:00+03', true),
  ('yak-chasto-minyaty-kartrydzhi', 'article', 'Як часто міняти картриджі у фільтрі', 'Орієнтири щодо заміни картриджів і мембран, щоб фільтр працював довго й ефективно.',
   'Регулярна заміна картриджів — головна умова того, щоб фільтр працював ефективно. Конкретний графік залежить від типу системи, якості води та обсягу споживання.

Передфільтри механічного очищення зазвичай змінюють частіше за інші елементи, адже саме вони першими приймають на себе механічні домішки.

Для систем зворотного осмосу зручно користуватися готовими комплектами картриджів — на 6 або 12 місяців, щоб не підбирати елементи поодинці.

Якщо вода стала текти повільніше або змінився смак — це сигнал, що час перевірити стан картриджів.',
   '/catalog/ro-cartridges', 'Картриджі та мембрани', '2026-03-15 09:00+03', true),
  ('filtr-dlya-vody-zi-sverdlovyny', 'article', 'Фільтр для води зі свердловини: з чого почати', 'Свердловинна вода потребує комплексного підходу. Пояснюємо, з чого почати.',
   'Вода зі свердловини майже завжди потребує комплексної очистки: у ній можуть бути залізо, підвищена жорсткість, сірководень і механічні домішки.

Перший крок — аналіз води. Без нього неможливо точно сказати, яка саме система потрібна, а будь-які рекомендації будуть приблизними.

За результатами аналізу підбирають зв’язку систем: механічне очищення, знезалізнення та помʼякшення, за потреби — видалення сірководню.

Для питної води на кухні додатково встановлюють зворотний осмос. Так у будинку буде і захищена техніка, і якісна питна вода.',
   '/catalog/filtration-systems', 'Комплексні системи для будинку', '2026-03-28 09:00+03', true),
  ('zakhyst-boylera-vid-nakypu', 'article', 'Як захистити бойлер і техніку від накипу', 'Чому утворюється накип і які фільтри допомагають захистити техніку та сантехніку.',
   'Накип утворюється через підвищену жорсткість води — солі кальцію та магнію осідають на нагрівальних елементах бойлера, котла, пральної та посудомийної машини.

Для захисту техніки використовують магістральні фільтри та системи від накипу, які зменшують його утворення на вході води у квартиру чи будинок.

Якщо вода дуже жорстка, оптимальним рішенням стає система помʼякшення — вона системно знижує жорсткість по всьому будинку.

Менше накипу — це довший термін служби техніки, нижчі витрати на ремонт і стабільніша робота нагрівальних приладів.',
   '/catalog/mainline-filters', 'Магістральні фільтри', '2026-04-08 09:00+03', true)
on conflict (slug) do nothing;

