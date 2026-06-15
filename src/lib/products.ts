export type CategoryKey =
  | "osmos"
  | "softeners"
  | "filters"
  | "cartridges"
  | "industrial";

export type HighlightIcon =
  | "shield"
  | "sparkles"
  | "wrench"
  | "leaf"
  | "gauge"
  | "box"
  | "clock"
  | "award"
  | "zap";

export type ProductDetails = {
  audience?: string[];
  highlights?: { icon: HighlightIcon; title: string; desc: string }[];
  specs?: { label: string; value: string }[];
  removes?: { name: string; pct?: string }[];
  bundle?: string[];
  maintenance?: { period: string; cost?: string; description: string };
  installation?: {
    time: string;
    complexity: "easy" | "medium" | "pro";
    description: string;
  };
  documents?: { name: string; href: string; size?: string }[];
  longDescription?: string;
};

export type Product = {
  slug: string;
  name: string;
  category: CategoryKey;
  price: number;
  oldPrice?: number;
  capacityLpd?: number;
  stages?: number;
  features?: string[];
  inStock: boolean;
  ctaType: "buy" | "request";
  description: string;
  details?: ProductDetails;
};

export const CATEGORIES: { key: CategoryKey; title: string; short: string }[] = [
  { key: "osmos", title: "Зворотний осмос", short: "Осмос" },
  { key: "softeners", title: "Помʼякшувачі води", short: "Помʼякшувачі" },
  { key: "filters", title: "Магістральні фільтри", short: "Фільтри" },
  { key: "cartridges", title: "Картриджі", short: "Картриджі" },
  { key: "industrial", title: "Промислові системи", short: "Промислові" },
];

