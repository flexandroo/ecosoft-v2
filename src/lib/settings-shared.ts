// Public site settings: types, defaults and formatting helpers. Safe to import
// from client components. Defaults are the values the site used before the
// admin existed, so an empty or unreachable database changes nothing.

export type PhoneSetting = { number: string; label: string };
export type HoursRow = { days: string; time: string };

export type SiteSettings = {
  phones: PhoneSetting[];
  email: string;
  address: {
    full: string;
    short: string;
    street: string;
    locality: string;
    region: string;
    postalCode: string;
  };
  hours: HoursRow[];
  socials: { instagram: string; facebook: string; telegram: string; viber: string; youtube: string; tiktok: string };
  legal: { name: string; edrpou: string; iban: string; bank: string };
};

export const DEFAULT_SETTINGS: SiteSettings = {
  phones: [{ number: "+380504478676", label: "" }],
  email: "info@ecosoft.ua",
  address: {
    full: "08131, Київська обл., Бучанський р-н, с. Софіївська Борщагівка, вул. Київська, 3",
    short: "Софіївська Борщагівка, вул. Київська, 3",
    street: "вул. Київська, 3",
    locality: "Софіївська Борщагівка",
    region: "Київська область",
    postalCode: "08131",
  },
  hours: [
    { days: "Пн–Пт", time: "10:00–19:00" },
    { days: "Сб–Нд", time: "11:00–16:00" },
  ],
  socials: { instagram: "", facebook: "", telegram: "", viber: "", youtube: "", tiktok: "" },
  legal: {
    name: "ФОП Куцевич Павло Олександрович",
    edrpou: "3270315535",
    iban: "UA713052990000026009010108736",
    bank: "АТ КБ «ПРИВАТБАНК»",
  },
};

export const SOCIAL_LABELS: Record<keyof SiteSettings["socials"], string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  telegram: "Telegram",
  viber: "Viber",
  youtube: "YouTube",
  tiktok: "TikTok",
};

/** "+380 50 447 86 76"-style input → canonical "+380504478676". */
export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("380")) return `+${digits}`;
  if (digits.length === 10 && digits.startsWith("0")) return `+38${digits}`;
  return value.trim();
}

export function phoneHref(number: string): string {
  return `tel:${number.replace(/[^\d+]/g, "")}`;
}

export function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/** Working-day rows only (drops "вихідний"), e.g. "Пн–Пт: 10:00–19:00 · Сб–Нд: 11:00–16:00". */
export function formatOpenHours(hours: HoursRow[]): string {
  return hours
    .filter((h) => h.days && h.time && !/вихідн/i.test(h.time))
    .map((h) => `${h.days}: ${h.time}`)
    .join(" · ");
}

export function formatClosedDays(hours: HoursRow[]): string {
  return hours
    .filter((h) => h.days && /вихідн/i.test(h.time))
    .map((h) => `${h.days} — вихідний`)
    .join(", ");
}

/** Deep-merge stored values over defaults, ignoring empty strings and empty lists. */
export function mergeSettings(stored: Partial<Record<keyof SiteSettings, unknown>>): SiteSettings {
  const d = DEFAULT_SETTINGS;
  const obj = <T extends Record<string, string>>(def: T, value: unknown): T => {
    const out = { ...def };
    if (value && typeof value === "object") {
      for (const key of Object.keys(def) as (keyof T)[]) {
        const v = (value as Record<string, unknown>)[key as string];
        if (typeof v === "string" && (v.trim() || key in d.socials)) out[key] = v.trim() as T[keyof T];
      }
    }
    return out;
  };
  const phones = Array.isArray(stored.phones)
    ? (stored.phones as PhoneSetting[]).filter((p) => p && typeof p.number === "string" && p.number.trim())
    : [];
  const hours = Array.isArray(stored.hours)
    ? (stored.hours as HoursRow[]).filter((h) => h && typeof h.days === "string" && h.days.trim())
    : [];
  return {
    phones: phones.length ? phones.map((p) => ({ number: p.number.trim(), label: (p.label ?? "").trim() })) : d.phones,
    email: typeof stored.email === "string" && stored.email.trim() ? stored.email.trim() : d.email,
    address: obj(d.address, stored.address),
    hours: hours.length ? hours.map((h) => ({ days: h.days.trim(), time: (h.time ?? "").trim() })) : d.hours,
    socials: obj(d.socials, stored.socials),
    legal: obj(d.legal, stored.legal),
  };
}

export type PhoneContact = { raw: string; display: string; href: string; label: string };

/** Phones in the shape components used before settings existed. */
export function toPhoneContacts(phones: PhoneSetting[]): PhoneContact[] {
  return phones.map((p) => {
    const raw = normalizePhone(p.number);
    return { raw, display: p.number, href: phoneHref(raw), label: p.label };
  });
}
