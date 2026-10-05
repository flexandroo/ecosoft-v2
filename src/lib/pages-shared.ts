// Information pages ("Сторінки"): types, the built-in content, icons and
// validation. Safe to import from client components. The defaults are the
// texts the pages had before the admin existed, so an empty or unreachable
// database changes nothing.

export const PAGE_KEYS = ["about", "delivery", "returns", "contacts", "privacy"] as const;
export type PageKey = (typeof PAGE_KEYS)[number];

export const PAGE_META: Record<PageKey, { label: string; path: string; layout: "wide" | "narrow" | "contacts" }> = {
  about: { label: "Про нас", path: "/about", layout: "wide" },
  delivery: { label: "Доставка і оплата", path: "/delivery", layout: "wide" },
  returns: { label: "Повернення та обмін", path: "/returns", layout: "wide" },
  contacts: { label: "Контакти", path: "/contacts", layout: "contacts" },
  privacy: { label: "Політика конфіденційності", path: "/privacy", layout: "narrow" },
};

export function isPageKey(value: string): value is PageKey {
  return (PAGE_KEYS as readonly string[]).includes(value);
}

/** Icon names offered for cards; rendered with lucide icons in page-sections.tsx. */
export const PAGE_ICONS = {
  Truck: "Вантажівка",
  MapPin: "Мітка на карті",
  Home: "Будинок",
  Building2: "Квартира / офіс",
  Landmark: "Банк",
  Wallet: "Гаманець",
  ShieldCheck: "Щит",
  Wrench: "Ключ",
  Settings: "Шестерня",
  Coffee: "Кава",
  Factory: "Виробництво",
  FlaskConical: "Колба",
  HelpCircle: "Питання",
  Headphones: "Навушники",
  Droplet: "Крапля",
  Award: "Нагорода",
  Phone: "Телефон",
  Clock: "Годинник",
  Package: "Посилка",
  CheckCircle2: "Галочка",
  Users: "Люди",
  Sparkles: "Блиск",
  Filter: "Фільтр",
  Gauge: "Манометр",
} as const;
export type PageIcon = keyof typeof PAGE_ICONS;

type Heading = { eyebrow: string; title: string; lead: string };
export type CardItem = { icon: PageIcon; title: string; text: string };
export type StepItem = { title: string; text: string };

export type PageSection =
  | (Heading & { type: "text"; body: string; boxed: boolean })
  | (Heading & { type: "cards"; layout: "stacked" | "inline"; columns: 2 | 3 | 4; items: CardItem[] })
  | (Heading & { type: "steps"; layout: "list" | "cards"; items: StepItem[] })
  | (Heading & { type: "notes"; items: string[] })
  | {
      type: "cta";
      layout: "note" | "banner";
      title: string;
      text: string;
      primaryLabel: string;
      primaryHref: string;
      secondaryLabel: string;
      secondaryHref: string;
    }
  | (Heading & { type: "requisites" })
  | { type: "contacts" };

export type SectionType = PageSection["type"];

export const SECTION_TYPES: Record<SectionType, { label: string; hint: string; system?: boolean }> = {
  text: { label: "Текст", hint: "Заголовок і текст з абзацами, підзаголовками й списками" },
  cards: { label: "Картки з іконками", hint: "2–4 колонки карток: іконка, заголовок, текст" },
  steps: { label: "Кроки", hint: "Нумерований список або картки 01, 02…" },
  notes: { label: "Короткі пункти", hint: "Сітка коротких тез у рамках" },
  cta: { label: "Заклик до дії", hint: "Текст і одна-дві кнопки" },
  requisites: { label: "Реквізити для оплати", hint: "Дані беруться з «Налаштувань»", system: true },
  contacts: { label: "Контакти і форма звернення", hint: "Телефони, email, адреса, графік з «Налаштувань» і форма", system: true },
};

export type SitePage = {
  title: string;
  subtitle: string;
  image: string;
  imageAlt: string;
  seoTitle: string;
  metaDescription: string;
  sections: PageSection[];
};

