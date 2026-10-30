// Customer bot "Помічник Sofiivka Water": update handling (messages + buttons).
import "server-only";
import { getSiteSettings } from "@/lib/settings";
import { formatOpenHours } from "@/lib/settings-shared";
import { isValidUkrainianPhone } from "@/lib/validation";
import { escapeHtml } from "@/lib/telegram";
import { historyFor, renderBroadcast } from "./broadcasts";
import {
  MODEL_GROUPS,
  addFilter,
  clientBot,
  clientFilters,
  deleteFilter,
  findModelBySku,
  getFaq,
  getGuide,
  getModel,
  modelShortName,
  listFaq,
  listGuides,
  listModels,
  productLinks,
  renameFilter,
  serviceItems,
  setReplaced,
  updateClient,
  upsertClient,
  type Client,
  type ClientFilter,
  type ClientState,
} from "./data";
import { addDays, daysLabel, formatDate, kyivToday, parseTypedDate, statusLine } from "./schedule";
import { forwardToManagers } from "./support";

// ---------------------------------------------------------------------------
// Telegram types (only what the bot reads)
// ---------------------------------------------------------------------------
type TgUser = { id: number; is_bot?: boolean; first_name?: string; last_name?: string; username?: string };
type TgMessage = {
  message_id: number;
  chat: { id: number; type: string };
  from?: TgUser;
  text?: string;
  contact?: { phone_number: string; user_id?: number };
};
export type ClientUpdate = {
  message?: TgMessage;
  callback_query?: { id: string; from: TgUser; data?: string; message?: TgMessage };
};

type Markup = Record<string, unknown>;
type Button = { text: string; callback_data?: string; url?: string };

// ---------------------------------------------------------------------------
// Main menu
// ---------------------------------------------------------------------------
export const MENU = {
  status: "🔧 Як там мій фільтр?",
  edit: "✏️ Редагувати фільтр",
  guides: "🛠 Як замінити?",
  news: "🎁 Акції та новини",
  faq: "❓ FAQ",
  profile: "👤 Профіль",
  settings: "⚙️ Налаштування",
  support: "💬 Звʼязатись з адміністратором",
} as const;

const MENU_KEYBOARD = {
  keyboard: [
    [{ text: MENU.status }],
    [{ text: MENU.edit }, { text: MENU.guides }],
    [{ text: MENU.news }, { text: MENU.faq }],
    [{ text: MENU.profile }, { text: MENU.settings }],
    [{ text: MENU.support }],
  ],
  resize_keyboard: true,
  is_persistent: true,
};

const SKIP = "⏭ Пропустити";
const PHONE_KEYBOARD = {
  keyboard: [[{ text: "📱 Поділитися номером", request_contact: true }], [{ text: SKIP }]],
  resize_keyboard: true,
  one_time_keyboard: true,
};

const START_OPTIONS: { label: string; daysAgo: number }[] = [
  { label: "Сьогодні / щойно встановили", daysAgo: 0 },
  { label: "Місяць тому", daysAgo: 30 },
  { label: "3 місяці тому", daysAgo: 91 },
  { label: "6 місяців тому", daysAgo: 182 },
];

// ---------------------------------------------------------------------------
// Context helpers
// ---------------------------------------------------------------------------
type Ctx = { client: Client; chatId: number; editId?: number };

async function send(ctx: Ctx, text: string, reply_markup?: Markup) {
  await clientBot("sendMessage", { chat_id: ctx.chatId, text, parse_mode: "HTML", disable_web_page_preview: true, reply_markup });
}

/** Edit the message the button belongs to (keeps the chat tidy); send when that fails. */
async function show(ctx: Ctx, text: string, inline?: Button[][]) {
  const reply_markup = inline ? { inline_keyboard: inline } : undefined;
  if (ctx.editId) {
    try {
      await clientBot("editMessageText", {
        chat_id: ctx.chatId,
        message_id: ctx.editId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup,
      });
      return;
    } catch (error) {
      if (String(error).includes("not modified")) return;
    }
  }
  await send(ctx, text, reply_markup);
}

