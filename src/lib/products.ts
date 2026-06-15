export type CategoryKey =
  | "osmos"
  | "softeners"
  | "filters"
  | "cartridges"
  | "industrial";

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
