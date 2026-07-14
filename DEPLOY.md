# Деплой sofiivkawater.com — детальний гайд

Стек: **Next.js 16 (Node) + PM2 + Nginx + Let's Encrypt** на Ubuntu 22.04.

| Параметр | Значення |
|----------|----------|
| Домен    | `sofiivkawater.com` (+ `www`) |
| Сервер   | `195.28.182.181`, Ubuntu 22.04 |
| Схема    | Інтернет → **Nginx** :80/:443 → reverse-proxy → **Next.js** 127.0.0.1:3000 (**PM2**) |
| Заявки   | `/api/order`, `/api/contact`, `/api/callback` → **Telegram-бот** |

```
                 ┌────────────── сервер 195.28.182.181 ──────────────┐
 браузер ──443──▶│  Nginx (TLS, gzip, статика)                        │
                 │     └─proxy─▶ Next.js :3000  ──▶  Telegram Bot API  │
                 │                 (PM2 keeps alive)                   │
                 └────────────────────────────────────────────────────┘
```

Час на все: ~30–40 хвилин.

---

## 0. Що підготувати заздалегідь

- **SSH-доступ** до сервера (root або sudo-користувач) — пароль або ключ.
- **Доступ до DNS** домену `sofiivkawater.com` (панель реєстратора).
- **Код у Git** — репозиторій, з якого будемо клонувати. Зараз зміни (ціни НБУ, GTM,
  прийом заявок у Telegram) лежать лише в локальній копії — їх треба запушити (крок 1).
- **Telegram-акаунт** — щоб створити бота і отримувати заявки.

---

## 1. Залити свіжий код у репозиторій

Локально, у `d:\ecosoft-site`:

```bash
git add -A
git commit -m "feat: NBU prices, GTM, Telegram order/contact/callback intake, deploy guide"
git push origin main          # або окрему гілку, яку потім змержите
```

> Якщо пушите не в `main`, а в гілку — запам'ятайте її назву, знадобиться на кроці 4.
> `.env.local` з токенами в репозиторій **не** потрапляє (він у `.gitignore`) — це правильно.

---

## 2. DNS

У панелі реєстратора домену створіть дві A-записи на IP сервера:

| Тип | Хост  | Значення         | TTL  |
|-----|-------|------------------|------|
| A   | `@`   | `195.28.182.181` | 3600 |
| A   | `www` | `195.28.182.181` | 3600 |

Якщо стоїть Cloudflare — на час випуску сертифіката поставте проксі в положення
**DNS only** (сіра хмара), інакше `certbot` може не пройти валідацію.

Перевірка (зачекайте 5–30 хв на поширення):

```bash
dig +short sofiivkawater.com        # має вивести 195.28.182.181
dig +short www.sofiivkawater.com
```

---

## 3. Перше підключення і базова безпека

```bash
ssh root@195.28.182.181
```

Оновлення системи:

```bash
apt update && apt upgrade -y
```

Окремий користувач для застосунку (не запускаємо сайт від root):

```bash
adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy

# скопіювати ваш SSH-ключ новому користувачу (якщо заходите по ключу)
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy/
```

Файрвол — відкриваємо лише SSH і веб:

```bash
apt install -y ufw
ufw allow OpenSSH
ufw allow 'Nginx Full'      # 80 + 443
ufw --force enable
ufw status
```

(Опційно) захист від брутфорсу SSH:

```bash
apt install -y fail2ban
systemctl enable --now fail2ban
```

(Опційно, для VPS з ≤1 ГБ RAM) — swap, щоб `npm run build` не впав по пам'яті:

```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## 4. Встановлення ПЗ і коду

Ставимо Node 20 LTS (Next 16 вимагає **Node ≥ 20.9**), git, nginx, pm2:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs git nginx
npm install -g pm2
node -v     # v20.x
```

Далі — вже від користувача `deploy`:

```bash
su - deploy
cd ~
git clone https://github.com/flexandroo/ecosoft-v2.git app
cd app
# git checkout НАЗВА_ГІЛКИ      # якщо деплоїте не main

npm ci                          # чиста установка залежностей за package-lock
```

> **Приватний репозиторій?** Згенеруйте deploy-ключ:
> `ssh-keygen -t ed25519 -C deploy@sofiivka -f ~/.ssh/id_ed25519` → додайте
> `~/.ssh/id_ed25519.pub` у GitHub → Settings → Deploy keys, і клонуйте по `git@github.com:...`.
>
> **Без GitHub взагалі?** Залийте код напряму з локальної машини:
> `rsync -avz --exclude node_modules --exclude .next ./ deploy@195.28.182.181:~/app/`

---

## 5. Telegram — куди приходять заявки

### 5.1. Створити бота
1. У Telegram відкрийте **@BotFather** → `/newbot`.
2. Вкажіть ім'я і username бота → отримаєте **токен** виду
   `123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

### 5.2. Дізнатися chat_id (куди слати)
- **Особистий чат:** напишіть боту будь-що (напр. `/start`), потім відкрийте в браузері
  `https://api.telegram.org/bot<ТОКЕН>/getUpdates` → знайдіть `"chat":{"id":123456789}`.
  Альтернатива — бот **@userinfobot** підкаже ваш id.
- **Група менеджерів:** створіть групу, додайте бота, напишіть у групу повідомлення,
  відкрийте той самий `getUpdates`. Id групи від'ємний, напр. `-1001234567890`.

### 5.3. Записати змінні на сервері
```bash
cd ~/app
cat > .env.local <<'EOF'
TELEGRAM_BOT_TOKEN=123456789:AAE...ваш_токен
TELEGRAM_CHAT_ID=123456789
EOF
chmod 600 .env.local
```