async function setState(ctx: Ctx, state: ClientState) {
  ctx.client.state = state;
  await updateClient(ctx.client.id, { state });
}

const short = (id: string) => id.replace(/-/g, "").slice(0, 12);
const findFilter = (filters: ClientFilter[], ref: string) => filters.find((f) => short(f.id) === ref);
const filterName = (f: ClientFilter) => escapeHtml(f.label ? `${f.label} — ${modelShortName(f.model.name)}` : modelShortName(f.model.name));

function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

const buttonName = (f: ClientFilter, max = 40) => clip(f.label || modelShortName(f.model.name), max);

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
export async function handleClientUpdate(update: ClientUpdate): Promise<void> {
  try {
    await processUpdate(update);
  } catch (error) {
    // Don't leave the customer without an answer (e.g. the database is briefly unreachable).
    const chat = update.message?.chat ?? update.callback_query?.message?.chat;
    if (chat?.type === "private") {
      await clientBot("sendMessage", {
        chat_id: chat.id,
        text: "😔 Щось пішло не так. Спробуйте, будь ласка, ще раз за хвилину.",
      }).catch(() => {});
    }
    throw error;
  }
}

async function processUpdate(update: ClientUpdate): Promise<void> {
  const cq = update.callback_query;
  if (cq) {
    if (cq.message?.chat.type !== "private" || cq.from.is_bot) return;
    const client = await upsertClient(cq.from);
    const ctx: Ctx = { client, chatId: cq.message.chat.id, editId: cq.message.message_id };
    let toast = "";
    try {
      toast = (await onButton(ctx, cq.data ?? "")) ?? "";
    } finally {
      await clientBot("answerCallbackQuery", { callback_query_id: cq.id, text: toast }).catch(() => {});
    }
    return;
  }

  const msg = update.message;
  if (!msg?.from || msg.from.is_bot || msg.chat.type !== "private") return;
  const client = await upsertClient(msg.from);
  const ctx: Ctx = { client, chatId: msg.chat.id };

  if (msg.contact) return onContact(ctx, msg.contact, msg.from.id);
  const text = (msg.text ?? "").trim();
  if (!text) return send(ctx, "Оберіть пункт меню 👇", MENU_KEYBOARD);

  if (text.startsWith("/start")) return onStart(ctx, text.split(/\s+/)[1] ?? "");
  if (text === "/menu" || text === "/help") {
    await setState(ctx, {});
    return send(ctx, "Головне меню 👇", MENU_KEYBOARD);
  }

  const menuKey = (Object.keys(MENU) as (keyof typeof MENU)[]).find((k) => MENU[k] === text);
  if (menuKey) {
    if (ctx.client.state.step) await setState(ctx, {});
    return onMenu(ctx, menuKey);
  }
  return onText(ctx, text);
}

// ---------------------------------------------------------------------------
// Onboarding and profile
// ---------------------------------------------------------------------------
async function onStart(ctx: Ctx, payload: string) {
  const sku = payload.startsWith("f_") ? payload.slice(2).replace(/_/g, "/").slice(0, 60) : "";
  const product = sku ? (await findModelBySku(sku))?.id : undefined;
  if (!ctx.client.name) {
    await setState(ctx, { step: "name", next: "phone", product });
    return send(
      ctx,
      "Вітаю! Я — <b>помічник Sofiivka Water</b> 💧\n\nНагадаю, коли час міняти картриджі у вашому фільтрі, підкажу, як це зробити, і повідомлю про акції саме для вашої моделі.\n\n<b>Як до вас звертатися?</b> Напишіть імʼя.",
      { remove_keyboard: true },
    );
  }
  await setState(ctx, {});
  await send(ctx, `З поверненням, ${escapeHtml(ctx.client.name)}! 👋`, MENU_KEYBOARD);
  if (product) return startFilter(ctx, product);
}

