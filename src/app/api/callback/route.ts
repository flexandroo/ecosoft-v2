import { NextResponse } from "next/server";
import {
  checkRateLimit,
  cleanText,
  isValidUkrainianPhone,
  requestBodyTooLarge,
} from "@/lib/request-guard";
import { escapeHtml } from "@/lib/telegram";
import { deliverLead } from "@/lib/lead-intake";
import { requestClientContext, type CrmAttribution } from "@/lib/crm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CallbackBody = {
  externalId?: unknown;
  eventId?: unknown;
  attribution?: CrmAttribution;
  name?: unknown;
  phone?: unknown;
  // Where on the site the request came from (e.g. "header", "product:MO550...").
  source?: unknown;
  // Honeypot.
  company?: unknown;
};

export async function POST(req: Request) {
  const rate = checkRateLimit(req, "callback", 5, 15 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
    );
  }
  if (requestBodyTooLarge(req, 8_192)) {
    return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 });
  }

  let body: CallbackBody;
  try {
    body = (await req.json()) as CallbackBody;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  if (cleanText(body.company, 100)) {
    return NextResponse.json({ ok: true });
  }

  const name = cleanText(body.name, 100);
  const phone = cleanText(body.phone, 32);
  const source = cleanText(body.source, 200);

  // Callback only needs a valid phone; name is optional.
  if (!isValidUkrainianPhone(phone)) {
    return NextResponse.json({ ok: false, error: "invalid_phone" }, { status: 422 });
  }

  const text =
    `📞 <b>Замовлення безкоштовного дзвінка</b>\n\n` +
    (name ? `👤 ${escapeHtml(name)}\n` : "") +
    `📞 ${escapeHtml(phone)}` +
    (source ? `\n\n🔗 <i>${escapeHtml(source)}</i>` : "");

  const requestedId = cleanText(body.externalId, 100);
  const leadId = /^CALL-[A-Z0-9-]{8,}$/i.test(requestedId)
    ? requestedId
    : `CALL-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const delivery = await deliverLead(
    {
      externalId: leadId,
      eventId: cleanText(body.eventId, 120) || `lead-${leadId}`,
      type: "callback",
      customer: { name: name || "Без імені", phone },
      source: "sofiivkawater.com",
      sourceDetail: source || "callback",
      paymentMethod: "none",
      paymentStatus: "not_required",
      attribution: body.attribution,
      ...requestClientContext(req),
    },
    text,
    "callback",
  );

  if (!delivery.ok) {
    return NextResponse.json({ ok: false, error: delivery.error }, { status: 502 });
  }
  return NextResponse.json({ ok: true, leadId, crmSynced: delivery.crmSynced });
}
