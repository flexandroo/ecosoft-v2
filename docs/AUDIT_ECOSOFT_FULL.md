# Ecosoft Full Audit

**Об'єкт:** `flexandroo/ecosoft-v2`, гілка `dev` @ `800cfb2` (саме її показує `ecosoft-v2-git-dev-flexandroos-projects.vercel.app`)
**Дата:** 2026-10-06
**Як перевірялось:**

- Vercel preview закритий Vercel Authentication, тому той самий коміт зібрано локально (`next build` + `next start`) проти **dev**-Supabase (`sofiivkawater-dev`) з публічним ключем; трекінг вимкнено (`NEXT_PUBLIC_DISABLE_TRACKING=1`).
- Код прочитано повністю: адмін-actions, auth/proxy, data layer, catalog/facets/search, cart/order API, міграції.
- Перевірено в браузері на 1440×900 і 390×844.
- По Supabase виконано лише read-only запити: міграції, advisors, RLS/privileges, data-quality SQL.
- Фасети, підкатегорії, пошук і key specs прогнано скриптом по всіх 176 товарах.
- Адмінку перевірено read-only під наявною в браузері сесією тестового менеджера `QA менеджер (тест)`. Жодних змін у дані не вносилось.
- `tsc --noEmit` проходить без помилок, `eslint` теж, `next build` успішний (233 сторінки).

---

## Executive Summary

**Загальний стан.** Технічна база хороша. Next.js 16 App Router, каталог SSG/ISR з tag-ревалідацією. RLS у Supabase налаштовано правильно: anon не має жодного права на запис. Ціни в замовленні сервер рахує сам і не довіряє клієнту. CSP і `noindex` для адмінки на місці, SEO-розмітка в нормі.

Основні проблеми не в архітектурі, а в таких місцях:

1. мобільна верстка каталогу;
2. коректність каталожних даних (атрибути, фільтри, пошук);
3. кошик, який не звіряється з актуальним каталогом;
4. незавершена адмінка товарів;
5. prod-оточення Supabase взагалі не розгорнуте.

| Severity | Кількість |
|---|---|
| P0 — Critical | **2** |
| P1 — High | **9** |
| P2 — Medium | **15** |
| P3 — Low/Polish | **9** |

**5 найбільших ризиків**

1. **ECO-001.** На телефоні каталог «роз'їжджається» у 6 з 8 категорій. Картки товарів стають завширшки ~1600px, пошук і сортування опиняються за екраном.
2. **ECO-002.** Prod-проєкт Supabase `sofiivkawater-prod` порожній: 0 міграцій, 0 таблиць, 0 адмінів. Реліз `dev → main` без підготовки prod означає неробочу адмінку.
3. **ECO-004.** Кошик зберігає ціну зі `localStorage` і ніколи її не оновлює. Ліміт кількості відсутній. Будь-яка невалідна позиція блокує все оформлення з загальною помилкою.
4. **ECO-007.** Характеристики товарів — неструктурований текст: 287 різних назв, «Продуктивність» у 14 варіантах з різними одиницями. В адмінці атрибути редагувати неможливо.
5. **ECO-005.** Пошук без ранжування і без морфології/RU/транслиту. Запити «фильтр», «железо», «соль», «кросс» дають 0 результатів. За запитом «картридж» першими йдуть магістральні фільтри.

## Release Verdict

### **NOT READY**

Чому:

- **ECO-001 (P0).** Мобільний каталог зламаний — це основний сценарій для рекламного трафіку. Фікс — 1 рядок, але без нього реліз неприйнятний.
- **ECO-002 (P0).** Prod-оточення бази не існує. Потрібні міграції, перенесення даних, створення адміна і env на VPS (`NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SECRET_KEY`).
- **P1 (ECO-004, -005, -006, -011, -012)** прямо впливають на конверсію та на коректність цін і замовлень.

Після виправлення P0 і ECO-004/011/012 вердикт стає **READY WITH MINOR FIXES**.

---

## Inventory (карта системи)

### Public frontend

| Частина | Стан |
|---|---|
| Framework | Next.js 16.2.9 (App Router, Turbopack), React 19.2, Tailwind 4, base-ui, lucide |
| Routing | `/`, `/catalog`, `/catalog/[category]`, `/catalog/[category]/[slug]`, `/search` (dynamic), `/cart`, `/blog(/[slug])`, `/solutions(/[slug])`, `/about`, `/contacts`, `/delivery`, `/returns`, `/privacy`, `/api/{order,callback,contact,catalog,meta-feed.xml}` |
| Layout | один root layout. Settings/categories/menus тягнуться з Supabase і передаються через React context |
| Каталог | 176 товарів, 8 категорій (плоска структура, L2 — це «підкатегорії» через query-фільтри, L3 немає) |
| Пошук | клієнтський substring-AND по «haystack» (`catalog-filters.ts:75-101`) |
| Фільтри | клієнтські фасети (`catalog-facets.ts`), URL через `history.replaceState` |
| Кошик | `localStorage` (`cart-context.tsx`), без акаунта |
| Обране / Порівняння | **немає** (на PDP є лише статична таблиця «Порівняння з іншими моделями») |
| Акаунт/логін покупця | **немає** |
| Форми | замовлення, callback, contact → `deliverLead` (Supabase + legacy CRM + Telegram) |
| Медіа | `/public/images` (≈55 MB) + Supabase Storage bucket `media` (public) |
| Аналітика | Meta Pixel (beforeInteractive), GTM, Meta CAPI/GA4 MP server-side (`conversions.ts`) |
| SEO | metadata per page, canonical, sitemap, robots, JSON-LD Product/Breadcrumb/OnlineStore/WebSite |

### Backend / data

| Частина | Стан |
|---|---|
| БД | Supabase Postgres 17. Таблиці: `products, banners, leads, lead_events, audit_log, admin_users, site_settings, media_assets, categories, collections, collection_items, site_menus, posts, site_pages` |
| RPC | немає (лише `private.is_staff()` / `private.is_admin()` для RLS) |
| Читання storefront | `fetch` на PostgREST з publishable key, `next.tags` + `revalidate: 300` (`lib/catalog.ts`, `categories.ts`, `settings.ts`…) |
| Fallback | при помилці або порожній БД — вбудований `src/lib/products.ts` (652 KB, 176 товарів) |
| Auth | Supabase email/password, `disable_signup: true` (перевірено) |
| RLS | увімкнено на всіх 14 таблицях. anon: лише SELECT каталожних таблиць |
| Storage | bucket `media` public, 10 MB, лише jpeg/png/webp/avif; запис лише staff |
| Cache | Next data cache + `updateTag` з server actions |
| Проєкти | `sofiivkawater-dev` (12 міграцій, дані), `sofiivkawater-prod` (**порожній**) |

### Admin