/** Placeholders replaced with values from «Налаштування». */
export const PAGE_TOKENS: { token: string; label: string }[] = [
  { token: "{телефони}", label: "усі телефони (посиланнями)" },
  { token: "{email}", label: "email" },
  { token: "{адреса}", label: "повна адреса" },
  { token: "{коротка-адреса}", label: "коротка адреса" },
  { token: "{графік}", label: "робочі дні й години" },
];

export const SECTION_LIMITS = { sections: 20, items: 12, text: 4000, short: 200, body: 20000 } as const;

const h = (title: string, eyebrow = "", lead = ""): Heading => ({ eyebrow, title, lead });

export const DEFAULT_PAGES: Record<PageKey, SitePage> = {
  about: {
    title: "Підбираємо надійні системи очищення води для дому та бізнесу",
    subtitle:
      "Допомагаємо обрати правильну систему очищення води, виконуємо монтаж і супроводжуємо її сервісно. Працюємо з обладнанням українського виробника Ecosoft, який розвиває напрямок водопідготовки з 1991 року.",
    image: "/images/page-headers/service-water-test-v2.png",
    imageAlt: "Фахівець перевіряє якість води",
    seoTitle: "Про нас",
    metaDescription:
      "Підбираємо надійні системи очищення води Ecosoft для дому, бізнесу та комерційних об'єктів. Допомагаємо обрати, встановити та обслуговувати рішення під вашу воду.",
    sections: [
      {
        type: "text",
        ...h("Партнер з підбору і сервісу систем Ecosoft", "Хто ми"),
        boxed: false,
        body:
          "Ми не виробник, а команда, яка щодня допомагає клієнтам обрати правильне обладнання для очищення води, привезти, встановити та обслуговувати його. Наш фокус — не великий каталог заради каталогу, а рішення, яке справді закриває проблему з водою у конкретному об’єкті.\n\n" +
          "Працюємо з обладнанням **Ecosoft** — українського виробника систем водопідготовки, заснованого **1991 року**. У них власне виробництво, сертифікація й сервісна мережа. Ми, своєю чергою, відповідаємо за грамотний підбір, монтаж під ключ і супровід після покупки.",
      },
      {
        type: "cards",
        ...h(
          "Шість типових сценаріїв",
          "Для кого ми працюємо",
          "Кожен об'єкт має свої умови — джерело води, об'єм споживання, задачі. Ми працюємо з усіма основними категоріями.",
        ),
        layout: "stacked",
        columns: 3,
        items: [
          { icon: "Building2", title: "Квартири", text: "Компактні системи під мийку для пиття, готування та щоденних побутових потреб." },
          { icon: "Home", title: "Приватні будинки", text: "Комплексне очищення на вході в будинок — захист сантехніки, бойлера й техніки." },
          { icon: "Settings", title: "Офіси", text: "Тиха фонова робота, стабільна вода для кави, чаю та кулерів у переговорних." },
          { icon: "Coffee", title: "Кав'ярні та ресторани", text: "Підготовка води під кавомашини, пароконвектомати й льодогенератори без сюрпризів." },
          { icon: "ShieldCheck", title: "Комерційні об'єкти", text: "Готелі, торгові центри, медичні заклади — рішення з обліковим режимом і сервісом." },
          { icon: "Factory", title: "Невеликі виробництва", text: "Технологічна вода для процесів, де якість і стабільні параметри критично важливі." },
        ],
      },
      {
        type: "cards",
        ...h("Чотири причини довіряти підбір саме нам", "Чому обирають нас"),
        layout: "stacked",
        columns: 4,
        items: [
          { icon: "FlaskConical", title: "Підбір під реальні умови", text: "Дивимось на ваш аналіз води, тип об'єкта і сценарій використання — не пропонуємо «універсальних» систем." },
          { icon: "ShieldCheck", title: "Перевірене обладнання Ecosoft", text: "Працюємо з оригінальними системами, мембранами та картриджами українського виробника з 1991 року." },
          { icon: "HelpCircle", title: "Просте пояснення без термінів", text: "Різниця між лінійками, навіщо мінералізатор, як змінювати картриджі — людською мовою." },
          { icon: "Headphones", title: "Підтримка після покупки", text: "Нагадуємо про регламент, виїжджаємо на сервіс, допомагаємо з оригінальними змінними елементами." },
        ],
      },
      {
        type: "steps",
        ...h("Чотири кроки від запиту до сервісу", "Наш підхід"),
        layout: "cards",
        items: [
          { title: "Аналізуємо задачу", text: "Тип об'єкта, джерело води, аналіз або опис проблеми — без цього не пропонуємо рішення." },
          { title: "Підбираємо рішення", text: "Конкретна модель або зв'язка систем під вашу воду, кількість людей і санвузлів." },
          { title: "Пояснюємо різницю", text: "Показуємо, чому саме ця конфігурація — і що вона дасть у щоденному використанні." },
          { title: "Підтримуємо після покупки", text: "Монтаж, налаштування, регламент і сервіс — щоб система працювала роками." },
        ],
      },
      {
        type: "cards",
        ...h("Якісна вода — це спокій, здоров'я і стабільність", "Що для нас важливо"),
        layout: "inline",
        columns: 2,
        items: [
          { icon: "ShieldCheck", title: "Комфорт у щоденному житті", text: "Смачна питна вода, відсутність накипу, м'якша шкіра після душу — речі, які помічаєш, коли вони перестають дратувати." },
          { icon: "Droplet", title: "Здоров'я родини", text: "Вода, у якій ви впевнені, — для пиття, готування й купання дітей." },
          { icon: "Settings", title: "Захист обладнання", text: "Бойлер, посудомийна, кавомашина, сантехніка — все це служить довше, коли вода підготовлена." },
          { icon: "Award", title: "Стабільність для бізнесу", text: "Передбачувана якість води — це передбачуваний смак напоїв, ресурс техніки та задоволені гості." },
        ],
      },
      {
        type: "cta",
        layout: "banner",
        title: "Не знаєте, яка система підійде саме вам?",
        text: "Залиште заявку — ми допоможемо підібрати рішення під вашу воду, бюджет і тип об’єкта.",
        primaryLabel: "Підібрати систему очищення води",
        primaryHref: "/contacts",
        secondaryLabel: "Переглянути каталог",
        secondaryHref: "/catalog",
      },
    ],
  },

  delivery: {
    title: "Доставка і оплата",
    subtitle: "Доставляємо обладнання для очищення води по Україні та допомагаємо організувати монтаж системи після покупки.",
    image: "/images/page-headers/service-water-test-v2.png",
    imageAlt: "Фахівець перевіряє якість води перед сервісним обслуговуванням",
    seoTitle: "Доставка і оплата",
    metaDescription:
      "Способи доставки та оплати замовлень систем очищення води: Нова Пошта, адресна доставка, власний транспорт, самовивіз. Реквізити для безготівкового розрахунку.",
    sections: [
      {
        type: "cards",
        ...h("Способи доставки", "Логістика"),
        layout: "stacked",
        columns: 2,
        items: [
          { icon: "Truck", title: "Нова Пошта", text: "Доставка у відділення, поштомат або адресна доставка кур'єром по Україні. Зазвичай 1–3 робочі дні, вартість — за тарифами перевізника залежно від ваги й габаритів. Перед відправленням менеджер підтверджує замовлення." },
          { icon: "MapPin", title: "Адресна доставка", text: "Для габаритного обладнання, комплексних систем, колонних фільтрів і замовлень під монтаж — узгоджується індивідуально з менеджером. Враховуємо тип, вагу, адресу й необхідність подальшого монтажу." },
          { icon: "Home", title: "Власна доставка", text: "Для Києва, Київської області та суміжних регіонів — доставка нашим транспортом. Дату й час погоджуємо після підтвердження замовлення." },
          { icon: "Building2", title: "Самовивіз", text: "{адреса}. {графік}. Перед самовивозом дочекайтеся підтвердження менеджера." },
        ],
      },
      {
        type: "text",
        ...h("Доставка обладнання під монтаж"),
        boxed: true,
        body:
          "Якщо ви замовляєте систему очищення води з монтажем, доставка може бути узгоджена разом із виїздом спеціаліста. У такому випадку менеджер уточнює:\n\n" +
          "- Адреса об'єкта та тип системи.\n- Умови підключення й наявність місця для монтажу.\n- Зручний день і час виконання робіт.\n\n" +
          "Для комплексних систем очищення води, колонних фільтрів, кабінетних пом’якшувачів і комерційного обладнання умови доставки й монтажу узгоджуємо індивідуально.",
      },
      {
        type: "cards",
        ...h(
          "Способи оплати",
          "Оплата",
          "Онлайн-оплата на сайті наразі не приймається. Після оформлення замовлення менеджер перевірить наявність, підтвердить суму та надішле рахунок.",
        ),
        layout: "stacked",
        columns: 2,
        items: [
          { icon: "Landmark", title: "Оплата за рахунком", text: "Після підтвердження замовлення менеджер надає рахунок із сумою та призначенням платежу. Оплата здійснюється банківським переказом за реквізитами ФОП." },
          { icon: "Wallet", title: "Передоплата після погодження", text: "Для обладнання під замовлення, комплексних систем і монтажних робіт розмір передоплати погоджуємо індивідуально до виставлення рахунку." },
        ],
      },
      {
        type: "notes",
        ...h("Важливо знати"),
        items: [
          "Замовлення обробляються після підтвердження менеджером.",
          "Терміни доставки залежать від наявності товару, регіону та способу.",
          "При отриманні перевірте цілісність пакування у присутності перевізника.",
          "Якщо пакування або товар пошкоджено — складіть акт із перевізником і зробіть фото.",
          "Для габаритного обладнання й систем під монтаж умови доставки погоджуємо окремо.",
          "Усі ціни на сайті — у гривнях.",
          "Доставка за межі України розраховується індивідуально.",
        ],
      },
      {
        type: "requisites",
        ...h(
          "Реквізити для оплати",
          "",
          "Використовуйте реквізити лише після підтвердження замовлення менеджером. Суму й призначення платежу беріть із наданого рахунку.",
        ),
      },
      {
        type: "cta",
        layout: "note",
        title: "",
        text: "Маєте складний випадок або потрібен монтаж за межами Київщини? Зв'яжіться з менеджером — підкажемо терміни й вартість для вашого регіону.",
        primaryLabel: "Зв'язатися з менеджером",
        primaryHref: "/contacts",
        secondaryLabel: "До каталогу",
        secondaryHref: "/catalog",
      },
    ],
  },

  returns: {
    title: "Повернення та обмін",
    subtitle: "Умови повернення, обміну та дій у гарантійних випадках.",
    image: "/images/page-headers/service-water-test-v2.png",
    imageAlt: "Фахівець перевіряє якість води",
    seoTitle: "Повернення та обмін",
    metaDescription:
      "Умови повернення та обміну товарів Ecosoft: терміни, процедура, гарантійні випадки, як діяти при пошкодженні товару.",
    sections: [
      {
        type: "cards",
        ...h("Коли можна повернути або обміняти товар"),
        layout: "stacked",
        columns: 3,
        items: [
          { icon: "ShieldCheck", title: "Товар не підійшов", text: "Можете повернути впродовж 14 днів від моменту отримання, якщо товар не був у використанні та збережено товарний вигляд, пломби й оригінальну упаковку." },
          { icon: "Wrench", title: "Гарантійний випадок", text: "Якщо обладнання вийшло з ладу у межах гарантійного терміну — заміна, ремонт або повернення коштів за рішенням сервісного центру Ecosoft." },
          { icon: "Truck", title: "Товар пошкоджений під час доставки", text: "Зафіксуйте пошкодження у присутності кур'єра або у відділенні Нової пошти, надішліть фото менеджеру — заміну надсилаємо без додаткової оплати." },
        ],
      },
      {
        type: "steps",
        ...h("Процедура повернення"),
        layout: "list",
        items: [
          { title: "", text: "Зв'яжіться з менеджером за телефонами {телефони} чи поштою {email}." },
          { title: "", text: "Надайте номер замовлення та коротко опишіть причину повернення." },
          { title: "", text: "Узгодьте з менеджером спосіб повернення (Нова пошта, кур'єр або самовивіз)." },
          { title: "", text: "Передайте товар у комплектації, отриманій від нас, разом з документами." },
          { title: "", text: "Дочекайтеся перевірки технічного стану — зазвичай це 1–3 робочих дні." },
          { title: "", text: "Кошти повертаємо тим самим способом, яким була здійснена оплата." },
        ],
      },
      {
        type: "text",
        ...h("Що повернути не вийде"),
        boxed: true,
        body:
          "Згідно з постановою КМУ № 172 (товари належної якості, які не підлягають обміну), не приймаємо назад:\n\n" +
          "- Використане обладнання з порушеною герметичністю або картриджі без оригінальної упаковки.\n- Засипки й реагенти у відкритих мішках.\n- Товари, виготовлені або сконфігуровані під індивідуальний об'єкт.\n\n" +
          "Якщо сумніваєтеся, чи підійде вам конкретна система, краще обговорити це з консультантом до оформлення замовлення.",
      },
      {
        type: "cta",
        layout: "note",
        title: "",
        text: "Не впевнені, що товар вам підходить? Розкажіть про вашу воду й тип житла — менеджер допоможе обрати правильно з першого разу.",
        primaryLabel: "Проконсультуватися перед замовленням",
        primaryHref: "/contacts",
        secondaryLabel: "Умови доставки",
        secondaryHref: "/delivery",
      },
    ],
  },

  contacts: {
    title: "Контакти",
    subtitle: "Зателефонуйте, напишіть або залиште звернення — допоможемо підібрати систему очищення води під ваш обʼєкт.",
    image: "/images/page-headers/contacts-consultation-v2.png",
    imageAlt: "Консультація з підбору системи очищення води",
    seoTitle: "Контакти",
    metaDescription:
      "Звʼяжіться з Ecosoft: телефон, email, адреса та графік роботи. Залиште звернення — підберемо рішення під вашу воду.",
    sections: [{ type: "contacts" }],
  },

  privacy: {
    title: "Політика конфіденційності",
    subtitle: "Пояснюємо, які дані отримуємо через сайт і як використовуємо їх для обробки звернень та замовлень.",
    image: "",
    imageAlt: "",
    seoTitle: "Політика конфіденційності",
    metaDescription: "Як партнерський магазин Ecosoft обробляє дані відвідувачів і покупців.",
    sections: [
      { type: "text", ...h(""), boxed: false, body: "Оновлено 13 серпня 2026 року." },
      { type: "text", ...h("Які дані ми отримуємо"), boxed: false, body: "Імʼя, номер телефону, email, адресу або відділення доставки, коментар до замовлення та відомості про обрані товари. Технічні засоби аналітики можуть також отримувати тип пристрою, сторінки переходу та події взаємодії із сайтом." },
      { type: "text", ...h("Навіщо використовуємо дані"), boxed: false, body: "Щоб відповісти на звернення, підібрати обладнання, підтвердити й виконати замовлення, організувати доставку, монтаж і сервіс, а також вимірювати роботу сайту та рекламних кампаній." },
      { type: "text", ...h("Кому можуть передаватися дані"), boxed: false, body: "Продавцю, зазначеному в підтвердженні або рахунку, працівникам і підрядникам, які обробляють звернення, перевізникам та сервісним партнерам у межах, потрібних для виконання замовлення. Дані не продаються третім особам." },
      { type: "text", ...h("Зберігання та захист"), boxed: false, body: "Зберігаємо дані лише стільки, скільки потрібно для обробки звернення, виконання зобовʼязань і дотримання вимог обліку. Доступ обмежується особами, яким він потрібен для роботи із замовленням." },
      { type: "text", ...h("Ваші права"), boxed: false, body: "Ви можете попросити уточнити, виправити або видалити надані дані, а також відкликати згоду на подальший звʼязок, якщо зберігання не потрібне для виконання замовлення чи вимог законодавства." },
      {
        type: "text",
        ...h("Звернення щодо персональних даних"),
        boxed: true,
        body:
          "Зателефонуйте за номером {телефони} або скористайтеся формою на сторінці контактів. Актуальний продавець і платіжні реквізити зазначаються під час підтвердження замовлення.",
      },
    ],
  },
};

