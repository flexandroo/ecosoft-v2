# Прод sofiivkawater.com — як влаштовано і як обслуговувати

Актуально на 2026-10-27. Стек: **Next.js 16 (Node 22) + systemd + Nginx + Cloudflare + Supabase**.

| Параметр | Значення |
|----------|----------|
| Домен | `sofiivkawater.com` (+ `www` → редірект), DNS і проксі — **Cloudflare** |
| Сервер | VPS `195.28.182.181`, Ubuntu 22.04, 1 ГБ RAM + 3 ГБ swap, 9,6 ГБ диск |
| SSH | `ssh -p 3333 root@195.28.182.181` (порт **3333**) |
| Дані | Supabase `sofiivkawater-prod` (`uxynzxcrdavauvbmldcv`): каталог, ціни, банери, блог, налаштування, заявки |
| Заявки | `/api/order`, `/api/callback`, `/api/contact` → база (адмінка «Заявки») + Telegram-група менеджерів |
| Код | гілка **`main`** репозиторію `flexandroo/ecosoft-v2` |

```
 браузер ─▶ Cloudflare ─▶ Nginx :443 (лише IP Cloudflare) ─▶ Next.js 127.0.0.1:3000 (ecosoft-web.service)
                                                               ├─▶ Supabase (prod)
                                                               └─▶ Telegram Bot API
 Telegram ─▶ Cloudflare ─▶ /api/telegram/webhook (кнопки статусу, /setup)
```

---

## 1. Оновлення сайту — автоматично

**Будь-який push у `main` за 2–10 хвилин сам потрапляє на сайт.** Робота ведеться в `dev`
(превью на Vercel), у `main` вливається лише перевірене.

Як це працює (`ecosoft-deploy.timer`, кожні ~2 хв → `/usr/local/sbin/ecosoft-deploy`):

1. `git fetch origin main` у `/home/deploy/app` (там лише git, нічого не запускається);
2. новий коміт збирається в `/home/deploy/releases/<sha>`: `git archive` → `npm ci` → `npm run build`,
   `.env.local` — посилання на `/home/deploy/shared/.env.local`;
3. `/home/deploy/current` перемикається на нову версію, перезапускається `ecosoft-web.service`;
4. перевірка `http://127.0.0.1:3000/`; якщо сайт не відповідає — **автоматичний відкат** на попередню версію;
5. зберігаються 3 останні версії, старіші видаляються.