| Розділ | Стан |
|---|---|
| Route | `/admin/*`; `proxy.ts` робить оптимістичну перевірку, `requireStaff()` у layout, RLS як реальна межа |
| Ролі | `admin` / `manager` (`admin_users.role`) |
| Dashboard | реальні дані: 6 запитів паралельно + 2 в layout |
| Замовлення/заявки/клієнти | є (клієнти вираховуються з leads за телефоном) |
| Товари | **лише edit**: назва, ціна, стара ціна, опис, фото, наявність, прихованість, порядок. **Немає create/delete, атрибутів, характеристик, документів, бренду, категорії** |
| Категорії | лише презентація (назва, SEO, фото, порядок, приховування). Ключі зафіксовані, ієрархії немає |
| Бренди / Атрибути | **немає** |
| Медіа | бібліотека, клієнтське стиснення до WebP, підрахунок використань |
| Імпорт | лише скрипти (`scripts/seed-products.mts`, `import-products.mjs`), з UI немає |
| Інше | банери, підбірки, меню, сторінки, блог, налаштування, працівники. «Генератор КП» — заглушка |

---

## Critical Issues — P0

### ECO-001 — Мобільний каталог: контент розтягується до ~1600px
- **Area:** catalog / mobile
- **Severity:** P0
- **URL/route:** `/catalog/reverse-osmosis`, `/filtration-systems`, `/mainline-filters`, `/ro-cartridges`, `/mainline-cartridges`, `/filter-media` (усі категорії з чипами підкатегорій)
- **File:** `src/components/catalog/catalog-view.tsx:213` (grid), `:230` (`<div>` колонки), `SubcategoryChips` `:610`
- **Problem:** на мобільному grid `gap-8 lg:grid-cols-[260px_1fr]` має одну неявну колонку `auto`. Її ширина = min-content дитини, а `SubcategoryChips` — це рядок `shrink-0` чипів без переносу. Колонка стає 1699px (filtration-systems), 1626px (mainline-cartridges), 943px (reverse-osmosis).
  - `document.documentElement.scrollWidth = 1715` при viewport 390.
  - Картка товару, поле пошуку і сортування — за межами екрану.
  - `horeca` і `flow-filters` (без чипів) у порядку.
- **How to reproduce:** відкрити `/catalog/filtration-systems` на ширині 390px.
- **Why it matters:** основний трафік з реклами — мобільний. Каталог фактично непридатний.
- **Recommended fix:** додати `min-w-0` на колонку (`<div className="min-w-0">` у `:230`) або `grid-cols-1` до `lg:`.
- **Estimated complexity:** XS (1 рядок)
- **Regression risk:** low. Перевірити desktop sidebar і scroll чипів.

### ECO-002 — Prod Supabase не розгорнуто
- **Area:** infra / release
- **Severity:** P0 (release blocker)
- **URL/route:** весь сайт + `/admin`
- **File:** `supabase/migrations/*`, `DEPLOY.md`
- **Problem:** у `sofiivkawater-prod` `list_migrations` повертає `[]`. Таблиць, товарів і адмінів немає. `DEPLOY.md` описує лише Telegram-схему і не згадує Supabase.
  - Якщо задеплоїти `dev` з prod-ключами: storefront мовчки впаде на вбудований каталог (`getProducts` fallback), адмінка не працюватиме.
  - Без `SUPABASE_SECRET_KEY` замовлення не зберігатимуться в БД.
- **How to reproduce:** Supabase → `sofiivkawater-prod` → Migrations: порожньо.
- **Why it matters:** реліз неможливий без підготовки БД. Ризик «тихої» роботи на застарілих даних.
- **Recommended fix:**
  1. застосувати 12 міграцій до prod;
  2. засіяти products (`scripts/seed-products.mts`), banners, posts, media;
  3. створити admin-користувача;
  4. увімкнути Leaked Password Protection;
  5. прописати env на VPS;
  6. додати розділ «Supabase» у `DEPLOY.md` і smoke-check (`/api/catalog` має віддати дані з БД — наприклад, логувати джерело).
- **Estimated complexity:** M
- **Regression risk:** medium (дані)

---

## High Priority — P1

### ECO-003 — Нескінченний redirect для signed-in не-staff користувача
- **Area:** admin-auth
- **Severity:** P1
- **URL/route:** `/admin`, `/admin/login`
- **File:** `src/lib/admin/auth.ts:32`, `src/proxy.ts:36-38`
- **Problem:** у сценарії 1→2→3→1 ланцюжок зациклюється (`ERR_TOO_MANY_REDIRECTS`). Вийти з нього неможливо, бо кнопка «Вийти» є лише в панелі.
  1. `requireStaff()` для користувача без рядка в `admin_users` робить `redirect("/admin/login?denied=1")`.
  2. `proxy.ts` бачить валідну сесію на `/admin/login` і робить `redirect("/admin")`.
  3. Далі знову крок 1.
- **How to reproduce:** адмін натискає «Закрити доступ» для працівника (`removeStaff`) — у цього працівника далі нескінченний редирект. Перевірено за кодом; сесії видаленого працівника для живого тесту не було.
- **Why it matters:** видалений працівник «ламає» собі адмінку назавжди (до чистки cookies). Підтримка не зрозуміє причину.
- **Recommended fix:** у `proxy.ts` не редиректити з `/admin/login`, якщо є `denied=1`. Краще — на `denied` робити `supabase.auth.signOut()` (route handler `/admin/logout`) і показувати форму.
- **Estimated complexity:** S
- **Regression risk:** low

### ECO-004 — Кошик не звіряється з каталогом: застарілі ціни, необмежена кількість, глуха помилка
- **Area:** cart / checkout
- **Severity:** P1
- **URL/route:** `/cart`, `POST /api/order`
- **File:** `src/components/cart/cart-context.tsx:116-137`, `src/components/cart/cart-view.tsx:74,105-129`, `src/app/api/order/route.ts:84`
- **Problem:**
  1. Ціна і назва зберігаються в `localStorage` під час додавання і ніколи не оновлюються. Перевірено: подавив у кошик CROSS60 з ціною 100 ₴ — сторінка показує «До сплати 2 500 ₴» при реальних 22 450 ₴.
  2. `setQty`/`add` не мають верхньої межі, а сервер відхиляє `qty > 20`.
  3. Товар прихований / не в наявності / зі зміненим SKU — сервер повертає `invalid_items` на все замовлення. Клієнт показує лише «Не вдалося надіслати замовлення…» без вказівки позиції.
  4. `pushPurchase` / `pushGenerateLead` шлють у Pixel/GA клієнтський `orderTotal`, а не `data.total` із сервера. Це спотворює ROAS.
- **How to reproduce:** додати товар → адмін змінює ціну або ховає товар → користувач відкриває `/cart`.
- **Why it matters:** клієнт бачить одну суму, менеджер отримує іншу. Втрачені замовлення через «вічну» помилку.
- **Recommended fix:**
  - на `/cart` підтягувати актуальні ціни/наявність по SKU (server component або `/api/catalog`) і показувати зміни;
  - clamp qty 1..20 у `cart-context`;
  - сервер має повертати індекс/sku проблемної позиції, UI — підсвічувати її;
  - у Pixel передавати `data.total`.