export const PRODUCTS: Product[] = [
  // Зворотний осмос
  {
    slug: "ecosoft-cross-90-balance",
    name: "Ecosoft CROSS 90 BALANCE",
    category: "osmos",
    price: 19990,
    oldPrice: 22500,
    capacityLpd: 340,
    stages: 3,
    features: [
      "Direct-flow без бака",
      "3 швидкозʼємні картриджі",
      "LED-індикація стану",
      "Окремий хромований кран",
    ],
    inStock: true,
    ctaType: "request",
    description:
      "Компактна direct-flow система зворотного осмосу зі швидкою заміною картриджів і збалансованим мінеральним складом води.",
    details: {
      audience: [
        "Квартира або будинок 2-4 особи",
        "Тиск води у мережі від 3 бар",
        "Малий простір під мийкою",
        "Хто хоче замінювати картриджі сам",
      ],
      highlights: [
        {
          icon: "zap",
          title: "Без бака",
          desc: "Direct-flow — свіжа вода одразу, не застоюється у накопичувачі.",
        },
        {
          icon: "wrench",
          title: "Заміна за 30 секунд",
          desc: "Картриджі повертанням на чверть оберту, без перекриття води.",
        },
        {
          icon: "leaf",
          title: "Збалансований мінсклад",
          desc: "Селективна мембрана зберігає корисні Ca²⁺ та Mg²⁺.",
        },
        {
          icon: "gauge",
          title: "LED-індикація",
          desc: "Показує, коли пора міняти кожен з 3 картриджів.",
        },
      ],
      specs: [
        { label: "Продуктивність", value: "340 л/добу (90 GPD)" },
        { label: "Ступенів очищення", value: "3" },
        { label: "Тип системи", value: "Direct-flow, без бака" },
        { label: "Робочий тиск", value: "3-8 бар" },
        { label: "Температура води", value: "+4…+38 °C" },
        { label: "Розміри (Ш×В×Г)", value: "420×400×140 мм" },
        { label: "Підʼєднання", value: "1/4\" швидкозʼємне" },
        { label: "Гарантія", value: "3 роки" },
      ],
      removes: [
        { name: "Хлор та похідні", pct: "99%" },
        { name: "Важкі метали", pct: "98%" },
        { name: "Нітрати та нітрити", pct: "97%" },
        { name: "Вірусний фон", pct: "99.9%" },
        { name: "Бактерії", pct: "99.9%" },
        { name: "Солі жорсткості", pct: "95%" },
        { name: "Пестициди", pct: "97%" },
        { name: "Запах і присмак", pct: "100%" },
      ],
      bundle: [
        "Корпус системи з 3 встановленими картриджами",
        "Хромований кран чистої води",
        "Зливний хомут для каналізації",
        "Адаптер під вхідну воду 1/2\"",
        "Комплект трубок 1/4\"",
        "Інструкція + паспорт",
      ],
      maintenance: {
        period: "Раз на 6-12 місяців",
        cost: "від 1 400 ₴",
        description:
          "Заміна 3 картриджів. LED-індикатор підкаже коли пора. Сервісний кит у замовленні.",
      },
      installation: {
        time: "60-90 хвилин",
        complexity: "medium",
        description:
          "Безкоштовний монтаж нашими сертифікованими інженерами по Україні. Самостійний монтаж також можливий за інструкцією.",
      },
      documents: [
        { name: "Паспорт виробу (PDF)", href: "#", size: "1.2 MB" },
        { name: "Сертифікат відповідності", href: "#", size: "640 KB" },
        { name: "Інструкція з монтажу", href: "#", size: "2.4 MB" },
        { name: "Висновок СЕС", href: "#", size: "320 KB" },
      ],
      longDescription:
        "Ecosoft CROSS 90 BALANCE — нове покоління компактних систем зворотного осмосу для дому. Замість громіздкого бака використовується технологія direct-flow з помпою, яка постачає чисту воду одразу. Завдяки селективній мембрані з мінералізуючим шаром у воді зберігаються корисні кальцій і магній, тому вода має збалансований мінеральний склад і приємний смак. Три швидкозʼємні картриджі (RO, MCB, CF) міняються за 30 секунд без інструмента. LED-панель показує стан кожного картриджа, тож ви точно знаєте, коли потрібна заміна. Корпус займає у 2 рази менше місця під мийкою порівняно з традиційними осмосами з баком.",
    },
  },
  {
    slug: "ecosoft-standard-5-50",
    name: "Ecosoft Standard 5-50",
    category: "osmos",
    price: 7990,
    capacityLpd: 190,
    stages: 5,
    features: ["Базова комплектація", "Кран на мийку", "Накопичувальний бак 8 л"],
    inStock: true,
    ctaType: "request",
    description: "5-ступенева система зворотного осмосу для квартири.",
  },
  {
    slug: "ecosoft-absolute-6-50-p",
    name: "Ecosoft Absolute 6-50 P",
    category: "osmos",
    price: 12500,
    oldPrice: 13900,
    capacityLpd: 280,
    stages: 6,
    features: ["Помпа підвищення тиску", "Мінералізатор", "Контейнер 12 л"],
    inStock: true,
    ctaType: "request",
    description: "6-ступенева система з помпою — для слабкого тиску.",
  },
  {
    slug: "purepro-quick-7-100",
    name: "P'urePRO Quick 7-100",
    category: "osmos",
    price: 18900,
    capacityLpd: 285,
    stages: 7,
    features: ["Картриджі швидкозʼємні", "Біокерамічний фільтр", "Бак 11 л"],
    inStock: true,
    ctaType: "request",
    description: "7-ступенева система зі швидкою заміною картриджів.",
  },
  {
    slug: "ecosoft-premium-7-100",
    name: "Ecosoft Premium 7-100",
    category: "osmos",
    price: 21500,
    capacityLpd: 380,
    stages: 7,
    features: ["Мінералізатор", "Помпа", "Електронний контроль"],
    inStock: true,
    ctaType: "request",
    description: "Преміум-система зі смарт-моніторингом ресурсу.",
  },
  {
    slug: "ecosoft-robust-1500",
    name: "Ecosoft Robust 1500",
    category: "osmos",
    price: 24900,
    capacityLpd: 1500,
    stages: 6,
    features: ["Прямоточна", "Без накопичувального бака", "1500 л/добу"],
    inStock: false,
    ctaType: "request",
    description: "Прямоточна система для великих сімей та офісів.",
  },

  // Помʼякшувачі
  {
    slug: "ecosoft-fu-0844-ce",
    name: "Ecosoft FU 0844 CE",
    category: "softeners",
    price: 16990,
    features: ["0.8 куб.м/год", "Клапан Clack", "Балон 8\"×44\""],
    inStock: true,
    ctaType: "request",
    description: "Помʼякшувач для квартири / невеликого будинку.",
  },
  {
    slug: "ecosoft-fu-1054-ce",
    name: "Ecosoft FU 1054 CE",
    category: "softeners",
    price: 22500,
    features: ["1.2 куб.м/год", "Електронний клапан", "Балон 10\"×54\""],
    inStock: true,
    ctaType: "request",
    description: "Помʼякшувач для дому 4-6 осіб.",
  },
  {
    slug: "ecosoft-fk-1054-twin",
    name: "Ecosoft FK 1054 CE Twin",
    category: "softeners",
    price: 35990,
    features: ["2.0 куб.м/год", "Двоколонний", "Безперервна робота 24/7"],
    inStock: true,
    ctaType: "request",
    description: "Двоколонна система — без переривання на регенерацію.",
  },
  {
    slug: "ecosoft-compact-mo",
    name: "Ecosoft Compact MO",
    category: "softeners",
    price: 12500,
    features: ["Компактний 60×30 см", "Для квартири", "0.6 куб.м/год"],
    inStock: true,
    ctaType: "request",
    description: "Компактне рішення для квартири.",
  },

  // Магістральні фільтри
  {
    slug: "ecosoft-fpv-10",
    name: "Ecosoft FPV 10",
    category: "filters",
    price: 3800,
    features: ["10\" Slim Line", "Поліпропілен", "Пром. виробництва"],
    inStock: true,
    ctaType: "buy",
    description: "Фільтр механічного очищення 10 дюймів.",
  },
  {
    slug: "ecosoft-fpv-20-bb",
    name: "Ecosoft FPV 20 BB",
    category: "filters",
    price: 5990,
    features: ["20\" Big Blue", "Висока продуктивність", "Прозора колба"],
    inStock: true,
    ctaType: "buy",
    description: "Big Blue 20\" для високого витрачання води.",
  },
  {
    slug: "ecosoft-whirl-fpv-1054",
    name: "Ecosoft Whirl FPV 1054",
    category: "filters",
    price: 8990,
    features: ["Піщаний фільтр", "Автоматичне промивання", "Балон 10\"×54\""],
    inStock: false,
    ctaType: "request",
    description: "Засипний піщаний фільтр з автопромиванням.",
  },

  // Картриджі
  {
    slug: "ecosoft-cpv-5-1052",
    name: "Ecosoft CPV-5-1052",
    category: "cartridges",
    price: 250,
    features: ["Поліпропілен", "5 мкм", "10\" Slim Line"],
    inStock: true,
    ctaType: "buy",
    description: "Картридж механічного очищення 5 мкм.",
  },
  {
    slug: "ecosoft-chv-4-2520",
    name: "Ecosoft CHV-4-2520",
    category: "cartridges",
    price: 580,
    features: ["Активоване вугілля", "10\" Slim Line", "Для смаку та запаху"],
    inStock: true,
    ctaType: "buy",
    description: "Вугільний картридж для покращення смаку.",
  },
  {
    slug: "ecosoft-membrane-ro-50-gpd",
    name: "Ecosoft Membrane RO 50 GPD",
    category: "cartridges",
    price: 1290,
    features: ["50 GPD", "Сумісність з більшістю осмосів", "TFC мембрана"],
    inStock: true,
    ctaType: "buy",
    description: "Мембрана зворотного осмосу 50 GPD.",
  },
  {
    slug: "ecosoft-mineralizer",
    name: "Ecosoft Mineralizer",
    category: "cartridges",
    price: 890,
    features: ["Збагачення мінералами", "Для осмосів", "Tref-картридж"],
    inStock: true,
    ctaType: "buy",
    description: "Мінералізатор для систем зворотного осмосу.",
  },
  {
    slug: "ecosoft-kit-3stage",
    name: "Ecosoft Service Kit 3-stage",
    category: "cartridges",
    price: 1450,
    oldPrice: 1690,
    features: ["Комплект 3 картриджі", "Поліпропілен + Carbon Block + GAC", "На рік"],
    inStock: true,
    ctaType: "buy",
    description: "Річний комплект змінних елементів для проточних систем.",
  },

  // Промислові
  {
    slug: "ecosoft-mo-6-industrial",
    name: "Ecosoft MO 6 Industrial",
    category: "industrial",
    price: 89000,
    capacityLpd: 6000,
    stages: 6,
    features: ["6 м³/добу", "Промислова мембрана", "Контролер автоматики"],
    inStock: true,
    ctaType: "request",
    description: "Промислова система зворотного осмосу 6 м³/добу.",
  },
  {
    slug: "ecosoft-mo-24-industrial",
    name: "Ecosoft MO 24 Industrial",
    category: "industrial",
    price: 285000,
    capacityLpd: 24000,
    stages: 6,
    features: ["24 м³/добу", "Промислова мембрана", "PLC-керування"],
    inStock: false,
    ctaType: "request",
    description: "Висока продуктивність для виробництва та готелів.",
  },
  {
    slug: "ecosoft-whirl-pro-2872",
    name: "Ecosoft Whirl Pro 2872",
    category: "industrial",
    price: 165000,
    features: ["28\"×72\"", "Промисловий помʼякшувач", "Електронний клапан"],
    inStock: true,
    ctaType: "request",
    description: "Промисловий помʼякшувач для готелів і виробництв.",
  },
];

export function findCategory(key: string | undefined): (typeof CATEGORIES)[number] | undefined {
  return CATEGORIES.find((c) => c.key === key);
}

export function productsByCategory(key: CategoryKey): Product[] {
  return PRODUCTS.filter((p) => p.category === key);
}

export function findProduct(category: string, slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.category === category && p.slug === slug);
}

export function relatedProducts(p: Product, limit = 4): Product[] {
  return PRODUCTS.filter((x) => x.category === p.category && x.slug !== p.slug)
    .sort((a, b) => Math.abs(a.price - p.price) - Math.abs(b.price - p.price))
    .slice(0, limit);
}