async function askPhone(ctx: Ctx, product?: string) {
  await setState(ctx, { step: "phone", product, onboarding: true });
  await send(
    ctx,
    "Дякую! Поділіться, будь ласка, номером телефону — щоб менеджер міг звʼязатися з вами щодо замовлення картриджів.\n\nНатисніть кнопку нижче або напишіть номер.",
    PHONE_KEYBOARD,
  );
}

async function finishOnboarding(ctx: Ctx, product?: string) {
  await setState(ctx, {});
  await send(ctx, "Готово! Ось головне меню 👇", MENU_KEYBOARD);
  if (product) return startFilter(ctx, product);
  const filters = await clientFilters(ctx.client.id);
  if (!filters.length) {
    await send(ctx, "Додамо ваш фільтр, щоб я рахував дні до заміни картриджів?", {
      inline_keyboard: [[{ text: "➕ Додати фільтр", callback_data: "add" }]],
    });
  }
}

async function onContact(ctx: Ctx, contact: { phone_number: string; user_id?: number }, fromId: number) {
  if (contact.user_id && contact.user_id !== fromId) return send(ctx, "Надішліть, будь ласка, свій номер кнопкою «📱 Поділитися номером».");
  const phone = contact.phone_number.startsWith("+") ? contact.phone_number : `+${contact.phone_number}`;
  await updateClient(ctx.client.id, { phone: phone.slice(0, 20) });
  ctx.client.phone = phone;
  const state = ctx.client.state;
  if (state.step === "phone" && state.onboarding) return finishOnboarding(ctx, state.product);
  await setState(ctx, {});
  return send(ctx, "📱 Номер збережено.", MENU_KEYBOARD);
}

async function showProfile(ctx: Ctx) {
  const filters = await clientFilters(ctx.client.id);
  await show(
    ctx,
    `👤 <b>Профіль</b>\n\nІмʼя: ${escapeHtml(ctx.client.name || "—")}\nТелефон: ${escapeHtml(ctx.client.phone || "—")}\nФільтрів: ${filters.length}`,
    [[{ text: "✏️ Змінити імʼя", callback_data: "prof:name" }, { text: "📱 Змінити телефон", callback_data: "prof:phone" }]],
  );
}

// ---------------------------------------------------------------------------
// Typed input (depends on the conversation step)
// ---------------------------------------------------------------------------
async function onText(ctx: Ctx, text: string) {
  const state = ctx.client.state;
  switch (state.step) {
    case "name": {
      const name = text.replace(/\s+/g, " ").slice(0, 60);
      if (name.length < 2 || name.startsWith("/")) return send(ctx, "Напишіть, будь ласка, імʼя (від 2 літер).");
      await updateClient(ctx.client.id, { name });
      ctx.client.name = name;
      if (state.next === "phone") return askPhone(ctx, state.product);
      await setState(ctx, {});
      return send(ctx, "✅ Імʼя збережено.", MENU_KEYBOARD);
    }
    case "phone": {
      if (text === SKIP) {
        if (state.onboarding) return finishOnboarding(ctx, state.product);
        await setState(ctx, {});
        return send(ctx, "Головне меню 👇", MENU_KEYBOARD);
      }
      const phone = text.replace(/[^\d+]/g, "");
      if (!isValidUkrainianPhone(phone)) return send(ctx, "Не схоже на номер. Приклад: <b>+380 67 123 45 67</b>, або натисніть «Пропустити».");
      await updateClient(ctx.client.id, { phone: phone.slice(0, 20) });
      ctx.client.phone = phone;
      if (state.onboarding) return finishOnboarding(ctx, state.product);
      await setState(ctx, {});
      return send(ctx, "📱 Номер збережено.", MENU_KEYBOARD);
    }
    case "date": {
      const date = parseTypedDate(text);
      if (!date) return send(ctx, "Не вдалося розпізнати дату. Напишіть у форматі <b>ДД.ММ.РРРР</b>, наприклад 15.09.2026 (не в майбутньому).");
      await setReplaced(state.filterId, date, state.itemId);
      await setState(ctx, {});
      await send(ctx, `✅ Записали заміну: ${formatDate(date)}.`, MENU_KEYBOARD);
      return showStatus(ctx);
    }
    case "label": {
      await renameFilter(state.filterId, text.slice(0, 40));
      await setState(ctx, {});
      await send(ctx, "✅ Назву збережено.", MENU_KEYBOARD);
      return showEditList(ctx);
    }
    case "support": {
      const ok = await forwardToManagers(ctx.client, text);
      return send(
        ctx,
        ok
          ? "✅ Передали менеджеру. Відповідь прийде сюди ж.\n\nМожете дописати ще — або оберіть пункт меню, щоб завершити."
          : "На жаль, зараз не вдалося передати повідомлення. Зателефонуйте нам — номер є на sofiivkawater.com/contacts.",
      );
    }
    default:
      return send(ctx, "Оберіть пункт меню 👇", MENU_KEYBOARD);
  }
}