- **Estimated complexity:** M
- **Regression risk:** medium (кошик + аналітика)

### ECO-005 — Пошук: немає ранжування, RU/транслиту, морфології, typo-tolerance
- **Area:** search
- **Severity:** P1
- **URL/route:** `/search?q=…`, пошук у каталозі
- **File:** `src/lib/catalog-filters.ts:66-101` (`normText`, `productSearchText`, `matchesQuery`)
- **Problem:** простий `includes` кожного токена, порядок — каталожний. Результати скрипта по всіх 176 товарах:

  | Запит | Результатів | Примітка |
  |---|---|---|
  | `фильтр` / `железо` / `соль` / `кросс` / `осмосис` / `помпа` / `насос` | **0** | хоча є «з помпою», CROSS тощо |
  | `ecosft` (typo) | 0 | |
  | `картридж` | 81 | першими йдуть «Фільтр механічного очищення 1/2"» (магістральні) |
  | `стандарт` | 48 | першими — FP 1054CT (механічні), а не Standard-осмоси |
  | `ecosoft` | 152 | майже весь каталог, без пріоритету |

  Порожній стан не пропонує ні категорій, ні популярних товарів.
- **Why it matters:** пошук — другий за важливістю вхід у каталог.
- **Recommended fix (без нових сервісів):**
  - зважений скоринг (точний SKU > початок назви > назва > line/type > facets);
  - словник синонімів RU→UA і Latin↔Cyrillic (`кросс→cross`, `фильтр→фільтр`, `железо→залізо`, `соль→сіль`, `помпа→помп`);
  - префіксний матч по стемах (`помп*`);
  - Damerau-Levenshtein ≤1 для токенів ≥5 символів;
  - на порожньому результаті показувати категорії і хіти.
- **Estimated complexity:** M
- **Regression risk:** low (ізольована функція; додати unit-тести на список запитів)

### ECO-006 — Фасет «Комплектація» поєднує незалежні ознаки через OR
- **Area:** catalog / filters
- **Severity:** P1
- **URL/route:** `/catalog/reverse-osmosis?kit=…`
- **File:** `src/lib/catalog-facets.ts:214` (`{ key: "kit", … values: roKit }`), `catalog-filters.ts:55-63`
- **Problem:** в одній групі змішано «Без бака / З баком / Без помпи / З помпою / З мінералізатором», а значення всередині групи OR-яться. Перевірено: CROSS + «Без бака» + «З мінералізатором» дає 5 товарів замість 1 (мінералізатор є лише в одного).
- **Why it matters:** фільтр повертає товари, які явно не відповідають вибору.
- **Recommended fix:** розбити на окремі фасети «Бак» (є/немає), «Помпа» (є/немає), «Мінералізатор» (є/немає) — між групами працює AND.
- **Estimated complexity:** S
- **Regression risk:** low (оновити URL-ключі; старі `?kit=` мапити або ігнорувати)

### ECO-007 — Характеристики неструктуровані й неконсистентні; атрибути не керуються з адмінки
- **Area:** data / attributes / admin
- **Severity:** P1
- **URL/route:** PDP («Характеристики», «Ключові характеристики», «Порівняння»)
- **File:** `products.details.specs` (jsonb, вільний `{label,value}`), `src/lib/catalog-facets.ts:368-375`, `src/app/admin/(panel)/products/[id]/product-form.tsx`
- **Problem:**
  - **287** унікальних назв характеристик на 176 товарів.
  - «Продуктивність» існує в 14 варіантах назви з різними одиницями і форматами:
    - `Продуктивність, л/год` = `60`;
    - `Продуктивність` = `78 л/год (1,3 л/хв)`;
    - `Продуктивність робоча/максимальна, м3/год` = `2,0/2,5`;
    - `…робоча / максимальна…` = `1,0 / 1,2`;
    - `Номінальна продуктивність, л/год` = `55‒65` | `150 - 160`.
  - Дублікати назв: `Робочий тиск, бар` vs `Робочий тиск`; `Температура води, °C` (латинська C) vs `°С` (кирилична); `Залізо, мг/л` vs `Вміст заліза, мг/л` vs `Залізо`.
  - Key spec «Накопичувальний бак» на одній сторінці порівняння показує `без накопичувального бака` / `Без бака` / `Є` / `7 л` (`catalog-facets.ts:372`: сирий spec або fallback).
  - «Ступенів очищення» `—` для CROSS Max/Solo.
  - 43 товари без жодної характеристики.
  - Адмінка не дає редагувати specs/attributes/documents (розділ «Характеристики» видалено в `0a5057a`) — виправити дані неможливо інакше як через seed-скрипти.
- **Why it matters:** порівняння й фільтри вводять в оману; масштабувати каталог неможливо.
- **Recommended fix (поетапно, без нової CMS):**
  1. додати в код реєстр атрибутів `{key, label, unit, type: number|range|enum|bool|text, order}`;
  2. скрипт-нормалізатор, що мапить 287 назв на ключі реєстру, парсить числа/діапазони, уніфікує `°С`/одиниці і складає звіт невідповідностей;
  3. зберігати `attributes` як `{key: value}` у типізованому вигляді;
  4. specs-таблицю PDP рендерити з реєстру (label + unit з реєстру);
  5. в адмінці — форма атрибутів за типом (number + unit фіксований, enum select).
- **Estimated complexity:** L
- **Regression risk:** medium (PDP, фільтри, key specs, meta feed)

### ECO-008 — Головна вантажить 2×1.5 MB PNG у плитки 125×200
- **Area:** performance / media
- **Severity:** P1
- **URL/route:** `/`
- **File:** `src/components/home/sections.tsx:100-116` (`PromoTile` → raw `<img src={tile.imageDesktop}>`), `:255` (`horeca.png`); `public/images/category-scenes-v3/*.png` (7 × 1.45–1.67 MB, 1672×941)
- **Problem:** промо-плитки першого екрану (desktop справа від слайдера, mobile одразу під ним) вантажать оригінальні PNG повз `next/image`. Виміряно: `ro-cartridges.png` 1586 KB + `flow-filters.png` 1497 KB = ~3 MB на головній (з ~3.9 MB усього). Додатково `horeca.png` 1.5 MB нижче. `public/images/page-headers/*.png` теж по 1.6–1.8 MB (вони йдуть через `next/image`, тож оптимізуються).
- **Why it matters:** мобільний трафік, LCP/повна вага сторінки.
- **Recommended fix:** `PromoTile` і HoReCa-секцію перевести на `next/image` з `sizes`. Конвертувати `category-scenes-v3` і `page-headers` у WebP/AVIF ≤200 KB (джерела 1672px не потрібні).
- **Estimated complexity:** S
- **Regression risk:** low

