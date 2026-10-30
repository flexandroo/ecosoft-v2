// Database access for the customer bot (service role, server only).
import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { callTelegram } from "@/lib/telegram-api";
import { itemStatus, kyivToday, type ItemStatus } from "./schedule";

export const CLIENT_BOT_TOKEN = process.env.TELEGRAM_CLIENT_BOT_TOKEN;

export function clientBot<T = unknown>(method: string, body: Record<string, unknown>): Promise<T> {
  return callTelegram<T>(CLIENT_BOT_TOKEN, method, body);
}

export function db() {
  const client = createServiceClient();
  if (!client) throw new Error("Supabase service client is not configured");
  return client;
}

export type ClientSettings = { reminders: boolean; remind_before_days: number; promo: boolean; news: boolean };
export type ClientState =
  | { step?: undefined }
  | { step: "name"; next?: "phone" | "menu"; product?: string }
  | { step: "phone"; product?: string; onboarding?: boolean }
  | { step: "date"; filterId: string; itemId?: string }
  | { step: "label"; filterId: string }
  | { step: "support" };

export type Client = {
  id: string;
  tg_user_id: number;
  tg_username: string | null;
  tg_first_name: string;
  name: string;
  phone: string;
  settings: ClientSettings;
  state: ClientState;
  is_blocked: boolean;
};

const DEFAULT_SETTINGS: ClientSettings = { reminders: true, remind_before_days: 7, promo: true, news: true };

export function clientSettings(raw: unknown): ClientSettings {
  const s = (raw && typeof raw === "object" ? raw : {}) as Partial<ClientSettings>;
  const before = Number(s.remind_before_days);
  return {
    reminders: s.reminders !== false,
    remind_before_days: [0, 3, 7, 14].includes(before) ? before : DEFAULT_SETTINGS.remind_before_days,
    promo: s.promo !== false,
    news: s.news !== false,
  };
}

function toClient(row: Record<string, unknown>): Client {
  return {
    ...(row as unknown as Client),
    settings: clientSettings(row.settings),
    state: (row.state && typeof row.state === "object" ? row.state : {}) as ClientState,
  };
}

const CLIENT_COLUMNS = "id, tg_user_id, tg_username, tg_first_name, name, phone, settings, state, is_blocked";

/** Find or register the Telegram user; refreshes username and last-seen time. */
export async function upsertClient(user: { id: number; username?: string; first_name?: string }): Promise<Client> {
  const { data, error } = await db()
    .from("bot_clients")
    .upsert(
      {
        tg_user_id: user.id,
        tg_username: user.username ?? null,
        tg_first_name: (user.first_name ?? "").slice(0, 100),
        last_seen_at: new Date().toISOString(),
        is_blocked: false,
      },
      { onConflict: "tg_user_id" },
    )
    .select(CLIENT_COLUMNS)
    .single();
  if (error || !data) throw new Error(`bot client upsert failed: ${error?.message}`);
  return toClient(data);
}

export async function updateClient(id: string, patch: Partial<Pick<Client, "name" | "phone" | "settings" | "state" | "is_blocked">>) {
  const { error } = await db().from("bot_clients").update(patch).eq("id", id);
  if (error) throw new Error(`bot client update failed: ${error.message}`);
}

export async function getClient(id: string): Promise<Client | null> {
  const { data } = await db().from("bot_clients").select(CLIENT_COLUMNS).eq("id", id).maybeSingle();
  return data ? toClient(data) : null;
}

// ---------------------------------------------------------------------------
// Catalogue: filter models that have a replacement schedule
// ---------------------------------------------------------------------------

export type Model = { id: string; sku: string; name: string; category: string; slug: string };
export type ServiceItem = {
  id: string;
  product_id: string;
  title: string;
  interval_days: number;
  cartridge_product_id: string | null;
  guide_id: string | null;
  sort: number;
};

export const MODEL_GROUPS: { key: string; label: string; categories: string[] }[] = [
  { key: "ro", label: "💧 Зворотний осмос", categories: ["reverse-osmosis"] },
  { key: "flow", label: "🚰 Проточні фільтри", categories: ["flow-filters"] },
  { key: "main", label: "🏠 Магістральні фільтри", categories: ["mainline-filters"] },
];

/** "Ультракомпактний розумний фільтр зворотного осмосу CROSS Solo" → "CROSS Solo". */
export function modelShortName(name: string): string {
  return name
    .replace(/^.*?фільтр зворотного осмосу\s+/i, "")
    .replace(/^Фільтр механічного очищення\s+/i, "Механічний ")
    .trim();
}

export async function listModels(): Promise<Model[]> {
  const items = await db().from("bot_service_items").select("product_id");
  const ids = [...new Set((items.data ?? []).map((r) => r.product_id))];
  if (!ids.length) return [];
  const { data } = await db()
    .from("products")
    .select("id, sku, name, category, slug, sort")
    .in("id", ids)
    .eq("is_hidden", false)
    .order("sort");
  return (data ?? []).map(({ id, sku, name, category, slug }) => ({ id, sku, name, category, slug }));
}

export async function getModel(productId: string): Promise<Model | null> {
  const { data } = await db().from("products").select("id, sku, name, category, slug").eq("id", productId).maybeSingle();
  return data;
}

