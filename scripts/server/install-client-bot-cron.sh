#!/usr/bin/env bash
# Installs the daily customer-bot reminder run on the prod VPS (run as root):
#   ssh -i ~/.ssh/sofiivka_deploy -p 3333 root@195.28.182.181 'bash -s' < scripts/server/install-client-bot-cron.sh
# Every day at 10:00 Kyiv time it POSTs /api/client-bot/cron with the secret
# from /home/deploy/shared/.env.local. Safe to run again.
set -Eeuo pipefail

cat > /usr/local/sbin/ecosoft-client-bot-cron <<'EOF'
#!/usr/bin/env bash
# Daily customer-bot reminders (see /api/client-bot/cron).
set -Eeuo pipefail
SECRET=$(grep -E '^TELEGRAM_CLIENT_BOT_SECRET=' /home/deploy/shared/.env.local | tail -1 | cut -d= -f2- | tr -d "\"'\r")
curl -fsS --max-time 290 -X POST http://127.0.0.1:3000/api/client-bot/cron -H "x-cron-secret: $SECRET"
echo
EOF
chmod 750 /usr/local/sbin/ecosoft-client-bot-cron

cat > /etc/systemd/system/ecosoft-client-bot-cron.service <<'EOF'
[Unit]
Description=Sofiivka Water client bot: daily filter reminders
After=ecosoft-web.service

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/ecosoft-client-bot-cron
EOF

cat > /etc/systemd/system/ecosoft-client-bot-cron.timer <<'EOF'
[Unit]
Description=Daily client bot reminders at 10:00 Kyiv time

[Timer]
OnCalendar=*-*-* 10:00:00 Europe/Kyiv
Persistent=true

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now ecosoft-client-bot-cron.timer
systemctl list-timers ecosoft-client-bot-cron.timer --no-pager | head -2
