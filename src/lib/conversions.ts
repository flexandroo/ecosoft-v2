import "server-only";
import crypto from "node:crypto";
import { SITE_URL } from "@/lib/site";

// Server-side conversions (Meta Conversions API + GA4 Measurement Protocol).
// Ported 1:1 from ecosoftcrm/src/analytics.mjs so that campaigns keep receiving
// the same Lead / Purchase events, with the same event ids and hashed user data,
// after the admin panel replaces the external CRM.
//
// Disabled unless META_CAPI_ACCESS_TOKEN (and/or GA4_API_SECRET) are set.

export type ConversionKind = "lead" | "purchase";

/** Lead row fields the conversion payloads need (subset of public.leads). */
export type ConversionLead = {
  id: string;
  external_id: string;
  phone: string;
  email: string | null;
  customer_name: string;
  items: Array<{ sku?: string; name: string; quantity: number; price: number }>;
  total: number | string;
  currency: string;
  lead_event_id: string | null;
  landing_page: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  source: string;
  fbp: string | null;
  fbc: string | null;
  ga_client_id: string | null;
  client_ip: string | null;
  user_agent: string | null;
  created_at: string;
  completed_at: string | null;
};

export type ConversionResult = {
  state: "sent" | "failed" | "unconfigured";
  error: string | null;
  at: string;
};

const META_PIXEL_ID = process.env.META_PIXEL_ID || "2319473598859580";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function unixSeconds(value: string | null): number {
  const timestamp = Date.parse(value || "");
  return Number.isFinite(timestamp) ? Math.floor(timestamp / 1000) : Math.floor(Date.now() / 1000);
}

/** Stable per-customer id, as the CRM used: hash of the normalised phone. */
function customerId(lead: ConversionLead): string {
  return lead.phone.replace(/\D/g, "") || lead.id;
}

function stableClientId(lead: ConversionLead): string {
  if (lead.ga_client_id) return lead.ga_client_id;
  const digest = crypto.createHash("sha256").update(customerId(lead)).digest();
  return `${digest.readUInt32BE(0)}.${digest.readUInt32BE(4)}`;
}

function metaUserData(lead: ConversionLead): Record<string, unknown> {
  const userData: Record<string, unknown> = {};
  const phone = lead.phone.replace(/\D/g, "");
  const email = (lead.email || "").trim().toLowerCase();
  const nameParts = lead.customer_name.trim().toLowerCase().replace(/\s+/g, " ").split(" ").filter(Boolean);
  if (phone) userData.ph = [sha256(phone)];
  if (email) userData.em = [sha256(email)];
  if (nameParts[0]) userData.fn = [sha256(nameParts[0])];
  if (nameParts.length > 1) userData.ln = [sha256(nameParts[nameParts.length - 1])];
  if (lead.fbp) userData.fbp = lead.fbp;
  if (lead.fbc) userData.fbc = lead.fbc;
  if (lead.client_ip) userData.client_ip_address = lead.client_ip;
  if (lead.user_agent) userData.client_user_agent = lead.user_agent;
  userData.external_id = [sha256(customerId(lead))];
  return userData;
}

async function sendMeta(lead: ConversionLead, kind: ConversionKind): Promise<"sent" | "unconfigured"> {
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  if (!accessToken) return "unconfigured";

  const contents = lead.items.map((item) => ({
    id: item.sku || item.name,
    quantity: Math.max(1, Number(item.quantity) || 1),
    item_price: Number(item.price) || 0,
  }));
  const customData: Record<string, unknown> = {
    currency: lead.currency || "UAH",
    value: Number(lead.total) || 0,
    content_type: "product",
  };
  if (contents.length) {
    customData.contents = contents;
    customData.content_ids = contents.map((item) => item.id);
    customData.num_items = contents.reduce((sum, item) => sum + item.quantity, 0);
  }

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: kind === "purchase" ? "Purchase" : "Lead",
        event_time: unixSeconds(kind === "purchase" ? lead.completed_at : lead.created_at),
        event_id: kind === "purchase" ? `purchase-${lead.id}` : lead.lead_event_id || `lead-${lead.id}`,
        action_source: "website",
        event_source_url: lead.landing_page || `${SITE_URL}/`,
        user_data: metaUserData(lead),
        custom_data: customData,
      },
    ],
  };
  if (process.env.META_TEST_EVENT_CODE) body.test_event_code = process.env.META_TEST_EVENT_CODE;

  const version = process.env.META_GRAPH_API_VERSION || "v23.0";
  const endpoint = new URL(`https://graph.facebook.com/${version}/${META_PIXEL_ID}/events`);
  endpoint.searchParams.set("access_token", accessToken);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Meta CAPI ${response.status}: ${detail.slice(0, 400)}`);
  }
  return "sent";
}

async function sendGa4(lead: ConversionLead, kind: ConversionKind): Promise<"sent" | "unconfigured"> {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;
  if (!measurementId || !apiSecret) return "unconfigured";

  const items = lead.items.map((item) => ({
    item_id: item.sku || item.name,
    item_name: item.name,
    price: Number(item.price) || 0,
    quantity: Math.max(1, Number(item.quantity) || 1),
  }));
  const params: Record<string, unknown> = {
    currency: lead.currency || "UAH",
    value: Number(lead.total) || 0,
    engagement_time_msec: 1,
    source: lead.utm_source || lead.source || "website",
    medium: lead.utm_medium || "website",
  };
  if (items.length) params.items = items;
  if (kind === "purchase") params.transaction_id = lead.external_id;
  else params.lead_id = lead.external_id;

  const endpoint = new URL("https://www.google-analytics.com/mp/collect");
  endpoint.searchParams.set("measurement_id", measurementId);
  endpoint.searchParams.set("api_secret", apiSecret);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: stableClientId(lead),
      user_id: customerId(lead),
      timestamp_micros: String(
        unixSeconds(kind === "purchase" ? lead.completed_at : lead.created_at) * 1_000_000,
      ),
      events: [{ name: kind === "purchase" ? "purchase" : "generate_lead", params }],
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`GA4 MP ${response.status}: ${detail.slice(0, 400)}`);
  }
  return "sent";
}

export async function dispatchConversion(
  lead: ConversionLead,
  kind: ConversionKind,
): Promise<ConversionResult> {
  const results = await Promise.allSettled([sendMeta(lead, kind), sendGa4(lead, kind)]);
  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => (r.reason instanceof Error ? r.reason.message : String(r.reason)));
  const anyConfigured =
    errors.length > 0 ||
    results.some((r) => r.status === "fulfilled" && r.value !== "unconfigured");
  const at = new Date().toISOString();
  if (errors.length) return { state: "failed", error: errors.join(" | "), at };
  return { state: anyConfigured ? "sent" : "unconfigured", error: null, at };
}
