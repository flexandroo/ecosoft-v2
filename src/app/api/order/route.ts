import { NextResponse } from "next/server";
import { formatUah } from "@/lib/format";
import { PRODUCTS } from "@/lib/products";
import {
  checkRateLimit,
  cleanText,
  isValidUkrainianPhone,
  requestBodyTooLarge,
} from "@/lib/request-guard";
import { escapeHtml, sendTelegramMessage, telegramConfigured } from "@/lib/telegram";
import {
  requestClientContext,
  sendCrmIntake,
  type CrmAttribution,
} from "@/lib/crm";

// Order submissions must run on the Node.js runtime and never be cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrderItem = {
  sku?: unknown;
  qty?: unknown;
};

type OrderBody = {
  externalId?: unknown;
  eventId?: unknown;
  attribution?: CrmAttribution;
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

export async function POST(req: Request) {
  const rate = checkRateLimit(req, "order", 6, 15 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
    );
  }
  if (requestBodyTooLarge(req)) {
    return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 });
  }

  let body: OrderBody;
  try {
    body = (await req.json()) as OrderBody;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  // Spam trap — pretend success so bots don't retry.
  if (cleanText(body.company, 100)) {
    return NextResponse.json({ ok: true, orderId: "ECO-SPAM" });
  }

  const name = cleanText(body.customer?.name, 100);
  const phone = cleanText(body.customer?.phone, 32);
  const address = cleanText(body.customer?.address, 300);
  const comment = cleanText(body.customer?.comment, 1_000);
  const items = Array.isArray(body.items) ? (body.items as OrderItem[]) : [];

  if (name.length < 2 || !isValidUkrainianPhone(phone)) {
    return NextResponse.json({ ok: false, error: "invalid_contact" }, { status: 422 });
  }
  if (items.length === 0 || items.length > 50) {
    return NextResponse.json({ ok: false, error: "empty_cart" }, { status: 422 });
  }

  // Resolve every line from the server catalogue. Names, prices and stock state
  // supplied by the browser are intentionally ignored.
  let total = 0;
  const lines = [];
  for (const item of items) {
    const sku = cleanText(item.sku, 100);
    const product = PRODUCTS.find((candidate) => candidate.sku === sku);
    const qty = Math.floor(Number(item.qty));
    if (!product || !product.inStock || !Number.isInteger(qty) || qty < 1 || qty > 20) {
      return NextResponse.json({ ok: false, error: "invalid_items" }, { status: 422 });
    }
    total += qty * product.price;
    lines.push({ name: product.name, sku, qty, price: product.price });
  }

  const requestedId = cleanText(body.externalId, 100);
  const orderId = /^ECO-[A-Z0-9-]{8,}$/i.test(requestedId)
    ? requestedId
    : `ECO-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const eventId = cleanText(body.eventId, 120) || `lead-${orderId}`;

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

  const crmResult = await sendCrmIntake({
    externalId: orderId,
    eventId,
    type: "order",
    customer: { name, phone, address },
    items: lines.map((line) => ({
      sku: line.sku,
      name: line.name,
      quantity: line.qty,
      price: line.price,
    })),
    total,
    currency: "UAH",
    paymentMethod: "none",
    paymentStatus: "unpaid",
    deliveryAddress: address,
    comment,
    source: "sofiivkawater.com",
    sourceDetail: "cart",
    attribution: body.attribution,
    ...requestClientContext(req),
  });

  try {
    if (!telegramConfigured()) {
      // Don't lose the order silently in dev / misconfig — log it server-side.
      console.error("[order] Telegram not configured. Order:\n", message);
      if (!crmResult.ok) {
        return NextResponse.json({ ok: false, error: "not_configured" }, { status: 500 });
      }
    } else {
      await sendTelegramMessage(message);
    }
  } catch (err) {
    console.error("[order] failed to notify:", err);
    if (!crmResult.ok) {
      return NextResponse.json({ ok: false, error: "notify_failed" }, { status: 502 });
    }
  }

  if (crmResult.configured && !crmResult.ok) {
    console.error("[order] CRM intake failed:", crmResult.error);
    return NextResponse.json({ ok: false, error: "crm_failed" }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    orderId: crmResult.ok ? crmResult.dealId : orderId,
    total,
    crmSynced: crmResult.ok,
  });
}
