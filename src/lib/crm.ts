import "server-only";

export type CrmAttribution = {
  landingPage?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  fbclid?: string;
  fbp?: string;
  fbc?: string;
  gclid?: string;
  gaClientId?: string;
};

export type CrmIntake = {
  externalId: string;
  eventId?: string;
  type: "order" | "callback" | "contact";
  customer: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
  };
  items?: Array<{
    sku?: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total?: number;
  currency?: "UAH";
  paymentMethod?: "cod" | "bank_transfer" | "cash" | "none";
  paymentStatus?: "unpaid" | "paid" | "not_required";
  deliveryAddress?: string;
  comment?: string;
  message?: string;
  source?: string;
  sourceDetail?: string;
  attribution?: CrmAttribution;
  clientIp?: string;
  userAgent?: string;
};

export type CrmResult =
  | { configured: false; ok: false; error: "not_configured" }
  | { configured: true; ok: true; dealId: string; duplicate: boolean }
  | { configured: true; ok: false; error: string };

export function crmConfigured(): boolean {
  return Boolean(process.env.CRM_API_URL && process.env.CRM_INTAKE_TOKEN);
}
export async function sendCrmIntake(payload: CrmIntake): Promise<CrmResult> {
  const baseUrl = process.env.CRM_API_URL?.replace(/\/+$/, "");
  const token = process.env.CRM_INTAKE_TOKEN;
  if (!baseUrl || !token) return { configured: false, ok: false, error: "not_configured" };

  try {
    const response = await fetch(`${baseUrl}/api/v1/intake`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      dealId?: string;
      duplicate?: boolean;
      error?: string;
    };
    if (!response.ok || !data.ok || !data.dealId) {
      return { configured: true, ok: false, error: data.error || `http_${response.status}` };
    }
    return {
      configured: true,
      ok: true,
      dealId: data.dealId,
      duplicate: Boolean(data.duplicate),
    };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      error: error instanceof Error ? error.message : "crm_unreachable",
    };
  }
}

export function requestClientContext(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    clientIp: forwarded || req.headers.get("x-real-ip") || undefined,
    userAgent: req.headers.get("user-agent") || undefined,
  };
}