### ECO-009 — `/catalog` і `/search` віддають 800–900 KB HTML (повні об'єкти товарів у клієнт)
- **Area:** performance
- **Severity:** P1
- **URL/route:** `/catalog` (897 KB HTML + 697 KB `.rsc`), `/search?q=…` (802 KB, **dynamic** на кожен запит), категорії 200–470 KB
- **File:** `src/app/catalog/page.tsx:35`, `src/app/search/page.tsx:31`, `src/app/catalog/[category]/page.tsx:105` → `CatalogView` (`"use client"`) отримує `Product[]` разом із `details.longDescription`, `specs`, `documents`, `highlights`…
- **Problem:** картці та фільтрам потрібно ~15 полів, а серіалізується весь об'єкт (у `/catalog` 168× `longDescription`, 264× `documents`). Gzip 83 KB, але парсинг/гідрація ~0.7 MB RSC на слабких телефонах — це помітний TBT/INP.
- **Recommended fix:** на сервері мапити в `CatalogItem` (slug, sku, name, category, price, oldPrice, inStock, ctaType, image, filters/facet-поля, line, type, purpose, problem, tags, keySpecs). `/search` зробити статичним з клієнтським читанням `q` або кешувати.
- **Estimated complexity:** S–M
- **Regression risk:** low–medium (перевірити, що фасети/бейджі не використовують відкинуті поля)

### ECO-011 — Fallback на вбудований каталог при збої БД = застарілі ціни в замовленнях
- **Area:** data layer / checkout
- **Severity:** P1
- **URL/route:** весь storefront, `POST /api/order`
- **File:** `src/lib/catalog.ts:289-299`, `src/app/api/order/route.ts:77`
- **Problem:** при timeout (8 с), HTTP-помилці або **порожній** відповіді БД `getProducts()` повертає `PRODUCTS` із `products.ts`. Наслідки:
  - уже зараз розбіжності: SCALEX (`PSE200ECO`, `PSE2005ECO`) у БД у `mainline-cartridges`, у bundled — у `mainline-filters`;
  - з кожною правкою в адмінці розрив росте: приховані товари «повертаються», ціни повертаються до вересневих;
  - `/api/order` рахує total за тим самим fallback — під час інциденту замовлення приймаються за старими цінами, і ніхто про це не знає (лише `console.error`).
- **Recommended fix:**
  - для `/api/order` не використовувати fallback: якщо БД недоступна — повертати 503 і просити зателефонувати (або ставити лід із прапором «ціну не підтверджено»);
  - для storefront — віддавати останній успішний кеш (ISR і так тримає попередню версію) замість bundled;
  - порожню відповідь трактувати як помилку лише при `count=0` + алерт;
  - у перспективі прибрати `products.ts` з runtime (лишити для seed).
- **Estimated complexity:** S
- **Regression risk:** medium

### ECO-012 — Адмінка товарів: можна зберегти ціну 0 / стара < нова; немає create/delete/атрибутів
- **Area:** admin-products
- **Severity:** P1
- **URL/route:** `/admin/products/[id]`
- **File:** `src/app/admin/actions.ts:164-214` (`saveProduct`), `product-form.tsx`
- **Problem:**
  1. `price = 0` проходить валідацію (`optionalNumber` дозволяє 0). Після цього `/api/order` прийме замовлення на 0 ₴.
  2. Немає перевірки `old_price > price`. Можна отримати «знижку», де стара ціна менша за нову.
  3. Немає захисту від одночасного редагування: last write wins, `updated_at` не звіряється.
  4. Немає create/duplicate/archive/delete, категорії, бренду, характеристик, документів (див. ECO-007).
  5. `description` обрізається до 5000 символів (зараз max 168 — ризику немає, але межа мовчазна).
- **Recommended fix:**
  - валідація `price > 0` (або дозволяти 0 лише при `cta_type = 'request'`), `old_price > price`;
  - DB `CHECK` (ECO-024);
  - optimistic concurrency через hidden `updated_at` + `.eq("updated_at", …)`;
  - далі — create/archive (soft delete `is_archived`) у Phase 3.
- **Estimated complexity:** S (валідації), L (повний CRUD)
- **Regression risk:** low

---

## Medium — P2

### ECO-010 — Немає `error.tsx` / `global-error.tsx`; server actions кидають винятки
- **Area:** error handling
- **File:** `src/app/**` (жодного `error.tsx`, `loading.tsx`); `actions.ts`:
  - `updateStaffRole:349-352`;
  - `removeStaff:359-362`;
  - `deleteBanner:287`;
  - `deletePost:814`;
  - `resetPage:852-855`;
  - `moveCategory:549`;
  - `deleteCollection:645`;
  - `updateMediaAlt:484`.
- **Problem:** будь-яка помилка БД в адмінці (FK, RLS, мережа) дає стандартний екран Next «Application error». На storefront помилка в рендері дає білий екран без шапки.
- **Fix:** додати `app/error.tsx`, `app/global-error.tsx`, `app/admin/(panel)/error.tsx` з кнопкою «Спробувати ще раз». Actions, що викликаються з `<form action>`, переписати на `FormState`-повернення. Додати `loading.tsx` для адмінки.
- **Effort:** S · **Risk:** low

### ECO-013 — Менеджер має повні права на hard delete; audit log підробляється
- **Area:** authorization / audit
- **File:** RLS у `20261005130000_hardening.sql` (`staff remove products/posts/pages/collections`, `staff add audit`), `actions.ts`
- **Problem:**
  - Через PostgREST з власним JWT (publishable key публічний) будь-який manager може `DELETE` усі товари, пости, сторінки, підбірки — UI цього не обмежує. Каскад зітре й `collection_items`.
  - `audit_log` / `lead_events` INSERT дозволено staff з довільним `actor`.
  - Не логуються зміни: працівників (`addStaff`, `updateStaffRole`, `removeStaff`), `setCategoryHidden`, `moveCategory`, перестановки підбірок, `updateMediaAlt`.
- **Fix:**
  - DELETE на `products` лише для `is_admin()` (або soft delete);
  - `with check (actor = auth.uid())` для audit/lead_events, а краще — тригер, що пише audit сам;
  - логувати staff-зміни.
- **Effort:** S · **Risk:** low

### ECO-014 — «Приховати категорію» — косметика
- **File:** `src/app/catalog/[category]/page.tsx:88`, `src/app/sitemap.ts:23`, `src/app/catalog/page.tsx`, `categories-context.tsx:15`
- **Problem:** `is_hidden` прибирає категорію лише з меню і головної. Сторінка категорії відкривається, товари видно в `/catalog` і пошуку, URL є в sitemap.
- **Fix:** у category page `if (cat.hidden) notFound()` (або `noindex`); фільтрувати товари прихованих категорій у `getProducts` для storefront; sitemap брати з `getStoreCategories()`.
- **Effort:** S · **Risk:** low