Якщо збирання впало (пам'ять, диск) — сайт лишається на попередній версії, нічого не ламається.

Корисне:

```bash
cat /home/deploy/shared/deployed-commit          # що зараз на сайті
journalctl -u ecosoft-deploy -n 50 --no-pager    # журнал останніх деплоїв
systemctl status ecosoft-web                     # стан сайту
journalctl -u ecosoft-web -n 100 --no-pager      # журнал сайту
```

### Примусово перезібрати поточну версію

Потрібно після зміни `NEXT_PUBLIC_*` змінних (вони вшиваються у збірку). Звичайні серверні
змінні (`TELEGRAM_*`, `SUPABASE_SECRET_KEY`, `META_*`) підхоплюються простим
`systemctl restart ecosoft-web`.

Найпростіше — порожній коміт у `main`: новий коміт = звичайне збирання з автовідкатом.

```bash
git commit --allow-empty -m "chore: rebuild prod" && git push origin main
```

(Не видаляйте `.build-complete` у папці поточної версії: скрипт тоді покладе нову збірку
всередину старої папки.)

---

## 2. Змінні оточення — `/home/deploy/shared/.env.local`

```bash
# Supabase (prod) — каталог, ціни, замовлення, адмінка
NEXT_PUBLIC_SUPABASE_URL=https://uxynzxcrdavauvbmldcv.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...

# Telegram — бот @sofievkawater_bot
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...                 # запасний чат, якщо група менеджерів недоступна
TELEGRAM_WEBHOOK_SECRET=...          # той самий, що в setWebhook

# Необов'язково: серверні конверсії
# META_CAPI_ACCESS_TOKEN=...         # Meta Conversions API
# GA4_MEASUREMENT_ID=... GA4_API_SECRET=...
```

Права файлу — `600`, власник `deploy`. **Не** ставити на проді `NEXT_PUBLIC_DISABLE_TRACKING`
і `META_TEST_EVENT_CODE`. Без змінних Supabase сайт мовчки працює на вбудованому каталозі
(старі ціни, без акцій і адмінки) — перевірка: `/api/catalog` має показувати **179+** товарів.

---

## 3. Сервер

- **Сайт:** `ecosoft-web.service` (`/usr/bin/node node_modules/next/dist/bin/next start -H 127.0.0.1 -p 3000`,
  користувач `deploy`, `WorkingDirectory=/home/deploy/current`).
- **Node.js 22** з репозиторію NodeSource (`/etc/apt/sources.list.d/nodesource.sources`, гілка `node_22.x`).
- **Swap 3 ГБ** (`/swapfile` 1 ГБ + `/swapfile2` 2 ГБ, у `/etc/fstab`) — без нього `next build`
  на 1 ГБ RAM падає з OOM.
- **Журнали** обмежені 100 МБ (`/etc/systemd/journald.conf.d/size.conf`).
- **Диск тісний:** одна версія сайту ≈ 1 ГБ. Перевіряти `df -h /`; якщо вільно < 1,5 ГБ —
  `journalctl --vacuum-size=80M && apt-get clean`. Рекомендовано тариф 2 ГБ RAM / 20 ГБ диска.

### Nginx

- `/etc/nginx/sites-available/sofiivkawater.com` — проксі на `127.0.0.1:3000`, HSTS, gzip.
- `/etc/nginx/conf.d/cloudflare-realip.conf` — справжній IP відвідувача з `CF-Connecting-IP`
  (ліміти форм і входу в адмінку рахуються по ньому).
- `/etc/nginx/conf.d/cloudflare-only.conf` — `$from_cloudflare` за IP з'єднання; у блоці 443
  `if ($from_cloudflare = 0) { return 403; }`. Напряму за IP сайт не відкривається, порт 80 лише
  редіректить на HTTPS (потрібен для продовження сертифіката).
- Списки мереж Cloudflare: https://www.cloudflare.com/ips/ — звіряти раз на кілька місяців
  (у обох файлах).
- Після правок: `nginx -t && systemctl reload nginx`.

### HTTPS

Сертифікат Let's Encrypt (`certbot`, автентифікатор `nginx`), автопродовження — `certbot.timer`.
Перевірка: `certbot renew --dry-run`.

---

## 4. Telegram-бот заявок

- Заявки йдуть у **групу менеджерів з темами**: 🛒 Замовлення / 📞 Зворотний дзвінок / ✉️ Звернення.
  Під кожною — кнопки статусу, синхронні з адмінкою.
- Група зберігається в Supabase: `site_settings` ключ `telegram_group` (chat id + id тем).
- **Підключити іншу групу:** створити одноразовий код у `site_settings`
  (`telegram_setup` = `{"code": "...", "expiresAt": "..."}`), у новій групі з увімкненими «Темами»
  зробити бота адміністратором з правом «Керування темами» і написати `/setup КОД`.
- **Webhook** (одноразово або після зміни секрету):

```bash
T=$(grep ^TELEGRAM_BOT_TOKEN= /home/deploy/shared/.env.local | cut -d= -f2-)
S=$(grep ^TELEGRAM_WEBHOOK_SECRET= /home/deploy/shared/.env.local | cut -d= -f2-)
curl -s "https://api.telegram.org/bot$T/setWebhook" -H 'Content-Type: application/json' \
  -d "{\"url\":\"https://sofiivkawater.com/api/telegram/webhook\",\"secret_token\":\"$S\",\"allowed_updates\":[\"message\",\"callback_query\"]}"
curl -s "https://api.telegram.org/bot$T/getWebhookInfo"     # last_error_message має бути порожнім
```

---

## 5. База даних (Supabase)

- Зміни схеми — міграції в `supabase/migrations/`, застосовуються **і на dev, і на prod**
  (prod — по одній, у SQL Editor або MCP `apply_migration`).
- Курс НБУ оновлює сама база (pg_cron `nbu-usd-rate`, двічі на день): ціни = USD × курс.
- Бекапи — Supabase → Database → Backups.
- Порядок наповнення порожньої бази з нуля — [docs/PROD_RELEASE_CHECKLIST.md](docs/PROD_RELEASE_CHECKLIST.md).

---

## 6. Якщо щось не так

| Симптом | Що робити |
|---------|-----------|
| Сайт 502/не відкривається | `systemctl status ecosoft-web`, `journalctl -u ecosoft-web -n 100` |
| Новий коміт не з'явився | `journalctl -u ecosoft-deploy -n 80` — OOM або місце на диску (`df -h /`) |
| Старі ціни / немає акцій | у `.env.local` немає змінних Supabase → додати і перезібрати (розд. 1) |
| Заявки не йдуть у групу | `getWebhookInfo`; чи бот ще адмін групи; запасний чат `TELEGRAM_CHAT_ID` |
| Сайт 403 через Cloudflare | Cloudflare додав нові мережі — оновити списки в `conf.d/cloudflare-*.conf` |

Резервні копії на сервері: `/root/nginx-sofiivkawater.com.bak-20261027`,
`/root/nodesource.sources.node20.bak`, дані старої CRM — `/root/ecosoftcrm-final-20261027.tar.gz`.
