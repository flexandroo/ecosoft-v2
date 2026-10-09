-- Telegram manager bot: leads are posted to a forum group, one topic per kind
-- (orders / callbacks / contact messages), with status buttons that stay in
-- sync with the admin.
--
-- * telegram_text      — the notification body, so the bot can re-render the
--                        message with a new status header.
-- * telegram_messages  — [{chat_id, message_id}] posted for this lead.
-- * status_by          — display name of whoever last changed the status
--                        (a manager in Telegram or a staff member in the admin).
--
-- The group itself (chat id + topic ids) lives in site_settings under the
-- private key 'telegram_group'; the one-time pairing code under 'telegram_setup'.

alter table public.leads
  add column telegram_text text,
  add column telegram_messages jsonb not null default '[]'::jsonb,
  add column status_by text;
