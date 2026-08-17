"use client";

export type MarketingAttribution = {
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

const STORAGE_KEY = "sofiivka_marketing_attribution_v1";

function cookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const prefix = `${name}=`;
  const item = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : undefined;
}
function gaClientId(): string | undefined {
  const value = cookie("_ga");
  if (!value) return undefined;
  const parts = value.split(".");
  return parts.length >= 4 ? parts.slice(-2).join(".") : value;
}

function readStored(): MarketingAttribution {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") as MarketingAttribution;
  } catch {
    return {};
  }
}

export function captureMarketingAttribution(): MarketingAttribution {
  if (typeof window === "undefined") return {};
  const stored = readStored();
  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get("fbclid") || stored.fbclid;
  const current: MarketingAttribution = {
    landingPage: stored.landingPage || window.location.href,
    referrer: stored.referrer || document.referrer || undefined,
    utmSource: params.get("utm_source") || stored.utmSource,
    utmMedium: params.get("utm_medium") || stored.utmMedium,
    utmCampaign: params.get("utm_campaign") || stored.utmCampaign,
    utmContent: params.get("utm_content") || stored.utmContent,
    utmTerm: params.get("utm_term") || stored.utmTerm,
    fbclid,
    fbp: cookie("_fbp") || stored.fbp,
    fbc: cookie("_fbc") || stored.fbc || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined),
    gclid: params.get("gclid") || stored.gclid,
    gaClientId: gaClientId() || stored.gaClientId,
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Attribution is useful but must never block an order.
  }
  return current;
}

export function getMarketingAttribution(): MarketingAttribution {
  return captureMarketingAttribution();
}

export function createLeadIdentity(prefix = "LEAD") {
  const random = globalThis.crypto?.randomUUID?.().slice(0, 8).toUpperCase()
    ?? Math.random().toString(36).slice(2, 10).toUpperCase();
  const externalId = `${prefix}-${Date.now()}-${random}`;
  return { externalId, eventId: `lead-${externalId}` };
}