// ---------------------------------------------------------------------------
// Menu sections
// ---------------------------------------------------------------------------
async function onMenu(ctx: Ctx, key: keyof typeof MENU) {
  switch (key) {
    case "status":
      return showStatus(ctx);
    case "edit":
      return showEditList(ctx);
    case "guides":
      return showGuides(ctx);
    case "news":
      return showNews(ctx);
    case "faq":
      return showFaq(ctx);
    case "profile":
      return showProfile(ctx);
    case "settings":
      return showSettings(ctx);
    case "support": {
      await setState(ctx, { step: "support" });
      const hours = formatOpenHours((await getSiteSettings()).hours);
      return send(
        ctx,
        `💬 Напишіть ваше питання — передамо менеджеру. Відповідь прийде сюди ж.${hours ? `\n\nГрафік: ${escapeHtml(hours)}.` : ""}`,
      );
    }
  }
}

async function showStatus(ctx: Ctx) {
  const filters = await clientFilters(ctx.client.id);
  if (!filters.length) {
    return show(ctx, "У вас ще немає доданих фільтрів.\n\nДодайте свій — і я рахуватиму дні до заміни картриджів та нагадаю вчасно.", [
      [{ text: "➕ Додати фільтр", callback_data: "add" }],
    ]);
  }
  const before = ctx.client.settings.remind_before_days;
  const blocks = filters.map(
    (f) => `<b>${filterName(f)}</b>\n${f.items.map((i) => statusLine(escapeHtml(i.title), i, before)).join("\n")}`,
  );
  // "Замовити" for whatever is due soon or overdue.
  const due = filters.flatMap((f) => f.items.filter((i) => i.cartridge_product_id && i.daysLeft !== null && i.daysLeft <= Math.max(before, 14)));
  const links = await productLinks(due.map((i) => i.cartridge_product_id!));
  const buy: Button[][] = [...new Map(due.map((i) => [i.cartridge_product_id!, i])).values()]
    .slice(0, 3)
    .map((i) => [{ text: `🛒 ${i.title}`.slice(0, 60), url: links.get(i.cartridge_product_id!)?.url ?? "https://sofiivkawater.com" }]);
  const mark: Button[][] = filters.map((f) => [{ text: `✅ Відмітити заміну · ${buttonName(f, 30)}`, callback_data: `ri:${short(f.id)}` }]);
  await show(ctx, `🔧 <b>Стан ваших фільтрів</b>\n\n${blocks.join("\n\n")}`, [...mark, ...buy, [{ text: "➕ Додати фільтр", callback_data: "add" }]]);
}

async function showEditList(ctx: Ctx) {
  const filters = await clientFilters(ctx.client.id);
  const rows: Button[][] = filters.map((f) => [{ text: `✏️ ${buttonName(f)}`, callback_data: `f:${short(f.id)}` }]);
  rows.push([{ text: "➕ Додати фільтр", callback_data: "add" }]);
  await show(ctx, filters.length ? "✏️ <b>Оберіть фільтр для редагування</b>" : "У вас ще немає фільтрів. Додайте перший 👇", rows);
}

