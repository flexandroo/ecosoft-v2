// Daily replacement reminders: N days before the due date (customer setting,
// default 7) and on the due day. Each kind is sent once per due date.
import "server-only";
import { escapeHtml } from "@/lib/telegram";
import { TelegramError } from "@/lib/telegram-api";
import { clientBot, clientFilters, clientSettings, db, modelShortName, productLinks } from "./data";
import { daysLabel, formatDate, kyivToday } from "./schedule";

type Due = { filterId: string; ref: string; index: number; itemId: string; title: string; dueOn: string; daysLeft: number; kind: "before" | "due"; cartridge: string | null; guide: string | null; filterName: string };

export async function runReminders(today = kyivToday()): Promise<{ clients: number; sent: number; blocked: number; failed: number }> {
  const { data: clients } = await db().from("bot_clients").select("id, tg_user_id, settings").eq("is_blocked", false);
  let sent = 0;
  let blocked = 0;
  let failed = 0;

  for (const c of clients ?? []) {
    const settings = clientSettings(c.settings);
    if (!settings.reminders) continue;
    const filters = await clientFilters(c.id, today);
    const candidates: Due[] = [];
    for (const f of filters) {
      f.items.forEach((i, index) => {
        if (i.daysLeft === null || !i.dueOn) return;
        const kind = i.daysLeft <= 0 ? "due" : settings.remind_before_days > 0 && i.daysLeft <= settings.remind_before_days ? "before" : null;
        if (!kind) return;
        candidates.push({
          filterId: f.id,
          ref: f.id.replace(/-/g, "").slice(0, 12),
          index,
          itemId: i.id,
          title: i.title,
          dueOn: i.dueOn,
          daysLeft: i.daysLeft,
          kind,
          cartridge: i.cartridge_product_id,
          guide: i.guide_id,
          filterName: f.label || modelShortName(f.model.name),
        });
      });
    }
    if (!candidates.length) continue;

    const { data: already } = await db()
      .from("bot_reminders")
      .select("client_filter_id, service_item_id, due_on, kind")
      .in("client_filter_id", [...new Set(candidates.map((d) => d.filterId))]);
    const sentKeys = new Set((already ?? []).map((r) => `${r.client_filter_id}:${r.service_item_id}:${r.due_on}:${r.kind}`));
    const due = candidates.filter((d) => !sentKeys.has(`${d.filterId}:${d.itemId}:${d.dueOn}:${d.kind}`));
    if (!due.length) continue;

    const links = await productLinks(due.map((d) => d.cartridge ?? ""));
    const line = (d: Due) =>
      d.kind === "due"
        ? `🔴 ${escapeHtml(d.title)} — ${d.daysLeft === 0 ? "час міняти сьогодні" : `прострочено на ${daysLabel(-d.daysLeft)}`}`
        : `🟡 ${escapeHtml(d.title)} — через ${daysLabel(d.daysLeft)}, до ${formatDate(d.dueOn)}`;
    const byFilter = new Map<string, Due[]>();
    for (const d of due) byFilter.set(d.filterId, [...(byFilter.get(d.filterId) ?? []), d]);
    const lines = [...byFilter.values()].map((list) => `<b>${escapeHtml(list[0].filterName)}</b>\n${list.map(line).join("\n")}`);
    const rows = due.slice(0, 6).flatMap((d) => {
      const row: { text: string; callback_data?: string; url?: string }[] = [
        { text: `✅ Замінив · ${d.title}`.slice(0, 60), callback_data: `done:${d.ref}:${d.index}` },
      ];
      const link = d.cartridge ? links.get(d.cartridge) : undefined;
      const extra: { text: string; callback_data?: string; url?: string }[] = [];
      if (link) extra.push({ text: "🛒 Замовити", url: link.url });
      if (d.guide) extra.push({ text: "🛠 Як замінити", callback_data: `g:${d.guide}` });
      return extra.length ? [row, extra] : [row];
    });

    try {
      await clientBot("sendMessage", {
        chat_id: c.tg_user_id,
        text: `🔔 <b>Нагадування про заміну картриджів</b>\n\n${lines.join("\n\n")}\n\nПісля заміни натисніть «✅ Замінив» — я почну новий відлік.`,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: rows },
      });
      await db()
        .from("bot_reminders")
        .upsert(
          due.map((d) => ({ client_filter_id: d.filterId, service_item_id: d.itemId, due_on: d.dueOn, kind: d.kind })),
          { onConflict: "client_filter_id,service_item_id,due_on,kind", ignoreDuplicates: true },
        );
      sent++;
    } catch (error) {
      if (error instanceof TelegramError && error.blocked) {
        blocked++;
        await db().from("bot_clients").update({ is_blocked: true }).eq("id", c.id);
      } else {
        failed++;
        console.error("[client-bot] reminder failed:", error);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return { clients: clients?.length ?? 0, sent, blocked, failed };
}