`.env.local` Next автоматично підхоплює і у продакшн-режимі (`next start`). Токен
серверний (без префікса `NEXT_PUBLIC_`) — у браузер не потрапляє.

---

## 6. Збірка і запуск через PM2

```bash
cd ~/app
npm run build
```

Створіть конфіг PM2 (зручніше, ніж довга команда):

```bash
cat > ~/app/ecosystem.config.js <<'EOF'
module.exports = {
  apps: [{
    name: "ecosoft",
    script: "node_modules/next/dist/bin/next",
    args: "start -p 3000",
    cwd: "/home/deploy/app",
    instances: 1,
    autorestart: true,
    max_memory_restart: "512M",
    env: { NODE_ENV: "production" },
  }],
};
EOF

pm2 start ~/app/ecosystem.config.js
pm2 save
```

Автозапуск після ребуту — виконайте команду і вставте рядок, який підкаже вивід:

```bash
pm2 startup systemd -u deploy --hp /home/deploy
# приклад того, що треба скопіювати й виконати від root:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy
```

Перевірка, що застосунок живий локально:

```bash
curl -I http://127.0.0.1:3000      # HTTP/1.1 200 OK
pm2 status
```

---

## 7. Nginx — reverse proxy + статика + gzip

```bash
sudo tee /etc/nginx/sites-available/sofiivkawater.com >/dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name sofiivkawater.com www.sofiivkawater.com;

    # безпечні заголовки
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header Referrer-Policy strict-origin-when-cross-origin;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript
               image/svg+xml application/xml;
    gzip_min_length 1024;

    client_max_body_size 2m;

    # незмінна статика Next — кешуємо агресивно
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 30s;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/sofiivkawater.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Тепер `http://sofiivkawater.com` має відкривати сайт.

---

## 8. HTTPS (Let's Encrypt, безкоштовно)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx \
     -d sofiivkawater.com -d www.sofiivkawater.com \
     --redirect --agree-tos --no-eff-email -m ВАШ_EMAIL
```

`certbot` сам додасть блок `listen 443 ssl`, сертифікати і редірект `http → https`.
Автопродовження вже налаштоване:

```bash
systemctl status certbot.timer
sudo certbot renew --dry-run       # тест продовження
```

Перевірка з боку клієнта:

```bash
curl -I https://sofiivkawater.com  # HTTP/2 200
```

---

## 9. Фінальна перевірка заявок

1. Відкрити `https://sofiivkawater.com`, додати товар → **Кошик** → заповнити
   ім'я+телефон → **Оформити замовлення** → у Telegram має прийти «🛒 Нове замовлення».
2. **Безкоштовний дзвінок** (кнопка в шапці) → «📞 Замовлення безкоштовного дзвінка».
3. Сторінка **Контакти**, форма «Залишити звернення» → «✉️ Нова заявка з сайту».

Усі три канали (`/api/order`, `/api/contact`, `/api/callback`) використовують того ж
бота і `TELEGRAM_CHAT_ID` — окремого налаштування не потребують.

Якщо не приходить — дивимось логи:

```bash
pm2 logs ecosoft --lines 50
```

---

## 10. Оновлення сайту (redeploy)

Заведіть скрипт:

```bash
cat > ~/app/redeploy.sh <<'EOF'
#!/usr/bin/env bash
set -e
cd /home/deploy/app
git pull
npm ci
npm run build
pm2 reload ecosoft        # рестарт без простою
echo "✅ deployed $(date)"
EOF
chmod +x ~/app/redeploy.sh
```

Далі кожне оновлення — просто `~/app/redeploy.sh`.

---

## 11. Логи і діагностика

```bash
pm2 status                       # стан процесу
pm2 logs ecosoft                 # логи застосунку (тут видно помилки Telegram)
pm2 monit                        # CPU / RAM у реальному часі
sudo tail -f /var/log/nginx/error.log
sudo journalctl -u nginx -n 50
```

| Симптом | Причина / рішення |
|---------|-------------------|
| `502 Bad Gateway` | Впав Next / не той порт. `pm2 status`, `curl -I http://127.0.0.1:3000`, `pm2 restart ecosoft`. |
| Заявки не йдуть у TG | Невірний `TELEGRAM_CHAT_ID`; бота не додано в групу; для особистого чату не написали боту першими. Дивись `pm2 logs`. |
| `certbot` не видає сертифікат | DNS ще не поширився або Cloudflare-проксі увімкнено. `dig +short ...`, вимкнути проксі. |
| Змінили `.env.local` — не діє | `pm2 restart ecosoft` (env читається при старті). |
| `npm run build` вбило по RAM | Додати swap (крок 3). |
| Порт 3000 зайнятий | `sudo lsof -i :3000`; змінити порт у `ecosystem.config.js` і в Nginx `proxy_pass`. |

---

## 12. Нотатки

- **GTM `GTM-NGD37LTG`** уже вшитий у сайт — на проді події `view_item`,
  `add_to_cart`, `begin_checkout`, `purchase` підуть у dataLayer автоматично.
- **Курс НБУ** зашитий у ціни разово (44.8833 ₴/$ на 15.07.2026). Регулярний
  перерахунок — окрема задача (крон + перезбірка).
- Заявки **не зберігаються** в БД — лише йдуть у Telegram. Потрібен журнал
  замовлень (Google-таблиця / БД) — наступний крок.
- **Резервне копіювання:** критичний файл лише один — `~/app/.env.local`.
  Код відновлюється з Git.