async function showFilterEdit(ctx: Ctx, f: ClientFilter) {
  const lines = f.items.map((i) => `• ${escapeHtml(i.title)}: ${i.lastOn ? `замінено ${formatDate(i.lastOn)}` : "дату не вказано"}, раз на ${daysLabel(i.interval_days)}`);
  await show(ctx, `✏️ <b>${filterName(f)}</b>\n\n${lines.join("\n")}`, [
    [{ text: "📅 Змінити дату заміни", callback_data: `ri:${short(f.id)}` }],
    [{ text: "🏷 Назва (напр. «Кухня»)", callback_data: `lbl:${short(f.id)}` }, { text: "🗑 Видалити", callback_data: `del:${short(f.id)}` }],
    [{ text: "⬅️ До списку", callback_data: "edit" }],
  ]);
}

async function showGuides(ctx: Ctx) {
  const [guides, filters] = await Promise.all([listGuides(), clientFilters(ctx.client.id)]);
  if (!guides.length) return show(ctx, "🛠 Гайди скоро зʼявляться. Якщо потрібна допомога — натисніть «💬 Звʼязатись з адміністратором».");
  const mine = new Set(filters.flatMap((f) => f.items.map((i) => i.guide_id).filter(Boolean)));
  const sorted = [...guides].sort((a, b) => Number(mine.has(b.id)) - Number(mine.has(a.id)));
  await show(ctx, `Виберіть інструкцію:${mine.size ? "\n\n⭐ — для ваших фільтрів" : ""}`, [
    ...sorted.map((g) => [{ text: `${mine.has(g.id) ? "⭐ " : ""}${g.title}`.slice(0, 64), callback_data: `g:${g.id}` }]),
    [{ text: "Назад", callback_data: "menu" }],
  ]);
}

async function showFaq(ctx: Ctx) {
  const faq = await listFaq();
  if (!faq.length) return show(ctx, "❓ Розділ поповнюється. Напишіть нам через «💬 Звʼязатись з адміністратором».");
  await show(ctx, "Виберіть питання:", [
    ...faq.map((q) => [{ text: q.question.slice(0, 64), callback_data: `q:${q.id}` }]),
    [{ text: "Назад", callback_data: "menu" }],
  ]);
}

async function showNews(ctx: Ctx) {
  const filters = await clientFilters(ctx.client.id);
  const items = await historyFor(ctx.client, filters);
  const subs = ctx.client.settings;
  const footer = `\n\nПідписки: ${subs.promo ? "🎁 акції ✅" : "🎁 акції ✖️"} · ${subs.news ? "📰 новини ✅" : "📰 новини ✖️"}`;
  if (!items.length) {
    return show(ctx, `🎁 <b>Акції та новини</b>\n\nПоки що нічого нового для вас. Щойно зʼявиться акція на картриджі для вашого фільтра — я напишу.${footer}`, [
      [{ text: "⚙️ Налаштувати підписки", callback_data: "settings" }],
    ]);
  }
  await send(ctx, `🎁 <b>Акції та новини для вас</b>${footer}`, { inline_keyboard: [[{ text: "⚙️ Налаштувати підписки", callback_data: "settings" }]] });
  for (const b of items) {
    const { text, reply_markup } = renderBroadcast(b);
    await send(ctx, text, reply_markup);
  }
}

