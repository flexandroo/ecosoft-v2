import { NextResponse } from "next/server";
import { escapeHtml, sendTelegramMessage, telegramConfigured } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CallbackBody = {
  name?: unknown;
  phone?: unknown;
  // Where on the site the request came from (e.g. "header", "product:MO550...").
  source?: unknown;
  // Honeypot.
  company?: unknown;
};

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: Request) {
  let body: CallbackBody;
  try {
    body = (await req.json()) as CallbackBody;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  if (str(body.company)) {
    return NextResponse.json({ ok: true });
  }

  const name = str(body.name);
  const phone = str(body.phone);
  const source = str(body.source);

  // Callback only needs a valid phone; name is optional.
  if (phone.replace(/\D/g, "").length < 9) {
    return NextResponse.json({ ok: false, error: "invalid_phone" }, { status: 422 });
  }

  const text =
    `📞 <b>Замовлення безкоштовного дзвінка</b>\n\n` +
    (name ? `👤 ${escapeHtml(name)}\n` : "") +
    `📞 ${escapeHtml(phone)}` +
    (source ? `\n\n🔗 <i>${escapeHtml(source)}</i>` : "");

  try {
    if (!telegramConfigured()) {
      console.error("[callback] Telegram not configured. Request:\n", text);
      return NextResponse.json({ ok: false, error: "not_configured" }, { status: 500 });
    }
    await sendTelegramMessage(text);
  } catch (err) {
    console.error("[callback] failed to notify:", err);
    return NextResponse.json({ ok: false, error: "notify_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
