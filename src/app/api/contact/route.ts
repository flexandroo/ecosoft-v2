import { NextResponse } from "next/server";
import { escapeHtml, sendTelegramMessage, telegramConfigured } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ContactBody = {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  message?: unknown;
  // Honeypot.
  company?: unknown;
};

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: Request) {
  let body: ContactBody;
  try {
    body = (await req.json()) as ContactBody;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  if (str(body.company)) {
    return NextResponse.json({ ok: true });
  }

  const name = str(body.name);
  const phone = str(body.phone);
  const email = str(body.email);
  const message = str(body.message);

  if (name.length < 2 || phone.replace(/\D/g, "").length < 9) {
    return NextResponse.json({ ok: false, error: "invalid_contact" }, { status: 422 });
  }

  const text =
    `✉️ <b>Нова заявка з сайту</b>\n\n` +
    `👤 <b>${escapeHtml(name)}</b>\n` +
    `📞 ${escapeHtml(phone)}\n` +
    (email ? `📧 ${escapeHtml(email)}\n` : "") +
    (message ? `\n💬 ${escapeHtml(message)}` : "");

  try {
    if (!telegramConfigured()) {
      console.error("[contact] Telegram not configured. Message:\n", text);
      return NextResponse.json({ ok: false, error: "not_configured" }, { status: 500 });
    }
    await sendTelegramMessage(text);
  } catch (err) {
    console.error("[contact] failed to notify:", err);
    return NextResponse.json({ ok: false, error: "notify_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