function settingsView(client: Client): { text: string; rows: Button[][] } {
  const s = client.settings;
  const before = (n: number, label: string) => ({ text: `${s.remind_before_days === n ? "• " : ""}${label}`, callback_data: `set:b${n}` });
  return {
    text: `⚙️ <b>Налаштування</b>\n\nНагадування про заміну: <b>${s.reminders ? "увімкнено" : "вимкнено"}</b>${
      s.reminders ? `\nНагадувати: <b>${s.remind_before_days ? `за ${daysLabel(s.remind_before_days)} і в день заміни` : "лише в день заміни"}</b>` : ""
    }\n\nПовідомлення: 🎁 акції — <b>${s.promo ? "так" : "ні"}</b>, 📰 новини — <b>${s.news ? "так" : "ні"}</b>`,
    rows: [
      [{ text: s.reminders ? "🔕 Вимкнути нагадування" : "🔔 Увімкнути нагадування", callback_data: "set:rem" }],
      ...(s.reminders ? [[before(0, "У день"), before(3, "За 3 дні"), before(7, "За 7 днів"), before(14, "За 14 днів")]] : []),
      [
        { text: `🎁 Акції ${s.promo ? "✅" : "✖️"}`, callback_data: "set:promo" },
        { text: `📰 Новини ${s.news ? "✅" : "✖️"}`, callback_data: "set:news" },
      ],
    ],
  };
}

async function showSettings(ctx: Ctx) {
  const v = settingsView(ctx.client);
  await show(ctx, v.text, v.rows);
}

// ---------------------------------------------------------------------------
// Adding a filter
// ---------------------------------------------------------------------------
async function startFilter(ctx: Ctx, productId: string) {
  const model = await getModel(productId);
  const items = model ? await serviceItems([model.id]) : [];
  if (!model || !items.length) return show(ctx, "Для цієї моделі ще немає графіка заміни. Напишіть нам через «💬 Звʼязатись з адміністратором».");
  // A second tap on the model (or an abandoned attempt) reuses the filter that has no dates yet.
  const pending = (await clientFilters(ctx.client.id)).find((f) => f.model.id === model.id && f.items.every((i) => !i.lastOn));
  const filterId = pending?.id ?? (await addFilter(ctx.client.id, model.id));
  const plan = items.map((i) => `• ${escapeHtml(i.title)} — раз на ${daysLabel(i.interval_days)}`).join("\n");
  await show(
    ctx,
    `➕ <b>${escapeHtml(model.name)}</b>\n\nГрафік заміни:\n${plan}\n\n<b>Коли ви встановили фільтр або востаннє міняли картриджі?</b>\nОкремі дати для кожного картриджа можна змінити пізніше в «✏️ Редагувати фільтр».`,
    dateButtons(`st:${short(filterId)}:a`),
  );
}

/** Product lines inside a filter type, matched by model name. */
const MODEL_LINES: { key: string; group: string; label: string; match: RegExp }[] = [
  { key: "std", group: "ro", label: "🟩 STANDARD — базова лінійка", match: /standard/i },
  { key: "abs", group: "ro", label: "🟧 ABSOLUTE — покращена лінійка", match: /absolute/i },
  { key: "pure", group: "ro", label: "🟦 PURE — преміум лінійка", match: /pure/i },
  { key: "cross", group: "ro", label: "🟪 CROSS — компактні без бака", match: /cross/i },
  { key: "mech", group: "main", label: "🔩 Механічного очищення", match: /механічн/i },
  { key: "scalex", group: "main", label: "🧂 Від накипу SCALEX", match: /scalex|накип/i },
];

function lineOf(name: string, group: string) {
  return MODEL_LINES.find((l) => l.group === group && l.match.test(name));
}

async function showModels(ctx: Ctx, title: string, models: { id: string; name: string }[], back: string) {
  const rows: Button[][] = models.map((m) => [{ text: clip(modelShortName(m.name), 60), callback_data: `mdl:${m.id}` }]);
  rows.push([{ text: "⬅️ Назад", callback_data: back }]);
  await show(ctx, `${title}\n\nОберіть модель. Не знайшли свою — напишіть нам через «💬 Звʼязатись з адміністратором».`, rows);
}