/** Sections every page must keep (they carry data from the settings or the contact form). */
export function requiredSections(key: PageKey): SectionType[] {
  return DEFAULT_PAGES[key].sections.filter((s) => SECTION_TYPES[s.type].system).map((s) => s.type);
}

export function isValidHref(href: string): boolean {
  return /^\/(?!\/)\S*$/.test(href) || /^https:\/\/\S+$/.test(href) || /^(tel|mailto):\S+$/.test(href);
}

// ---------------------------------------------------------------------------
// Parsing stored / submitted JSON
// ---------------------------------------------------------------------------

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const oneOf = <T extends string | number>(v: unknown, list: readonly T[], fallback: T): T =>
  list.includes(v as T) ? (v as T) : fallback;

function heading(v: Record<string, unknown>): Heading {
  return { eyebrow: str(v.eyebrow, 80), title: str(v.title, SECTION_LIMITS.short), lead: str(v.lead, 600) };
}

function toSection(raw: unknown): PageSection | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Record<string, unknown>;
  const items = (Array.isArray(v.items) ? v.items : []).slice(0, SECTION_LIMITS.items) as unknown[];
  const obj = (x: unknown) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {});
  switch (v.type) {
    case "text":
      return { type: "text", ...heading(v), boxed: v.boxed === true, body: str(v.body, SECTION_LIMITS.body) };
    case "cards":
      return {
        type: "cards",
        ...heading(v),
        layout: oneOf(v.layout, ["stacked", "inline"] as const, "stacked"),
        columns: oneOf(v.columns, [2, 3, 4] as const, 2),
        items: items
          .map(obj)
          .map((x) => ({
            icon: oneOf(x.icon, Object.keys(PAGE_ICONS) as PageIcon[], "CheckCircle2"),
            title: str(x.title, SECTION_LIMITS.short),
            text: str(x.text, SECTION_LIMITS.text),
          }))
          .filter((x) => x.title || x.text),
      };
    case "steps":
      return {
        type: "steps",
        ...heading(v),
        layout: oneOf(v.layout, ["list", "cards"] as const, "list"),
        items: items
          .map(obj)
          .map((x) => ({ title: str(x.title, SECTION_LIMITS.short), text: str(x.text, SECTION_LIMITS.text) }))
          .filter((x) => x.title || x.text),
      };
    case "notes":
      return { type: "notes", ...heading(v), items: items.map((x) => str(x, 600)).filter(Boolean) };
    case "cta":
      return {
        type: "cta",
        layout: oneOf(v.layout, ["note", "banner"] as const, "note"),
        title: str(v.title, SECTION_LIMITS.short),
        text: str(v.text, 1000),
        primaryLabel: str(v.primaryLabel, 80),
        primaryHref: str(v.primaryHref, 300),
        secondaryLabel: str(v.secondaryLabel, 80),
        secondaryHref: str(v.secondaryHref, 300),
      };
    case "requisites":
      return { type: "requisites", ...heading(v) };
    case "contacts":
      return { type: "contacts" };
    default:
      return null;
  }
}

