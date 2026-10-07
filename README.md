# sofiivkawater.com — партнерський магазин Ecosoft

Next.js 16 (App Router) + Supabase (каталог, заявки, адмінка `/admin`). Деплой на VPS — див. [DEPLOY.md](DEPLOY.md).

## Локальний запуск

```bash
npm ci
npm run dev
```

Без змінних Supabase сайт працює на вбудованому каталозі (`src/lib/products.ts`), адмінка недоступна, заявки йдуть лише в Telegram.

## Змінні оточення (`.env.local`)

| Змінна | Де потрібна | Опис |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | сайт, адмінка | URL проєкту Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | сайт, адмінка | публічний ключ (RLS дозволяє анонімам лише читання каталогу) |
| `SUPABASE_SECRET_KEY` | сервер | збереження заявок у БД, додавання працівників. Лише на сервері |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | сервер | сповіщення про заявки |
| `CRM_API_URL`, `CRM_INTAKE_TOKEN` | сервер | стара зовнішня CRM (поки підключена) |
| `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`, `GA4_MEASUREMENT_ID`, `GA4_API_SECRET` | сервер | серверні конверсії (Meta CAPI, GA4 Measurement Protocol) |
| `NEXT_PUBLIC_DISABLE_TRACKING=1` | dev/preview | вимикає Meta Pixel і GTM |

## База даних

- Міграції: `supabase/migrations/` — застосовувати по порядку (Supabase CLI або SQL editor).
- Товари: `node scripts/seed-products.mts <env-file>` (потрібні `NEXT_PUBLIC_SUPABASE_URL` і `SUPABASE_SECRET_KEY`).
- Перший адміністратор: створити користувача в Supabase Auth і додати рядок у `public.admin_users` з `role = 'admin'`; далі працівників додають у `/admin/staff`.

## Скрипти

| Команда | Що робить |
|---|---|
| `npm run build` | перевірка каталогу (`verify:catalog`) + production-збірка |
| `npm run lint` | ESLint |
| `npm run audit:specs` | звіт про неконсистентні характеристики товарів |
| `npm run audit:product-images`, `audit:documents`, `audit:site` | перевірки фото, документів і сайту |

## Аудит

Повний аудит і план виправлень: [AUDIT_ECOSOFT_FULL.md](AUDIT_ECOSOFT_FULL.md), машиночитний беклог — [AUDIT_BACKLOG.json](AUDIT_BACKLOG.json), кроки релізу — [PROD_RELEASE_CHECKLIST.md](PROD_RELEASE_CHECKLIST.md).
