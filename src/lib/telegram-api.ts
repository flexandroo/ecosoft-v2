// Minimal Telegram Bot API client shared by the managers' bot and the
// customer bot. Server only. TELEGRAM_API_BASE can point local tests at a mock.
import "server-only";

const API_BASE = (process.env.TELEGRAM_API_BASE || "https://api.telegram.org").replace(/\/+$/, "");

export class TelegramError extends Error {
  constructor(
    readonly method: string,
    readonly code: number,
    readonly description: string,
  ) {
    super(`Telegram ${method}: ${code} ${description}`);
  }
  /** The user blocked the bot or deleted their account. */
  get blocked(): boolean {
    return this.code === 403;
  }
}

export async function callTelegram<T = unknown>(token: string | undefined, method: string, body: Record<string, unknown>): Promise<T> {
  if (!token) throw new TelegramError(method, 0, "bot token is not set");
  const res = await fetch(`${API_BASE}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await res.json().catch(() => null)) as
    | { ok: boolean; result?: T; description?: string; error_code?: number }
    | null;
  if (!data?.ok) throw new TelegramError(method, data?.error_code ?? res.status, data?.description ?? "request failed");
  return data.result as T;
}
