# Реліз на prod — чекліст

Оновлено 2026-10-09 після передрелізного аудиту. Виконувати по порядку.
Dev-проєкт Supabase — `sofiivkawater-dev` (`sptwelumbstrhcyegccb`), prod — `sofiivkawater-prod` (`uxynzxcrdavauvbmldcv`).

> ⏰ **Дедлайн: до 31.10.2026.** Міграція жовтневої акції ставить задачу зняття знижки на
> `0 22 31 10 *` (без року). Якщо налаштовувати prod пізніше — пропустити міграції
> `20261009120000_october_sale`, `…140000_promo_only_sale` і прибрати знижку з Core DV.

## 1. Код

- [x] Аудит: Next 16.3.8 (критичні CVE), виправлено `usd_pricing.sql`, ліміти запитів, вхід в адмінку.
- [ ] Перевірити Vercel preview гілки `dev`.
- [ ] Влити `dev` → `main`.

## 2. Prod-база Supabase (`sofiivkawater-prod`)

**Не** `supabase db push` одним махом: частина міграцій працює з уже завантаженими товарами.
Міграції застосовувати по одній (SQL Editor або MCP `apply_migration`).

**Фаза 1 — схема:** міграції 1–7
`20261005120000_init` → `…130000_hardening` → `…133000_revoke_anon_private_tables` →
`20261006100000_site_settings` → `…120000_media_assets` → `…130000_storage_media_staff_select` →
`…140000_categories`.

**Фаза 2 — товари (176):** або
`node scripts/seed-products.mts <prod-env-file>` (потрібні prod `NEXT_PUBLIC_SUPABASE_URL` і
`SUPABASE_SECRET_KEY`; файл не комітити), або
`node scripts/export-products-sql.mts <dir> 30` і виконати `products-001…006.sql` у SQL Editor.
Перевірка: `select count(*) from products` = 176.

**Фаза 3 — дані й ціни:** міграції 8–16
`20261006150000_collections` → `…160000_site_menus` → `…170000_posts` → `…180000_site_pages` →
`…190000_move_scalex_consumables` → `20261007100000_catalog_integrity` →
`…120000_normalize_product_specs` → `…140000_reorder_functions` → `20261008100000_usd_pricing`.
Перевірка: `select value from site_settings where key='usd_rate'` має курс;
`select count(*) from products where price_usd is null` = 0; у `cron.job` є `nbu-usd-rate`.
Якщо курсу немає — **зупинитись** (НБУ недоступний), повторити `select private.refresh_usd_rate()`.

**Фаза 4 — акція, нові товари, банери, блог:** міграції 17–23
`20261009120000_october_sale` → `…130000_core_dv_products` → `…140000_promo_only_sale` →
`…150000_category_short_titles` → `…160000_harden_sale_objects` → `…170000_seed_home_banners` →
`…180000_blog_posts_autumn` (7 статей, разом 13).

**Перевірка після фаз:** 179 товарів, 19 з `is_promo`; підбірки hits 8 / cartridges 10 / promo 19;
4 банери; у `cron.job` — `nbu-usd-rate` і `end-october-sale-2026`.

**Контент, якого немає в міграціях:**
- [ ] Налаштування (телефони, графік, реквізити) збігаються з дефолтами в коді; за потреби зберегти в `/admin/settings`.

**Auth (Supabase → Authentication):**
- [ ] Увімкнути **Leaked Password Protection** (і в dev).
- [ ] Вимкнути реєстрацію (`Allow new users to sign up` = off).
- [ ] Створити адміністратора: користувач в Auth + рядок у `public.admin_users` з `role = 'admin'`.
- [ ] Advisors (Security, Performance) — без нових попереджень.

## 3. Сервер (VPS 195.28.182.181)

- [ ] `.env.local` — див. DEPLOY.md §5.3 (Supabase prod + Telegram). **До** збірки.
- [ ] Nginx лише з IP Cloudflare + `real_ip_header CF-Connecting-IP` — DEPLOY.md §7.1.
- [ ] `git pull origin main && npm ci && npm run build && pm2 reload ecosoft`.
- [ ] Cloudflare: увімкнути HSTS (SSL/TLS → Edge Certificates).

## 4. Smoke-тест після деплою

- [ ] `/api/catalog` — **179** товарів (вбудований каталог має 176, тож 179 = дані з бази); Core Gold 250 DV коштує 40 545 ₴.
- [ ] `/promo` — 19 товарів; на головній 4 банери.
- [ ] Каталог на телефоні без горизонтального скролу; фільтри, пошук «фильтр кросс», кошик.
- [ ] Тестове замовлення: приходить у Telegram і в адмінку (Замовлення), номер збігається. Потім скасувати.
- [ ] Callback і контактна форма доходять.
- [ ] `/sitemap.xml`, `/robots.txt`, `/api/meta-feed.xml` відкриваються; Rich Results Test для сторінки товару.
- [ ] Meta Pixel / GTM спрацьовують на сайті і **не** вантажаться в `/admin`.
- [ ] Напряму на IP сервера сайт віддає 403 (лише через Cloudflare).