function dateButtons(prefix: string): Button[][] {
  return [
    ...START_OPTIONS.map((o) => [{ text: o.label, callback_data: `${prefix}:${o.daysAgo}` }]),
    [{ text: "📅 Ввести дату", callback_data: `${prefix}:t` }],
  ];
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------
async function onButton(ctx: Ctx, data: string): Promise<string | void> {
  const [cmd, a, b, c] = data.split(":");
  switch (cmd) {
    case "menu":
      // "Назад" from a list: close it; the reply keyboard is the main menu.
      return show(ctx, "Головне меню 👇");
    case "status":
      return showStatus(ctx);
    case "edit":
      return showEditList(ctx);
    case "settings":
      return showSettings(ctx);
    case "add": {
      const models = await listModels();
      const groups = MODEL_GROUPS.filter((g) => models.some((m) => g.categories.includes(m.category)));
      return show(ctx, "➕ <b>Який у вас фільтр?</b> Оберіть тип:", groups.map((g) => [{ text: g.label, callback_data: `grp:${g.key}` }]));
    }
    case "grp": {
      // Type → line (if the type has lines) → model.
      const group = MODEL_GROUPS.find((g) => g.key === a);
      if (!group) return;
      const models = (await listModels()).filter((m) => group.categories.includes(m.category));
      const lines = MODEL_LINES.filter((l) => l.group === group.key && models.some((m) => l.match.test(m.name)));
      if (!lines.length) return showModels(ctx, group.label, models, "add");
      const rows: Button[][] = lines.map((l) => [{ text: l.label, callback_data: `ln:${l.key}` }]);
      if (models.some((m) => !lineOf(m.name, group.key))) rows.push([{ text: "Інші моделі", callback_data: `ln:other-${group.key}` }]);
      rows.push([{ text: "⬅️ Назад", callback_data: "add" }]);
      return show(ctx, `${group.label}\n\nОберіть лінійку:`, rows);
    }
    case "ln": {
      const other = a?.startsWith("other-") ? a.slice(6) : null;
      const line = MODEL_LINES.find((l) => l.key === a);
      const groupKey = other ?? line?.group;
      const group = MODEL_GROUPS.find((g) => g.key === groupKey);
      if (!group) return;
      const models = (await listModels()).filter(
        (m) => group.categories.includes(m.category) && (line ? line.match.test(m.name) : !lineOf(m.name, group.key)),
      );
      return showModels(ctx, line ? line.label : `${group.label} — інші моделі`, models, `grp:${group.key}`);
    }
    case "mdl":
      if (a) await startFilter(ctx, a);
      return;
  }

  // Everything below works on one of the customer's own filters.
  const filters = await clientFilters(ctx.client.id);
  const f = a ? findFilter(filters, a) : undefined;

  switch (cmd) {
    case "st": // st:<filter>:a:<daysAgo|t>  — first dates for all items
    case "rd": {
      // rd:<filter>:<itemIndex|a>:<daysAgo|t>
      if (!f) return "Фільтр не знайдено";
      const item = b === "a" ? undefined : f.items[Number(b)];
      if (b !== "a" && !item) return "Картридж не знайдено";
      if (c === "t") {
        await setState(ctx, { step: "date", filterId: f.id, itemId: item?.id });
        await send(ctx, "Напишіть дату заміни у форматі <b>ДД.ММ.РРРР</b>, наприклад 15.09.2026.");
        return;
      }
      const daysAgo = Math.min(Math.max(Number(c) || 0, 0), 3650);
      const date = addDays(kyivToday(), -daysAgo);
      await setReplaced(f.id, date, item?.id);
      await show(ctx, `✅ Записали: ${item ? escapeHtml(item.title) : "усі картриджі"} — ${formatDate(date)}.`);
      await send(ctx, "Головне меню 👇", MENU_KEYBOARD);
      await showStatusAfterEdit(ctx);
      return "Збережено";
    }
    case "ri": {
      if (!f) return "Фільтр не знайдено";
      const rows: Button[][] = f.items.map((i, idx) => [{ text: `${i.title}`.slice(0, 60), callback_data: `rp:${a}:${idx}` }]);
      if (f.items.length > 1) rows.push([{ text: "Усі картриджі одразу", callback_data: `rp:${a}:a` }]);
      return show(ctx, `📅 <b>${filterName(f)}</b>\n\nЩо ви замінили?`, rows);
    }
    case "rp": {
      if (!f) return "Фільтр не знайдено";
      const item = b === "a" ? undefined : f.items[Number(b)];
      return show(ctx, `📅 Коли замінили ${item ? `<b>${escapeHtml(item.title)}</b>` : "<b>усі картриджі</b>"}?`, dateButtons(`rd:${a}:${b}`));
    }
    case "done": {
      // From a reminder: replaced today.
      if (!f) return "Фільтр не знайдено";
      const item = f.items[Number(b)];
      if (!item) return "Картридж не знайдено";
      if (item.lastOn === kyivToday()) return "Вже записано сьогодні";
      await setReplaced(f.id, kyivToday(), item.id);
      await send(ctx, `✅ Записали заміну «${escapeHtml(item.title)}» сьогодні. Наступна — через ${daysLabel(item.interval_days)}.`);
      return "Записали";
    }
    case "f":
      if (!f) return "Фільтр не знайдено";
      return showFilterEdit(ctx, f);
    case "lbl":
      if (!f) return "Фільтр не знайдено";
      await setState(ctx, { step: "label", filterId: f.id });
      await send(ctx, "Напишіть коротку назву, напр. «Кухня» або «Дача».");
      return;
    case "del":
      if (!f) return "Фільтр не знайдено";
      return show(ctx, `🗑 Видалити <b>${filterName(f)}</b> разом з історією замін?`, [
        [{ text: "Так, видалити", callback_data: `delok:${a}` }, { text: "Скасувати", callback_data: `f:${a}` }],
      ]);
    case "delok":
      if (!f) return "Фільтр не знайдено";
      await deleteFilter(f.id);
      await showEditList(ctx);
      return "Видалено";
    case "g": {
      const guide = a ? await getGuide(a) : null;
      if (!guide) return "Гайд не знайдено";
      const rows: Button[][] = [];
      if (guide.video_url) rows.push([{ text: "▶️ Дивитися відео", url: guide.video_url }]);
      rows.push([{ text: "Назад", callback_data: "guides" }]);
      return show(ctx, `🛠 <b>${escapeHtml(guide.title)}</b>\n\n${escapeHtml(guide.body)}`.slice(0, 4000), rows);
    }
    case "guides":
      return showGuides(ctx);
    case "q": {
      const q = a ? await getFaq(a) : null;
      if (!q) return "Питання не знайдено";
      return show(ctx, `❓ <b>${escapeHtml(q.question)}</b>\n\n${escapeHtml(q.answer)}`.slice(0, 4000), [[{ text: "Назад", callback_data: "faq" }]]);
    }
    case "faq":
      return showFaq(ctx);
    case "prof":
      if (a === "name") {
        await setState(ctx, { step: "name", next: "menu" });
        await send(ctx, "Напишіть нове імʼя.");
      } else if (a === "phone") {
        await setState(ctx, { step: "phone" });
        await send(ctx, "Надішліть номер кнопкою або напишіть його.", PHONE_KEYBOARD);
      }
      return;
    case "set": {
      const s = { ...ctx.client.settings };
      if (a === "rem") s.reminders = !s.reminders;
      else if (a === "promo") s.promo = !s.promo;
      else if (a === "news") s.news = !s.news;
      else if (a?.startsWith("b") && [0, 3, 7, 14].includes(Number(a.slice(1)))) s.remind_before_days = Number(a.slice(1));
      await updateClient(ctx.client.id, { settings: s });
      ctx.client.settings = s;
      await showSettings(ctx);
      return "Збережено";
    }
  }
}

async function showStatusAfterEdit(ctx: Ctx) {
  // A fresh message (the edited one now holds the confirmation).
  await showStatus({ ...ctx, editId: undefined });
}
