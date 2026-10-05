// Statuses mirror ecosoftcrm so existing manager habits (and reports) carry over.
export const LEAD_STATUSES = [
  { id: "new", label: "Нова", tone: "bg-sky-100 text-sky-800" },
  { id: "contacting", label: "Звʼязуємось", tone: "bg-amber-100 text-amber-800" },
  { id: "confirmed", label: "Підтверджена", tone: "bg-indigo-100 text-indigo-800" },
  { id: "awaiting_shipment", label: "Очікує відправлення", tone: "bg-slate-200 text-slate-800" },
  { id: "shipped", label: "Відправлена", tone: "bg-violet-100 text-violet-800" },
  { id: "completed", label: "Успішно завершена", tone: "bg-emerald-100 text-emerald-800" },
  { id: "cancelled", label: "Скасована", tone: "bg-rose-100 text-rose-800" },
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number]["id"];

export const LEAD_KINDS = [
  { id: "order", label: "Замовлення" },
  { id: "callback", label: "Зворотний дзвінок" },
  { id: "contact", label: "Заявка з форми" },
] as const;

export type LeadKind = (typeof LEAD_KINDS)[number]["id"];

export const PAYMENT_METHODS = [
  { id: "none", label: "Не вказано" },
  { id: "cod", label: "Накладений платіж" },
  { id: "bank_transfer", label: "Оплата на рахунок" },
  { id: "cash", label: "Готівка" },
] as const;

export const PAYMENT_STATUSES = [
  { id: "unpaid", label: "Не оплачено" },
  { id: "paid", label: "Оплачено" },
  { id: "not_required", label: "Не застосовується" },
] as const;

export const BANNER_PLACEMENTS = [
  { id: "hero", label: "Головний слайдер" },
  { id: "side", label: "Бічний промо-блок" },
] as const;

const STATUS_IDS = new Set<string>(LEAD_STATUSES.map((s) => s.id));
const KIND_IDS = new Set<string>(LEAD_KINDS.map((k) => k.id));

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === "string" && STATUS_IDS.has(value);
}

export function isLeadKind(value: unknown): value is LeadKind {
  return typeof value === "string" && KIND_IDS.has(value);
}

export function statusMeta(id: string) {
  return LEAD_STATUSES.find((s) => s.id === id) ?? LEAD_STATUSES[0];
}

export function kindLabel(id: string) {
  return LEAD_KINDS.find((k) => k.id === id)?.label ?? id;
}

export function labelOf(list: readonly { id: string; label: string }[], id: string) {
  return list.find((item) => item.id === id)?.label ?? id;
}
