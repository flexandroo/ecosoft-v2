// Date maths for the customer bot. Dates are calendar days in Kyiv, stored as
// "YYYY-MM-DD" strings; nothing here touches the database.

const KYIV = "Europe/Kyiv";
const DAY_MS = 86_400_000;

/** Today in Kyiv as "YYYY-MM-DD". */
export function kyivToday(now = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: KYIV, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function toUtcMs(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`);
}

export function addDays(iso: string, days: number): string {
  return new Date(toUtcMs(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}

/** "2026-11-05" → "05.11.2026". */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

/**
 * Parse a date typed by a customer: "5.11.2026", "05.11.26", "5/11/2026" or
 * "5.11" (current year). Returns null when invalid, in the future, or older
 * than five years.
 */
export function parseTypedDate(text: string, today = kyivToday()): string | null {
  const m = text.trim().match(/^(\d{1,2})[./\-\s](\d{1,2})(?:[./\-\s](\d{2}|\d{4}))?$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  let year = m[3] ? Number(m[3]) : Number(today.slice(0, 4));
  if (year < 100) year += 2000;
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const ms = toUtcMs(iso);
  if (Number.isNaN(ms) || new Date(ms).toISOString().slice(0, 10) !== iso) return null;
  const age = daysBetween(iso, today);
  if (age < 0 || age > 5 * 366) return null;
  return iso;
}

/** Ukrainian plural: 1 день, 2 дні, 5 днів. */
export function plural(n: number, [one, few, many]: [string, string, string]): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b >= 2 && b <= 4) return few;
  return many;
}

export function daysLabel(n: number): string {
  return `${n} ${plural(n, ["день", "дні", "днів"])}`;
}

export type ItemStatus = {
  /** Last replacement date, or null when the customer never set one. */
  lastOn: string | null;
  dueOn: string | null;
  /** Days until due (negative = overdue), null when unknown. */
  daysLeft: number | null;
};

export function itemStatus(lastOn: string | null, intervalDays: number, today = kyivToday()): ItemStatus {
  if (!lastOn) return { lastOn: null, dueOn: null, daysLeft: null };
  const dueOn = addDays(lastOn, intervalDays);
  return { lastOn, dueOn, daysLeft: daysBetween(today, dueOn) };
}

/** One line of the "Як там мій фільтр?" report. */
export function statusLine(title: string, s: ItemStatus, remindBefore: number): string {
  if (s.daysLeft === null || !s.dueOn) return `❔ <b>${title}</b> — дату заміни не вказано`;
  if (s.daysLeft < 0) return `🔴 <b>${title}</b> — прострочено на ${daysLabel(-s.daysLeft)} (було до ${formatDate(s.dueOn)})`;
  if (s.daysLeft === 0) return `🔴 <b>${title}</b> — час міняти сьогодні`;
  const icon = s.daysLeft <= remindBefore ? "🟡" : "🟢";
  return `${icon} <b>${title}</b> — через ${daysLabel(s.daysLeft)} (до ${formatDate(s.dueOn)})`;
}