### ECO-015 — Стан фільтрів: SSR без фільтрів, неповний URL-стан
- **File:** `catalog-view.tsx:53-66, 107-118`
- **Problem:**
  - `/catalog/reverse-osmosis?line=CROSS` у HTML містить 14 товарів, після гідрації — 5 (flash + CLS). Посилання підкатегорій з мега-меню ведуть саме на такі URL.
  - Ціна, «в наявності», сортування і «Показати ще» в URL не пишуться — після F5 або «Назад» скидаються.
  - Back/Forward між станами фільтрів не працює (лише `replaceState`, без `popstate`). Повернення з PDP працює коректно (перевірено).
- **Fix:** читати `searchParams` на сервері й передавати `initialSelected`; додати `sort`/`min`/`max`/`stock` у URL; слухати `popstate`.
- **Effort:** M · **Risk:** medium

### ECO-016 — JSON-LD Product: бренд завжди «Ecosoft»
- **File:** `src/app/catalog/[category]/[slug]/page.tsx:185`
- **Problem:** для BWT (4 товари), Dowex/Amberlite/Calgon у structured data стоїть `brand: Ecosoft`, хоча `productBrand()` (`catalog-facets.ts:455`) знає правильний бренд. Немає `priceValidUntil` і `seller`.
- **Fix:** `brand: productBrand(product)`.
- **Effort:** XS · **Risk:** low

### ECO-017 — Модальні вікна без focus-trap і відновлення фокусу
- **File:** `header.tsx:80-90, 242` (мобільне меню), `product-gallery.tsx:31-45, 116` (zoom), `callback-button.tsx:79-99`
- **Problem:** ESC працює, але Tab виходить за межі діалогу, а після закриття фокус губиться. Лише фільтр-drawer (`catalog-view.tsx:74-105`) зроблено правильно.
- **Fix:** винести його логіку у хук `useDialogFocus` і застосувати до трьох діалогів.
- **Effort:** S · **Risk:** low

### ECO-018 — Контраст основних кнопок 3.95:1
- **File:** `globals.css` (`--primary` ≈ `#007FF2`)
- **Problem:** білий текст 14px на primary — це «Купити», «До кошика», «Знайти», «Каталог» (30 елементів на сторінці категорії). Для WCAG AA потрібно 4.5:1. «Передзвоніть мені» має 3.59:1.
- **Fix:** затемнити primary для фону кнопок до ~`#006BD6` (≈4.6:1), не змінюючи бренд-акцент.
- **Effort:** XS · **Risk:** low (візуальна перевірка)

### ECO-019 — Rate limit: in-memory і довіряє `cf-connecting-ip`
- **File:** `src/lib/request-guard.ts:10-46`
- **Problem:**
  - Bucket живе в пам'яті процесу: при PM2 cluster чи на Vercel ліміт ділиться між інстансами.
  - IP береться з `cf-connecting-ip`/`x-forwarded-for` без перевірки, що запит прийшов від Cloudflare. IP origin `195.28.182.181` публічний (у `DEPLOY.md`), тож можна бити напряму з довільним заголовком і обходити ліміт — спам лідами в БД і Telegram.
- **Fix:** у Nginx дозволити лише Cloudflare IP-діапазони (або `real_ip_from` + відкидати чужі заголовки). Ліміт рахувати також по телефону.
- **Effort:** S · **Risk:** low

### ECO-020 — Небезпечні дії в адмінці без підтвердження; немає guard'а незбережених змін
- **File:** `staff/page.tsx:63-68` («Закрити доступ» без `confirm`), `actions.ts:306-343` (`addStaff`); усі форми
- **Problem:**
  - Видалення доступу — в один клік.
  - `addStaff` для вже існуючого email мовчки ігнорує введений пароль (повідомлення «Передайте працівнику пароль» вводить в оману) і через `upsert` може змінити роль, у тому числі власну, в обхід перевірки `updateStaffRole:349`.
  - Немає `beforeunload` при незбережених змінах у формах товару, сторінок, блогу.
- **Fix:** `confirm()` / діалог; в `addStaff` при існуючому користувачі показувати інше повідомлення і забороняти зміну ролі самого себе; додати хук `useUnsavedChanges`.
- **Effort:** S · **Risk:** low

### ECO-021 — Перевірка використання медіа неповна
- **File:** `src/lib/admin/media.ts:7-45`
- **Problem:** перевіряються лише `site_pages.content.image` (верхній рівень). Не перевіряються фото в секціях сторінок, у `posts.body` і в меню. Можна видалити файл, що ще використовується, і отримати биті зображення.
- **Fix:** рекурсивний пошук URL у `content` jsonb і `body`.
- **Effort:** S · **Risk:** low

### ECO-022 — Leaked password protection вимкнено; немає MFA для адмінів
- **Area:** security
- **Problem:** Supabase advisor (dev) повідомляє `auth_leaked_password_protection` disabled. Prod не налаштований (ECO-002).
- **Fix:** увімкнути в обох проєктах; розглянути TOTP MFA для ролі admin.
- **Effort:** XS · **Risk:** none

### ECO-023 — Нормалізація даних фото: 50 товарів із `images = []`
- **Area:** data
- **Problem:** у dev-БД у 50 товарів заповнено `image`, але `images` порожній. UI це обходить (`products/[id]/page.tsx:225`, `rowToProduct`), але дані денормалізовані, і будь-який новий споживач (feed, CRM) отримає різне.
- **Fix:** одноразова міграція `update products set images = jsonb_build_array(image) where images = '[]' and image is not null`; далі `image` = generated/derived від `images[0]`.
- **Effort:** XS · **Risk:** low

### ECO-024 — Цілісність БД покладається на код
- **File:** `20261005120000_init.sql`
- **Problem:**
  - `products.category` — довільний текст без FK на `categories.key`. Невідома категорія мовчки зникає зі storefront (`rowToProduct` повертає `null`).
  - Немає `CHECK (old_price > price)`, `CHECK (price > 0 or cta_type='request')`.
  - `sku` nullable (зараз заповнений у всіх).
  - Перестановки (`moveCategory`, `renumber`) — N послідовних UPDATE без транзакції.
- **Fix:** міграція: FK `products.category → categories.key`, CHECK-и, `sku not null`; перестановки — RPC в одній транзакції.
- **Effort:** S · **Risk:** low (перевірити на dev, що дані проходять)

### ECO-025 — Фасети з низьким покриттям
- **Area:** data / filters
- **Problem:**
  - `filtration-systems` «Лінійка фільтра» покриває лише 12/46 товарів;
  - `mainline-filters` «Типорозмір» — 7/18, «Підключення» — 15/18;
  - `ro-cartridges` «Продуктивність мембрани» — 3/37, «Частота заміни» — 18/37;
  - `mainline-cartridges` «Рейтинг фільтрації» — 19/36.

  Вибір значення ховає товари, у яких дані просто не заповнені.