function toPage(key: PageKey, raw: Record<string, unknown>): SitePage {
  const d = DEFAULT_PAGES[key];
  return {
    title: str(raw.title, SECTION_LIMITS.short) || d.title,
    subtitle: str(raw.subtitle, 600),
    image: str(raw.image, 1000),
    imageAlt: str(raw.imageAlt, 200),
    seoTitle: str(raw.seoTitle, 120),
    metaDescription: str(raw.metaDescription, 300),
    sections: (Array.isArray(raw.sections) ? raw.sections : [])
      .slice(0, SECTION_LIMITS.sections)
      .map(toSection)
      .filter((s): s is PageSection => s !== null),
  };
}

/** Stored row over the built-in page (lenient: broken sections are dropped, required ones restored). */
export function mergePage(key: PageKey, stored: unknown): SitePage {
  if (!stored || typeof stored !== "object") return DEFAULT_PAGES[key];
  const page = toPage(key, stored as Record<string, unknown>);
  for (const type of requiredSections(key)) {
    if (!page.sections.some((s) => s.type === type)) {
      page.sections.push(DEFAULT_PAGES[key].sections.find((s) => s.type === type)!);
    }
  }
  return page;
}

/** Strict check of the admin form payload. */
export function validatePage(key: PageKey, input: unknown): { page: SitePage } | { error: string } {
  if (!input || typeof input !== "object") return { error: "Некоректні дані форми." };
  const raw = input as Record<string, unknown>;
  if (!str(raw.title, SECTION_LIMITS.short)) return { error: "Вкажіть заголовок сторінки." };
  if (Array.isArray(raw.sections) && raw.sections.length > SECTION_LIMITS.sections) {
    return { error: `На сторінці може бути до ${SECTION_LIMITS.sections} секцій.` };
  }
  const page = toPage(key, raw);
  for (const type of requiredSections(key)) {
    if (!page.sections.some((s) => s.type === type)) return { error: `Секція «${SECTION_TYPES[type].label}» обовʼязкова.` };
  }
  if (page.image && !page.image.startsWith("/") && !page.image.startsWith("https://")) {
    return { error: "Фото шапки має бути з медіатеки або з сайту." };
  }
  for (const [i, s] of page.sections.entries()) {
    const where = `Секція ${i + 1} (${SECTION_TYPES[s.type].label})`;
    if (s.type === "text" && !s.title && !s.body) return { error: `${where}: порожня.` };
    if ((s.type === "cards" || s.type === "steps" || s.type === "notes") && !s.items.length) return { error: `${where}: додайте хоча б один пункт.` };
    if (s.type === "cards" && s.items.some((x) => !x.title)) return { error: `${where}: у кожної картки має бути заголовок.` };
    if (s.type === "cta") {
      if (!s.text && !s.title) return { error: `${where}: додайте текст.` };
      if (!s.primaryLabel || !isValidHref(s.primaryHref)) return { error: `${where}: вкажіть текст і посилання головної кнопки (/сторінка або https://…).` };
      if (s.secondaryLabel && !isValidHref(s.secondaryHref)) return { error: `${where}: перевірте посилання другої кнопки.` };
    }
  }
  return { page };
}

// ---------------------------------------------------------------------------
// Inline text: placeholders, **bold** and [links](/path)
// ---------------------------------------------------------------------------

export type InlinePart = { text: string; bold?: boolean; href?: string };

/** Splits "**bold** and [link](/path)" into parts; unknown syntax stays as text. */
export function parseInline(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index) });
    if (m[1] !== undefined) parts.push({ text: m[1], bold: true });
    else if (isValidHref(m[3])) parts.push({ text: m[2], href: m[3] });
    else parts.push({ text: m[0] });
    last = re.lastIndex;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
