import { NextResponse } from "next/server";
import { formatUah } from "@/lib/format";
import { escapeHtml, sendTelegramMessage, telegramConfigured } from "@/lib/telegram";

// Order submissions must run on the Node.js runtime and never be cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrderItem = {
  name?: unknown;
  sku?: unknown;
  qty?: unknown;
  price?: unknown;
};

type OrderBody = {
  customer?: {
    name?: unknown;
    phone?: unknown;
    address?: unknown;
    comment?: unknown;
  };
  items?: unknown;
  // Honeypot: real users never fill this hidden field.
  company?: unknown;
};

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: Request) {
  let body: OrderBody;
  try {
    body = (await req.json()) as OrderBody;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  // Spam trap — pretend success so bots don't retry.
  if (str(body.company)) {
    return NextResponse.json({ ok: true, orderId: "ECO-SPAM" });
  }

  const name = str(body.customer?.name);
  const phone = str(body.customer?.phone);
  const address = str(body.customer?.address);
  const comment = str(body.customer?.comment);
  const items = Array.isArray(body.items) ? (body.items as OrderItem[]) : [];

  if (name.length < 2 || phone.replace(/\D/g, "").length < 9) {
    return NextResponse.json({ ok: false, error: "invalid_contact" }, { status: 422 });
  }
  if (items.length === 0) {
    return NextResponse.json({ ok: false, error: "empty_cart" }, { status: 422 });
  }

  // Recompute the total server-side from the submitted lines (don't trust a
  // client-sent total). The manager confirms exact pricing by phone anyway.
  let total = 0;
  const lines = items.map((it) => {
    const qty = Math.max(1, Math.floor(Number(it.qty)) || 1);
    const price = Math.max(0, Number(it.price) || 0);
    total += qty * price;
    return { name: str(it.name) || "—", sku: str(it.sku), qty, price };
  });

  const orderId = `ECO-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const itemLines = lines
    .map(
      (l, i) =>
        `${i + 1}. ${escapeHtml(l.name)}${l.sku ? ` <code>${escapeHtml(l.sku)}</code>` : ""} — ` +
        `${l.qty} × ${formatUah(l.price)} = <b>${formatUah(l.qty * l.price)}</b>`,
    )
    .join("\n");

  const message =
    `🛒 <b>Нове замовлення</b> <code>${orderId}</code>\n\n` +
    `👤 <b>${escapeHtml(name)}</b>\n` +
    `📞 ${escapeHtml(phone)}\n` +
    (address ? `📍 ${escapeHtml(address)}\n` : "") +
    (comment ? `💬 ${escapeHtml(comment)}\n` : "") +
    `\n<b>Товари:</b>\n${itemLines}\n\n` +
    `💰 <b>Разом: ${formatUah(total)}</b>`;

  try {
    if (!telegramConfigured()) {
      // Don't lose the order silently in dev / misconfig — log it server-side.
      console.error("[order] Telegram not configured. Order:\n", message);
      return NextResponse.json({ ok: false, error: "not_configured" }, { status: 500 });
    }
    await sendTelegramMessage(message);
  } catch (err) {
    console.error("[order] failed to notify:", err);
    return NextResponse.json({ ok: false, error: "notify_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, orderId, total });
}