- **Fix:** заповнити дані (у рамках ECO-007) або ховати фасет при покритті < ~60%.
- **Effort:** S–M · **Risk:** low

### ECO-026 — Немає згенерованих типів Supabase; god-file `actions.ts`
- **Area:** code quality
- **Problem:**
  - Усі `supabase.from(...)` нетипізовані — рядки повертаються як `any`.
  - Касти `as unknown as` (`actions.ts:130`, `collections/page.tsx:15`).
  - `actions.ts` на 860 рядків змішує 10 доменів.
  - Валідатори (`str`, `optionalNumber`, regex email) дублюються з `request-guard.ts` / `validation.ts`; email-regex задано 3 рази (`actions.ts:316, 396`, `validation.ts:8`).
- **Fix:** `supabase gen types` → `Database` generic у клієнтах; розбити `actions.ts` на `actions/{leads,products,content,staff,media}.ts`.
- **Effort:** M · **Risk:** low (поступово)

---

## Low / Polish — P3

| ID | Проблема | Де | Фікс |
|---|---|---|---|
| ECO-027 | 404 має загальний title головної, а не «Сторінку не знайдено» | `src/app/not-found.tsx` | `export const metadata = { title: "Сторінку не знайдено" }` |
| ECO-028 | Категорія «Проточні фільтри» має 1 товар, але це пункт першого рівня і промо-плитка на головній | контент | об'єднати з картриджами/осмосом або наповнити |
| ECO-029 | Телефон у шапці показано як `+380504478676` без форматування | `header.tsx` | `+38 (050) 447-86-76` (є `toPhoneContacts`) |
| ECO-030 | Перша мініатюра галереї PDP вантажить `w=384` для слоту 78px | `product-gallery.tsx` | однаковий `sizes="80px"` для всіх thumbs |
| ECO-031 | Admin-список товарів — `limit(500)` без пагінації; клієнти — 5000 лідів у пам'яті | `products/page.tsx:33`, `lib/admin/customers.ts:33` | `range()` / пагінація, коли каталог виросте |
| ECO-032 | Фасет ціни на порожньому наборі показує `Infinity` (`Math.min()` від `[]`) | `catalog-view.tsx:202-203` | guard `products.length` |
| ECO-033 | Ad-скрипти (Pixel beforeInteractive, GTM) підключаються і в адмінці — CSP їх блокує, але в консолі зайві помилки | `layout.tsx:73-111` | не рендерити теги для `/admin` (окремий layout group) |
| ECO-034 | `callback-button.tsx:79` — `onClose` у deps effect: при ре-рендері батька фокус знову стрибає на телефон | `callback-button.tsx` | `useEffectEvent` / ref |
| ECO-035 | `README.md` — шаблон create-next-app; немає опису env, Supabase, адмінки | `README.md` | короткий README з env-таблицею |

---

## Admin Audit

### Auth
- **Добре:** вхід через server action `signIn` з `next`-параметром, захищеним від open redirect (`startsWith("/admin")`, не `//`). Cookies сесії через `@supabase/ssr`. `proxy.ts` оновлює сесію. `disable_signup: true` перевірено. Logout працює (`signOut` + redirect).
- **Проблеми:**
  - ECO-003: redirect loop для не-staff.
  - ECO-022: немає leaked-password і MFA.
  - Брутфорс логіну обмежений лише rate-limit'ом Supabase Auth — власного немає.

### Authorization
- **Добре:** реальна межа — RLS. Усі admin-запити йдуть через `createSessionClient` (JWT користувача), service key використовується лише для лідів і `addStaff`. Перевірено `has_table_privilege`: anon не має INSERT/UPDATE/DELETE на жодну таблицю. `leads`, `audit_log`, `admin_users`, `media_assets` для anon закриті повністю. Client-side guard не є єдиним захистом.
- **Проблеми:** ECO-013 — manager може hard-delete каталог, audit підробляється. Сторінки адмінки самі `requireStaff` не викликають (лише layout), але дані захищені RLS — прийнятно.

### Dashboard
Реальні дані. 6 count/select-запитів паралельно + 2 бейджі в layout = 8 запитів на завантаження. Zero state («Заявок ще немає») є. Loading-стану немає (ECO-010). Виручка рахується вибіркою всіх completed за 30 днів — для поточних обсягів нормально.

### Products
Лише редагування (ECO-012). Немає create/delete/archive, характеристик, документів, категорії, бренду (ECO-007). Ідентифікатори (slug/sku) заблоковані для редагування — **правильне рішення** через Meta feed. Перемикачі «В наявності»/«Приховано» в списку з optimistic UI і обробкою помилки — добре.

### Categories
Плоский фіксований список з 8 ключів, ієрархії немає. Тому circular hierarchy / orphan / duplicate slug **неможливі за конструкцією** (`key` — PK, insert/delete політик немає). SEO-поля є. Приховування — косметичне (ECO-014). Перестановка неатомарна (ECO-024).

### Brands
Не існують як сутність. Бренд виводиться евристикою з назви (`productBrand`), JSON-LD хардкодить Ecosoft (ECO-016).

### Attributes
Не керуються з адмінки. Дані неконсистентні (ECO-007, ECO-025). Admin не дозволяє створити неконсистентні атрибути лише тому, що взагалі не дозволяє їх редагувати. Неконсистентність уже закладена імпортом.

### Media
- **Добре:** клієнтське стиснення до WebP ≤2000px; whitelist MIME (без SVG — XSS неможливий); bucket-ліміт 10 MB; відкат файлу при помилці реєстрації; перевірка, що Storage справді видалив файл.
- **Проблеми:** ECO-021 (неповна перевірка використань); `alt` у бібліотеці не підтягується в `alt` товару; дублікати файлів не виявляються.

### Forms
`useActionState` + серверна валідація + зрозумілі українські повідомлення. Немає guard'а незбережених змін і підтвердження небезпечних дій (ECO-020). Помилки БД показуються сирим `error.message` англійською.

### Tables
Товари: пошук, фільтр категорії, «вигляди» (знижка/немає/приховані), без пагінації і bulk-дій (масова зміна ціни чи наявності неможлива). Ліди: фільтри статусу/типу.

### Data integrity
ECO-023, ECO-024. Позитив: `slug`/`sku` унікальні в БД, дублікатів немає (перевірено SQL), orphan-категорій немає, порожніх назв немає.

### Mobile
Сайдбар перетворюється на off-canvas з бургером (`sidebar.tsx`), таблиці мають `overflow-x`. Off-canvas без focus-trap (як ECO-017).

### Security
Див. розділ нижче. Критичних дірок в адмінці не знайдено.

### Performance
Адмінка повністю dynamic, `Cache-Control: no-store`, `noindex`. `mediaUsage()` тягне всі products/banners/posts/pages на кожне видалення і відкриття медіатеки — для 176 товарів прийнятно.

---

## Security Findings

