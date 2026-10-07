# Реліз на prod — чекліст

Кроки, відкладені до кінцевої prod-версії (аудит: ECO-002, ECO-019, ECO-022). Виконувати по порядку.
Dev-проєкт Supabase — `sofiivkawater-dev` (`sptwelumbstrhcyegccb`), prod — `sofiivkawater-prod` (`uxynzxcrdavauvbmldcv`, зараз порожній).

## 1. Код

- [ ] Влити гілку `claude/ecosoft-project-audit-c031ee` у `dev` (PR), перевірити Vercel preview.
- [ ] Пройти адмінку на preview: створити / дублювати / видалити товар, редактор характеристик, попередження про незбережені зміни, видалення фото з медіатеки, «Закрити доступ» працівнику.
- [ ] Влити `dev` → `main`.

## 2. Prod-база Supabase (`sofiivkawater-prod`)

Порядок важливий: міграції підбірок і чистки характеристик працюють з уже наявними товарами.

- [ ] Застосувати міграції **1–7** з `supabase/migrations/` (від `20261005120000_init.sql` до `20261006140000_categories.sql` включно).
- [ ] Залити товари: `node scripts/seed-products.mts <env-file-prod>` (env-файл з prod `NEXT_PUBLIC_SUPABASE_URL` і `SUPABASE_SECRET_KEY`; файл не комітити).
- [ ] Застосувати міграції **8–15** (від `20261006150000_collections.sql` до `20261007140000_reorder_functions.sql`).
- [ ] Перевірка: 176 товарів, 3 підбірки з товарами, `npm run audit:specs` проти prod показує ~258 назв характеристик.
- [ ] Перенести контент, створений в адмінці dev (банери, пости, сторінки, меню, налаштування), — вручну через prod-адмінку **або** експортом таблиць. Фото банерів лежать у Storage dev-проєкту: завантажити їх у prod-медіатеку заново, щоб URL вказували на prod.
- [ ] Authentication → Settings: увімкнути **Leaked Password Protection** (і в dev). Перевірити, що вимкнено реєстрацію (`disable_signup`).
- [ ] Створити першого адміністратора: користувач у Auth + рядок у `public.admin_users` з `role = 'admin'`.
- [ ] Advisors (Security, Performance) — без попереджень.

## 3. Сервер (VPS 195.28.182.181)

- [ ] `.env.local` на сервері: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (prod), `SUPABASE_SECRET_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`; за потреби `CRM_*`, `META_*`, `GA4_*`. **Не** ставити `NEXT_PUBLIC_DISABLE_TRACKING`.
- [ ] Nginx приймає трафік лише з IP Cloudflare (`allow`/`deny` за списком https://www.cloudflare.com/ips/, `set_real_ip_from` + `real_ip_header CF-Connecting-IP`), щоб не можна було обійти rate-limit форм напряму на IP.
- [ ] `git pull` → `npm ci` → `npm run build` → `pm2 reload ecosoft` (див. DEPLOY.md).

## 4. Smoke-тест після деплою

- [ ] `/api/catalog` повертає 176 товарів (дані з бази, не вбудований каталог: змінити ціну в адмінці — оновлюється протягом хвилини).
- [ ] Каталог на телефоні без горизонтального скролу; фільтри, пошук «фильтр кросс», кошик.
- [ ] Тестове замовлення: доходить у Telegram і в адмінку (Замовлення), номер збігається. Потім скасувати.
- [ ] Callback і контактна форма доходять.
- [ ] `/sitemap.xml`, `/robots.txt`, `/api/meta-feed.xml` відкриваються; Rich Results Test для сторінки товару.
- [ ] Meta Pixel / GTM спрацьовують на сайті і **не** вантажаться в `/admin`.
