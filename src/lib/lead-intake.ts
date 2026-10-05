import "server-only";
import { after } from "next/server";
import { crmConfigured, sendCrmIntake, type CrmIntake } from "@/lib/crm";
import { dispatchConversion, type ConversionLead } from "@/lib/conversions";
import { createServiceClient } from "@/lib/supabase/server";
import { sendTelegramMessage, telegramConfigured } from "@/lib/telegram";

export type LeadDelivery = {
  ok: boolean;
  /** Public reference shown to the customer and used as the pixel event id. */
  reference: string;
  error?: string;
  crmSynced: boolean;
};

const LEAD_COLUMNS =
  "id, external_id, number, phone, email, customer_name, items, total, currency, lead_event_id, " +
  "landing_page, utm_source, utm_medium, source, fbp, fbc, ga_client_id, client_ip, user_agent, " +
  "created_at, completed_at";

type SavedLead = ConversionLead & { number: number };

function intakeToRow(intake: CrmIntake) {
  const a = intake.attribution ?? {};
  const text = (value: string | undefined, max = 500) => (value ? String(value).slice(0, max) : null);
  return {
    external_id: intake.externalId,
    kind: intake.type,
    customer_name: intake.customer.name,
    phone: intake.customer.phone,
    email: intake.customer.email || null,
    address: intake.deliveryAddress || intake.customer.address || null,
    comment: intake.comment || null,
    message: intake.message || null,
    items: intake.items ?? [],
    total: intake.total ?? 0,
    currency: intake.currency ?? "UAH",
    payment_method: intake.paymentMethod ?? "none",
    payment_status: intake.paymentStatus ?? "unpaid",
    source: intake.source ?? "sofiivkawater.com",
    source_detail: intake.sourceDetail ?? null,
    lead_event_id: intake.eventId ?? null,
    landing_page: text(a.landingPage, 1000),
    referrer: text(a.referrer, 1000),
    utm_source: text(a.utmSource),
    utm_medium: text(a.utmMedium),
    utm_campaign: text(a.utmCampaign),
    utm_content: text(a.utmContent),
    utm_term: text(a.utmTerm),
    fbclid: text(a.fbclid),
    fbp: text(a.fbp),
    fbc: text(a.fbc),
    gclid: text(a.gclid),
    ga_client_id: text(a.gaClientId),
    client_ip: intake.clientIp ?? null,
    user_agent: text(intake.userAgent, 500),
  };
}

/** Insert the lead; a repeated submit with the same external id returns the existing row. */
async function saveLead(intake: CrmIntake): Promise<{ lead: SavedLead; duplicate: boolean } | null> {
  const db = createServiceClient();
  if (!db) return null;
  const { data, error } = await db
    .from("leads")
    .insert(intakeToRow(intake))
    .select(LEAD_COLUMNS)
    .single<SavedLead>();
  if (!error && data) {
    await db.from("lead_events").insert({ lead_id: data.id, type: "created", data: { source: intake.sourceDetail } });
    return { lead: data, duplicate: false };
  }
  if (error?.code === "23505") {
    const existing = await db
      .from("leads")
      .select(LEAD_COLUMNS)
      .eq("external_id", intake.externalId)
      .single<SavedLead>();
    if (existing.data) return { lead: existing.data, duplicate: true };
  }
  throw new Error(error?.message || "lead_insert_failed");
}

async function recordLeadConversion(lead: SavedLead) {
  const result = await dispatchConversion(lead, "lead");
  if (result.state === "unconfigured") return;
  if (result.state === "failed") console.error("[lead] conversion failed:", result.error);
  const db = createServiceClient();
  await db?.from("leads").update({ tracking: { lead: result } }).eq("id", lead.id);
}

/**
 * Deliver a website lead to every configured destination:
 *   1. the admin database (Supabase),
 *   2. the legacy external CRM (until it is switched off),
 *   3. Telegram.
 * The request succeeds when the lead was durably captured by at least one of them.
 */
export async function deliverLead(intake: CrmIntake, telegramText: string, label: string): Promise<LeadDelivery> {
  let saved: Awaited<ReturnType<typeof saveLead>> = null;
  try {
    saved = await saveLead(intake);
  } catch (error) {
    console.error(`[${label}] database save failed:`, error);
  }

  const crmResult = await sendCrmIntake(intake);
  if (crmResult.configured && !crmResult.ok) {
    console.error(`[${label}] CRM intake failed:`, crmResult.error);
  }

  const reference = crmResult.ok ? crmResult.dealId : intake.externalId;
  if (saved?.duplicate) {
    return { ok: true, reference, crmSynced: crmResult.ok };
  }

  let telegramSent = false;
  try {
    if (telegramConfigured()) {
      const adminRef = saved ? `\n\n🗂 Заявка №${saved.lead.number} в адмінці` : "";
      await sendTelegramMessage(telegramText + adminRef);
      telegramSent = true;
    } else {
      console.error(`[${label}] Telegram not configured. Lead:\n`, telegramText);
    }
  } catch (error) {
    console.error(`[${label}] failed to notify Telegram:`, error);
  }

  if (saved) {
    const lead = saved.lead;
    after(async () => {
      if (telegramSent) {
        await createServiceClient()?.from("leads").update({ telegram_sent: true }).eq("id", lead.id);
      }
      // While the legacy CRM is connected it sends the server-side conversions;
      // the admin takes over only once CRM_API_URL is removed.
      if (!crmConfigured()) await recordLeadConversion(lead);
    });
  }

  const captured = Boolean(saved) || crmResult.ok || telegramSent;
  // Preserve the previous contract: a configured CRM that fails is an error
  // unless the lead was stored in the admin database.
  if (!captured || (crmResult.configured && !crmResult.ok && !saved)) {
    return { ok: false, reference, error: captured ? "crm_failed" : "not_delivered", crmSynced: false };
  }
  return { ok: true, reference, crmSynced: crmResult.ok };
}