export async function findModelBySku(sku: string): Promise<Model | null> {
  const { data } = await db().from("products").select("id, sku, name, category, slug").eq("sku", sku).maybeSingle();
  return data;
}

export async function serviceItems(productIds: string[]): Promise<ServiceItem[]> {
  if (!productIds.length) return [];
  const { data } = await db()
    .from("bot_service_items")
    .select("id, product_id, title, interval_days, cartridge_product_id, guide_id, sort")
    .in("product_id", productIds)
    .order("sort");
  return data ?? [];
}

/** Public product URLs (for "Замовити картридж"), keyed by product id. */
export async function productLinks(ids: string[]): Promise<Map<string, { url: string; name: string }>> {
  const map = new Map<string, { url: string; name: string }>();
  const unique = [...new Set(ids)].filter(Boolean);
  if (!unique.length) return map;
  const { data } = await db().from("products").select("id, slug, category, name").in("id", unique);
  for (const p of data ?? []) map.set(p.id, { url: `https://sofiivkawater.com/catalog/${p.category}/${p.slug}`, name: p.name });
  return map;
}

// ---------------------------------------------------------------------------
// A customer's filters with the computed schedule
// ---------------------------------------------------------------------------

export type FilterItemState = ServiceItem & ItemStatus;
export type ClientFilter = { id: string; label: string; model: Model; items: FilterItemState[] };

export async function clientFilters(clientId: string, today = kyivToday()): Promise<ClientFilter[]> {
  const { data: filters } = await db()
    .from("bot_client_filters")
    .select("id, label, product_id, created_at")
    .eq("client_id", clientId)
    .order("created_at");
  if (!filters?.length) return [];
  const productIds = [...new Set(filters.map((f) => f.product_id))];
  const [{ data: products }, items, { data: reps }] = await Promise.all([
    db().from("products").select("id, sku, name, category, slug").in("id", productIds),
    serviceItems(productIds),
    db()
      .from("bot_replacements")
      .select("client_filter_id, service_item_id, replaced_on, created_at")
      .in("client_filter_id", filters.map((f) => f.id))
      .order("created_at", { ascending: false }),
  ]);
  // The most recently entered date wins, so a customer can correct a mistake.
  const last = new Map<string, string>();
  for (const r of reps ?? []) {
    const key = `${r.client_filter_id}:${r.service_item_id}`;
    if (!last.has(key)) last.set(key, r.replaced_on);
  }
  const byId = new Map((products ?? []).map((p) => [p.id, p]));
  return filters
    .filter((f) => byId.has(f.product_id))
    .map((f) => ({
      id: f.id,
      label: f.label,
      model: byId.get(f.product_id)!,
      items: items
        .filter((i) => i.product_id === f.product_id)
        .map((i) => ({ ...i, ...itemStatus(last.get(`${f.id}:${i.id}`) ?? null, i.interval_days, today) })),
    }));
}

export async function addFilter(clientId: string, productId: string): Promise<string> {
  const { data, error } = await db()
    .from("bot_client_filters")
    .insert({ client_id: clientId, product_id: productId })
    .select("id")
    .single();
  if (error || !data) throw new Error(`add filter failed: ${error?.message}`);
  return data.id;
}

/** Record a replacement date for one item, or for every item of the filter. */
export async function setReplaced(filterId: string, date: string, itemId?: string) {
  const { data: filter } = await db().from("bot_client_filters").select("product_id").eq("id", filterId).maybeSingle();
  if (!filter) return;
  const items = itemId ? [{ id: itemId }] : await serviceItems([filter.product_id]);
  if (!items.length) return;
  const { error } = await db()
    .from("bot_replacements")
    .insert(items.map((i) => ({ client_filter_id: filterId, service_item_id: i.id, replaced_on: date })));
  if (error) throw new Error(`replacement insert failed: ${error.message}`);
}

export async function ownsFilter(clientId: string, filterId: string): Promise<boolean> {
  const { data } = await db().from("bot_client_filters").select("id").eq("id", filterId).eq("client_id", clientId).maybeSingle();
  return Boolean(data);
}

export async function renameFilter(filterId: string, label: string) {
  await db().from("bot_client_filters").update({ label: label.slice(0, 40) }).eq("id", filterId);
}

export async function deleteFilter(filterId: string) {
  await db().from("bot_client_filters").delete().eq("id", filterId);
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export type Guide = { id: string; title: string; body: string; video_url: string };

export async function listGuides(): Promise<Guide[]> {
  const { data } = await db().from("bot_guides").select("id, title, body, video_url").eq("is_published", true).order("sort");
  return data ?? [];
}

export async function getGuide(id: string): Promise<Guide | null> {
  const { data } = await db().from("bot_guides").select("id, title, body, video_url").eq("id", id).eq("is_published", true).maybeSingle();
  return data;
}

export type Faq = { id: string; question: string; answer: string };

export async function listFaq(): Promise<Faq[]> {
  const { data } = await db().from("bot_faq").select("id, question, answer").eq("is_published", true).order("sort");
  return data ?? [];
}

export async function getFaq(id: string): Promise<Faq | null> {
  const { data } = await db().from("bot_faq").select("id, question, answer").eq("id", id).eq("is_published", true).maybeSingle();
  return data;
}