| ID | Severity | Суть |
|---|---|---|
| ECO-013 | P2 | manager → hard delete каталогу через REST; audit_log підробляється |
| ECO-019 | P2 | обхід rate-limit через прямий доступ до origin + підроблений `cf-connecting-ip` |
| ECO-022 | P2 | leaked password protection вимкнено, немає MFA |
| ECO-003 | P1 | redirect loop (DoS для конкретного акаунта, не ескалація) |

**Перевірено і в порядку:**

- секретів у клієнтському бандлі немає (лише `NEXT_PUBLIC_SUPABASE_URL` і publishable key);
- `SUPABASE_SECRET_KEY` використовується лише в `server-only` модулях;
- `JsonLd` екранує `<`;
- `dangerouslySetInnerHTML` ніде більше не використовується;
- посилання з адмінки валідуються (`/` | `https://` | `tel:` | `mailto:`, без `javascript:`);
- Telegram-тексти екрануються (`escapeHtml`);
- order API рахує ціни на сервері, має honeypot і body-size limit;
- PostgREST `.or()` у пошуку адмінки санітизовано;
- open redirect у логіні закрито;
- CSP суворіша для `/admin`, `frame-ancestors 'none'`;
- Storage — лише зображення без SVG;
- signup вимкнено.

---

## Performance Findings

| ID | Severity | Суть | Вплив |
|---|---|---|---|
| ECO-008 | P1 | 3 MB PNG на головній | LCP/вага mobile |
| ECO-009 | P1 | 0.7–0.9 MB RSC/HTML на `/catalog`, `/search` (dynamic) | TBT/INP, TTFB `/search` |
| ECO-015 | P2 | фільтрований URL рендериться без фільтра | CLS |
| ECO-030 | P3 | зайвий розмір thumb | дрібно |

**Добре:**

- `products.ts` (652 KB) **не потрапляє** в клієнтський бандл (перевірено по chunks);
- JS на головній ~218 KB (encoded);
- товарні фото йдуть через `next/image` з `sizes`;
- банери у Supabase — WebP 50–170 KB;
- перший слайд `fetchPriority=high`, решта lazy;
- шрифти `next/font` з `display: swap`;
- категорії й PDP — SSG + ISR 5 хв + on-demand `updateTag`.

---

## SEO Findings

**Перевірено і в порядку:**

- унікальні `<title>` / `description` на основних типах сторінок;
- canonical на всіх сторінках (у тому числі info-сторінках через `infoPageMetadata`);
- `/search` має `noindex, follow`; `/cart`, `/admin` — `noindex`;
- 404 повертає справжній статус 404 + `noindex`;
- `robots.txt` закриває `/api`, `/cart`, `/admin`;
- sitemap містить товари з image;
- JSON-LD Product (price, availability, sku) + BreadcrumbList + OnlineStore + WebSite/SearchAction;
- фільтрові URL мають canonical на категорію, тож дублікатів немає;
- redirect 308 для перенесених SCALEX.

**Проблеми:**
- ECO-016 — бренд у Product schema.
- ECO-014 — приховані категорії в sitemap.
- ECO-027 — title 404.
- Підкатегорії (`?line=CROSS`) не мають власних індексованих сторінок. Якщо L2-трафік важливий («фільтри PURE», «картриджі BB20»), варто зробити їх окремими маршрутами з власним H1 і текстом. Це рекомендація для Phase 5, а не баг.

---

## UX/UI Findings

**Загальне враження.** Сайт виглядає як цілісний професійний ecommerce: сітка, картки, типографіка (Inter + Manrope), іконки lucide, стриманий синій. AI-slop-патернів (надлишкових градієнтів, glassmorphism, «псевдо-преміуму») **не виявлено**. Redesign не потрібен.

**Проблеми:**

- ECO-001 — мобільний каталог;
- ECO-004 — кошик;
- ECO-005 — пошук;
- ECO-006 — фільтр «Комплектація»;
- ECO-007 — порівняння показує різні формати одного атрибута і «—»;
- ECO-028 — категорія з 1 товаром на першому рівні;
- ECO-029 — формат телефону;
- порожній стан пошуку не пропонує альтернатив (ECO-005).

**Функцій немає:** обране, порівняння (довільне), акаунт покупця. Це не баги, а відсутній функціонал. Рішення про його потрібність — бізнесове.

## Mobile Findings

| ID | Severity | Суть |
|---|---|---|
| ECO-001 | P0 | горизонтальний overflow каталогу 943–1715px |
| ECO-017 | P2 | меню, зум і callback-модалка без focus-trap |

**Перевірено і в порядку на 390×844:**

- головна (без overflow);
- PDP (галерея, sticky CTA «Ціна / Купити»);
- кошик;
- мобільний фільтр-drawer: overlay, ESC, focus-trap, повернення фокусу;
- бургер-меню.

Tablet (768/1024) візуально не проганявся окремо. Фікс ECO-001 треба перевірити на 768 і 1024 — там той самий одно-колонковий grid до `lg`.

## Database / Data Findings

**SQL-аудит dev-БД (176 товарів):**

- без категорії, без SKU, з дублікатами slug/SKU, з ціною 0, з `old ≤ price`, з порожньою назвою, з orphan-категорією, прихованих — **0**;
- `images = []` при заповненому `image` — **50** (ECO-023);
- лідів 0, media 6, staff 2, auth users 2 (усі staff).

Аудит вбудованого каталогу: 43 товари без specs, 287 назв характеристик, неконсистентні одиниці (ECO-007). Bundled vs DB: 2 товари в різних категоріях (ECO-011).

| Таблиця | SELECT | INSERT | UPDATE | DELETE | Роль | Проблема |
|---|---|---|---|---|---|---|
| products | anon/auth: `not is_hidden` або staff | staff | staff | staff | — | ECO-013: DELETE для manager |
| categories | всі | — | staff | — | — | немає FK з products (ECO-024) |
| banners | live або staff | staff | staff | staff | — | — |
| collections / items | всі | staff | staff | staff | — | — |
| posts | published або staff | staff | staff | staff | — | manager може видаляти |
| site_pages / site_menus | всі | staff | staff | staff / — | — | — |
| site_settings | public або staff | admin | admin | — | — | ✔ |
| leads | staff | (service key) | staff | admin | — | ✔ |
| lead_events / audit_log | staff | staff | — | — | — | `actor` не прив'язаний до `auth.uid()` |
| admin_users | staff | admin | admin | admin | — | ✔ |
| media_assets | staff | staff | staff | staff | — | ✔ |
| storage.objects (media) | public bucket + staff list | staff | staff | staff | — | ✔ (MIME whitelist, 10 MB) |

**Критична умова виконується:** anon/public **не може** змінювати catalog/admin data напряму.

## Code Quality Findings

