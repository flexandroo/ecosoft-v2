import { NextResponse } from "next/server";
import {
  checkRateLimit,
  cleanText,
  isValidEmail,
  isValidUkrainianPhone,
  requestBodyTooLarge,
} from "@/lib/request-guard";
import { escapeHtml, sendTelegramMessage, telegramConfigured } from "@/lib/telegram";
import { requestClientContext, sendCrmIntake, type CrmAttribution } from "@/lib/crm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ContactBody = {
  externalId?: unknown;
  eventId?: unknown;
  attribution?: CrmAttribution;
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  message?: unknown;
  // Honeypot.
  company?: unknown;
};

export async function POST(req: Request) {
  const rate = checkRateLimit(req, "contact", 5, 15 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
    );
  }
  if (requestBodyTooLarge(req)) {
    return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 });
  }

  let body: ContactBody;
  try {
    body = (await req.json()) as ContactBody;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  if (cleanText(body.company, 100)) {
    return NextResponse.json({ ok: true });
  }

  const name = cleanText(body.name, 100);
  const phone = cleanText(body.phone, 32);
  const email = cleanText(body.email, 254);
  const message = cleanText(body.message, 2_000);

  if (
    name.length < 2 ||
    !isValidUkrainianPhone(phone) ||
    !isValidEmail(email) ||
    message.length < 3
  ) {
    return NextResponse.json({ ok: false, error: "invalid_contact" }, { status: 422 });
  }

  const text =
    `✉️ <b>Нова заявка з сайту</b>\n\n` +
    `👤 <b>${escapeHtml(name)}</b>\n` +
    `📞 ${escapeHtml(phone)}\n` +
    (email ? `📧 ${escapeHtml(email)}\n` : "") +
    (message ? `\n💬 ${escapeHtml(message)}` : "");

  const requestedId = cleanText(body.externalId, 100);
  const leadId = /^LEAD-[A-Z0-9-]{8,}$/i.test(requestedId)
    ? requestedId
    : `LEAD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const crmResult = await sendCrmIntake({
    externalId: leadId,
    eventId: cleanText(body.eventId, 120) || `lead-${leadId}`,
    type: "contact",
    customer: { name, phone, email },
    message,
    source: "sofiivkawater.com",
    sourceDetail: "contact_form",
    paymentMethod: "none",
    paymentStatus: "not_required",
    attribution: body.attribution,
    ...requestClientContext(req),
  });

  try {
    if (!telegramConfigured()) {
      console.error("[contact] Telegram not configured. Message:\n", text);
      if (!crmResult.ok) {
        return NextResponse.json({ ok: false, error: "not_configured" }, { status: 500 });
      }
    } else {
      await sendTelegramMessage(text);
    }
  } catch (err) {
    console.error("[contact] failed to notify:", err);
    if (!crmResult.ok) {
      return NextResponse.json({ ok: false, error: "notify_failed" }, { status: 502 });
    }
  }

  if (crmResult.configured && !crmResult.ok) {
    console.error("[contact] CRM intake failed:", crmResult.error);
    return NextResponse.json({ ok: false, error: "crm_failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, leadId, crmSynced: crmResult.ok });
}
