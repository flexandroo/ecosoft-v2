// Server-only helper for sending notifications to a Telegram chat via a bot.
// Configure with env vars TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.
// Never import this from a Client Component — it must stay server-side so the
// bot token is never shipped to the browser.
import "server-only";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export function telegramConfigured(): boolean {
  return Boolean(TOKEN && CHAT_ID);
}

/** Escape user text for Telegram HTML parse mode. */
export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Send an HTML-formatted message to the configured chat.
 * Throws if the bot is not configured or the Telegram API returns an error.
 */
export async function sendTelegramMessage(html: string): Promise<void> {
  if (!TOKEN || !CHAT_ID) {
    throw new Error("Telegram is not configured (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)");
  }

  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: html,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
    // Fail fast rather than hanging the request if Telegram is unreachable.
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Telegram API ${res.status}: ${detail.slice(0, 300)}`);
  }
}