- **ECO-026:** нетипізований Supabase, god-file `actions.ts` (860 рядків), дубльовані валідатори та email-regex.
- `catalog-view.tsx` (674 рядки) поєднує стан, URL-синхронізацію, фасети, drawer і підкатегорії. Варто винести `useCatalogUrlState` і `FiltersPanel` в окремі файли (у межах ECO-015, без окремого рефакторингу).
- `eslint-disable react-hooks/set-state-in-effect` (`catalog-view.tsx:58, 154`) — derived state через effect. Після ECO-015 (ініціалізація з `searchParams`) зникне.
- `productSearchText` перераховується для кожного товару на кожне натискання клавіші — для 176 товарів неважливо, але при ECO-005 варто мемоізувати індекс.
- Дублювання: `startOfKyivDay` / формати дат; `collectionSlug` (`actions.ts:577`) vs `slugify` (`posts-shared.ts`) — дві транслітерації.
- `scripts/` і `products.ts` — легасі-шлях даних. Після міграції в БД залишити для seed, з runtime прибрати (ECO-011).

---

## QUICK WINS (Impact HIGH · Effort LOW)

1. **ECO-001** — `min-w-0` на колонку каталогу (1 рядок) — це P0.
2. **ECO-008** — `PromoTile` і HoReCa на `next/image` + стиснення `category-scenes-v3` у WebP (−3 MB на головній).
3. **ECO-006** — розбити «Комплектацію» на 3 фасети.
4. **ECO-012 (частина)** — валідація `price > 0`, `old_price > price` у `saveProduct`.
5. **ECO-003** — прибрати redirect з `/admin/login?denied=1` і зробити sign-out.
6. **ECO-004 (частина)** — clamp qty ≤ 20 і Pixel value з `data.total`.
7. **ECO-016** — `brand: productBrand(product)` у JSON-LD.
8. **ECO-014** — `notFound()` / sitemap для прихованих категорій.
9. **ECO-010** — `error.tsx` + `global-error.tsx` + admin `error.tsx`.
10. **ECO-018** — затемнити фон primary-кнопок до AA.
11. **ECO-022** — увімкнути leaked password protection (один перемикач).
12. **ECO-023** — одноразовий SQL для `images`.

## DO NOT TOUCH

Ці частини зроблені добре — переписувати не потрібно:

- **RLS-модель** і `private.is_staff()` / `is_admin()` (hardening-міграції, revoke anon). Лише точкові зміни з ECO-013.
- **`/api/order`** — серверне визначення ціни й наявності, honeypot, idempotent `external_id`, `deliverLead` з кількома каналами і `after()`.
- **Архітектура читання каталогу** (PostgREST fetch + `next.tags` + `updateTag` з actions). Не переходити на клієнтський supabase-js на storefront.
- **SSG/ISR маршрути каталогу і PDP**, metadata, canonical, sitemap, robots, JSON-LD (крім ECO-016).
- **CSP і security headers**, окрема строга CSP для `/admin`.
- **Медіа-аплоад** з клієнтським стисненням і MIME whitelist.
- **Незмінність slug/SKU/category** в адмінці (захист Meta feed).
- **Мобільний фільтр-drawer** (focus-trap/ESC) — взірець для інших модалок.
- **Дизайн-система / візуальний стиль** — без redesign.
- **`cart-context` на `useSyncExternalStore`** — правильний патерн; змінювати лише логіку звірки (ECO-004).

## RECOMMENDED IMPLEMENTATION ORDER

**Phase 1 — production blockers**
1. ECO-001 (mobile catalog)
2. ECO-002 (prod Supabase: міграції, дані, адмін, env, DEPLOY.md)
3. ECO-011 (`/api/order` без bundled fallback)
4. ECO-012a (валідація ціни)
5. ECO-003 (redirect loop)
6. ECO-022 (leaked password)

**Phase 2 — catalog/data correctness**
1. ECO-004 (звірка кошика)
2. ECO-006 (фасет «Комплектація»)
3. ECO-005 (пошук)
4. ECO-023 / ECO-024 (міграції цілісності)
5. ECO-007 етап 1–2 (реєстр атрибутів + нормалізатор + звіт)
6. ECO-025
7. ECO-014

**Phase 3 — admin**
1. ECO-010 (error boundaries + FormState)
2. ECO-013 (права на delete, audit через тригер)
3. ECO-020 (підтвердження, unsaved guard, `addStaff`)
4. ECO-021
5. ECO-007 етап 3 (редактор атрибутів)
6. ECO-012b (create/archive товару)
7. bulk-дії та пагінація (ECO-031)

**Phase 4 — UX/mobile**
1. ECO-015 (URL-стан фільтрів, SSR initial)
2. ECO-017 (focus-trap)
3. ECO-018 (контраст)
4. ECO-028
5. ECO-029
6. ECO-032
7. ECO-034

**Phase 5 — SEO/performance**
1. ECO-008
2. ECO-009
3. ECO-016
4. ECO-027
5. ECO-030
6. ECO-033
7. індексовані L2-сторінки (за рішенням)

**Phase 6 — code cleanup**
1. ECO-026 (типи Supabase, розбиття `actions.ts`)
2. ECO-035 (README)
3. прибрати `products.ts` з runtime

## FINAL CHECKLIST

**Release blockers**
- [ ] Мобільний каталог без горизонтального скролу на 390/430/768/1024 у всіх 8 категоріях (ECO-001)
- [ ] Prod Supabase: 12 міграцій застосовано, товари засіяно, admin створено (ECO-002)
- [ ] На VPS задано `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `TELEGRAM_*` (ECO-002)
- [ ] `/api/catalog` на prod віддає дані з БД, а не bundled (ECO-002/011)
- [ ] `/api/order` не приймає замовлення за bundled-цінами (ECO-011)
- [ ] Ціна 0 і `old_price ≤ price` не зберігаються (ECO-012)
- [ ] Видалений працівник бачить сторінку логіну, а не redirect loop (ECO-003)
- [ ] Leaked password protection увімкнено в prod (ECO-022)

**Каталог і замовлення**
- [ ] Кошик показує актуальні ціни/наявність і обмежує qty ≤ 20 (ECO-004)
- [ ] Тестове замовлення доходить у БД, Telegram і адмінку; номер збігається
- [ ] Фільтри: AND між групами, коректні лічильники (ECO-006)
- [ ] Пошук: `фильтр`, `кросс`, `железо`, `соль`, SKU дають релевантні результати (ECO-005)
- [ ] Прихована категорія віддає 404 і зникає з sitemap (ECO-014)

**Якість і SEO**
- [ ] Головна < 1.5 MB на mobile, без PNG > 300 KB (ECO-008)
- [ ] `error.tsx` / `global-error.tsx` присутні (ECO-010)
- [ ] Rich Results Test: Product з правильним брендом (ECO-016)
- [ ] Nginx приймає трафік лише від Cloudflare (ECO-019)

**Фінальна перевірка**
- [ ] Регресія: каталог, фільтри, пошук, кошик, PDP, mobile, адмінка (вхід / вихід / редагування товару / медіа), callback і контактна форма
