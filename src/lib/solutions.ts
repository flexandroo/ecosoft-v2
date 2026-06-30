import type { CategoryKey } from "@/lib/products";

export type Solution = {
  slug: string;
  title: string; // H1
  seoTitle: string;
  seoDescription: string;
  intro: string;
  audience: string[];
  // "Які рішення підходять" — links into the catalog.
  solutions: { label: string; href: string }[];
  // Recommended products to render (pulled from the catalog).
  recommend: { category: CategoryKey; query?: string };
  // Internal links to relevant catalog categories.
  links: { label: string; href: string }[];
};

export const SOLUTIONS: Solution[] = [
  {
    slug: "filtr-dlya-kvartyry",
    title: "Фільтр для води у квартиру",
    seoTitle: "Фільтр для води у квартиру — підбір та монтаж",
    seoDescription:
      "Підбір фільтра для квартири: зворотний осмос для питної води та магістральний захист сантехніки й техніки. Консультація та монтаж під ключ.",
    intro:
      "Для квартири найчастіше обирають системи зворотного осмосу для питної води та магістральні фільтри для захисту сантехніки й техніки.",
    audience: [
      "для кухні та питної води",
      "для родин з дітьми",
      "для захисту бойлера, пральної та посудомийної машини",
      "де важливий компактний розмір під мийкою",
    ],
    solutions: [
      { label: "Зворотний осмос", href: "/catalog/reverse-osmosis" },
      { label: "Проточні фільтри", href: "/catalog/flow-filters" },
      { label: "Магістральні фільтри", href: "/catalog/mainline-filters" },
    ],
    recommend: { category: "reverse-osmosis" },
    links: [
      { label: "Зворотний осмос", href: "/catalog/reverse-osmosis" },
      { label: "Магістральні фільтри", href: "/catalog/mainline-filters" },
    ],
  },
  {
    slug: "filtr-dlya-budynku",
    title: "Фільтр для води в приватний будинок",
    seoTitle: "Фільтр для води в приватний будинок — комплексні рішення",
    seoDescription:
      "Комплексна очистка води для приватного будинку: помʼякшення, знезалізнення, механічне очищення та питна вода. Підбір під аналіз води.",
    intro:
      "Для приватного будинку зазвичай потрібна комплексна очистка: помʼякшення, знезалізнення та механічне очищення, а також окреме рішення для питної води.",
    audience: [
      "для будинків з власною свердловиною або міською водою",
      "де є проблеми з жорсткістю чи залізом",
      "для захисту всієї сантехніки та техніки",
      "коли потрібна і технічна, і питна вода",
    ],
    solutions: [
      { label: "Фільтраційні системи", href: "/catalog/filtration-systems" },
      { label: "Магістральні фільтри", href: "/catalog/mainline-filters" },
      { label: "Зворотний осмос", href: "/catalog/reverse-osmosis" },
    ],
    recommend: { category: "filtration-systems" },
    links: [
      { label: "Фільтраційні системи", href: "/catalog/filtration-systems" },
      { label: "Магістральні фільтри", href: "/catalog/mainline-filters" },
    ],
  },
  {
    slug: "voda-zi-sverdlovyny",
    title: "Очищення води зі свердловини",
    seoTitle: "Очищення води зі свердловини — комплексні системи",
    seoDescription:
      "Очищення води зі свердловини: видалення заліза, жорсткості та сірководню. Підбір комплексних систем після аналізу води.",
    intro:
      "Вода зі свердловини майже завжди потребує комплексної очистки. Точний набір систем визначають за аналізом води — частими проблемами є залізо, жорсткість і сірководень.",
    audience: [
      "для будинків і котеджів зі свердловиною",
      "де вода має залізо, жорсткість або запах сірководню",
      "коли потрібна підготовка води перед використанням у будинку",
    ],
    solutions: [
      { label: "Комплексні системи", href: "/catalog/filtration-systems" },
      { label: "Системи знезалізнення", href: "/catalog/filtration-systems?q=залізо" },
      { label: "Помʼякшення води", href: "/catalog/filtration-systems?q=пом'якшення" },
    ],
    recommend: { category: "filtration-systems" },
    links: [
      { label: "Фільтраційні системи", href: "/catalog/filtration-systems" },
      { label: "Матеріали та засипки", href: "/catalog/filter-media" },
    ],
  },
  {
    slug: "filtr-vid-zaliza",
    title: "Фільтр від заліза у воді",
    seoTitle: "Фільтр від заліза у воді — системи знезалізнення",
    seoDescription:
      "Системи знезалізнення води: прибирають жовтий наліт, металевий присмак і плями на сантехніці. Підбір під показники вашої води.",
    intro:
      "Залізо у воді дає жовтий наліт, металевий присмак і плями на сантехніці. Його прибирають системи знезалізнення, часто разом із помʼякшенням.",
    audience: [
      "для свердловинної води з підвищеним залізом",
      "коли є плями на сантехніці та білизні",
      "для будинків і котеджів",
    ],
    solutions: [
      { label: "Системи знезалізнення", href: "/catalog/filtration-systems?q=залізо" },
      { label: "Фільтруючі матеріали", href: "/catalog/filter-media" },
    ],
    recommend: { category: "filtration-systems", query: "залізо" },
    links: [
      { label: "Фільтраційні системи", href: "/catalog/filtration-systems" },
      { label: "Матеріали та засипки", href: "/catalog/filter-media" },
    ],
  },
  {
    slug: "filtr-vid-nakypu",
    title: "Фільтр від накипу",
    seoTitle: "Фільтр від накипу — захист техніки та сантехніки",
    seoDescription:
      "Фільтри від накипу та помʼякшення води: менше накипу в бойлері, котлі, пральній та посудомийній машині. Магістральний захист на вході води.",
    intro:
      "Накип утворюється через жорстку воду. Щоб захистити техніку, на вході води встановлюють фільтри від накипу та магістральні фільтри, а за потреби — систему помʼякшення.",
    audience: [
      "для захисту бойлера, котла та нагрівальних приладів",
      "для пральної та посудомийної машини",
      "де вода жорстка і швидко утворюється накип",
    ],
    solutions: [
      { label: "Магістральні фільтри", href: "/catalog/mainline-filters" },
      { label: "Помʼякшення води", href: "/catalog/filtration-systems?q=пом'якшення" },
    ],
    recommend: { category: "mainline-filters" },
    links: [
      { label: "Магістральні фільтри", href: "/catalog/mainline-filters" },
      { label: "Фільтраційні системи", href: "/catalog/filtration-systems" },
    ],
  },
  {
    slug: "pomyakshuvach-vody",
    title: "Помʼякшувач води для будинку",
    seoTitle: "Помʼякшувач води для будинку — кабінетні та колонні системи",
    seoDescription:
      "Помʼякшувачі води для будинку та квартири: кабінетні та колонні системи. Менше накипу, мʼякша вода для побуту й техніки.",
    intro:
      "Помʼякшувач води знижує жорсткість по всьому будинку. Залежно від обʼєму споживання обирають компактні кабінетні або колонні системи помʼякшення.",
    audience: [
      "для будинків і квартир з жорсткою водою",
      "коли багато накипу та білого нальоту",
      "для комфортної води у побуті",
    ],
    solutions: [
      { label: "Системи помʼякшення", href: "/catalog/filtration-systems?q=пом'якшення" },
      { label: "Таблетована сіль і смоли", href: "/catalog/filter-media" },
    ],
    recommend: { category: "filtration-systems", query: "пом'якшення" },
    links: [
      { label: "Фільтраційні системи", href: "/catalog/filtration-systems" },
      { label: "Матеріали та засипки", href: "/catalog/filter-media" },
    ],
  },
  {
    slug: "osmos-z-mineralizatorom",
    title: "Зворотний осмос з мінералізатором",
    seoTitle: "Зворотний осмос з мінералізатором — смачна питна вода",
    seoDescription:
      "Системи зворотного осмосу з мінералізатором: чиста й збалансована питна вода. Лінійки PURE, AquaCalcium та Balance.",
    intro:
      "Зворотний осмос з мінералізатором поєднує глибоке очищення з комфортним смаком води — мінералізатор збагачує воду після очищення. Це лінійки PURE, AquaCalcium та Balance.",
    audience: [
      "хто хоче чисту, але не «порожню» воду",
      "для родин з дітьми",
      "для щоденного пиття та приготування їжі",
    ],
    solutions: [
      { label: "Осмос з мінералізацією", href: "/catalog/reverse-osmosis?q=мінераліз" },
      { label: "Усі системи осмосу", href: "/catalog/reverse-osmosis" },
    ],
    recommend: { category: "reverse-osmosis", query: "мінераліз" },
    links: [
      { label: "Зворотний осмос", href: "/catalog/reverse-osmosis" },
      { label: "Картриджі для осмосу", href: "/catalog/ro-cartridges" },
    ],
  },
  {
    slug: "filtr-dlya-kavyarni",
    title: "Фільтр для води для кавʼярні",
    seoTitle: "Фільтр для води для кавʼярні та HoReCa",
    seoDescription:
      "Системи водопідготовки для кавʼярень, ресторанів і готелів: стабільна якість води для кави та техніки. Лінійка Ecosoft RObust.",
    intro:
      "Для кавʼярні та ресторану важлива стабільна якість води — від неї залежить смак кави та ресурс техніки. Для бізнесу використовують продуктивні системи лінійки RObust.",
    audience: [
      "для кавʼярень, ресторанів і готелів",
      "для кавомашин, пароконвектоматів і льодогенераторів",
      "де потрібна стабільна якість і продуктивність",
    ],
    solutions: [
      { label: "Системи для бізнесу (HoReCa)", href: "/catalog/horeca" },
      { label: "Фільтри для кави", href: "/catalog/horeca?q=coffee" },
    ],
    recommend: { category: "horeca" },
    links: [
      { label: "Для бізнесу / HoReCa", href: "/catalog/horeca" },
      { label: "Зворотний осмос", href: "/catalog/reverse-osmosis" },
    ],
  },
  {
    slug: "kartrydzhi-ecosoft",
    title: "Картриджі Ecosoft",
    seoTitle: "Картриджі Ecosoft — змінні елементи та мембрани",
    seoDescription:
      "Змінні картриджі, мембрани та комплекти Ecosoft для систем зворотного осмосу та магістральних фільтрів. Підбір за сумісністю.",
    intro:
      "Регулярна заміна картриджів зберігає якість води та подовжує термін служби системи. Підбирайте змінні елементи за сумісністю з вашою моделлю.",
    audience: [
      "для власників систем зворотного осмосу",
      "для магістральних фільтрів і колб BB10 / BB20",
      "хто хоче готові комплекти на 6 або 12 місяців",
    ],
    solutions: [
      { label: "Картриджі для осмосу", href: "/catalog/ro-cartridges" },
      { label: "Картриджі магістральні", href: "/catalog/mainline-cartridges" },
    ],
    recommend: { category: "ro-cartridges" },
    links: [
      { label: "Картриджі для осмосу", href: "/catalog/ro-cartridges" },
      { label: "Магістральні картриджі", href: "/catalog/mainline-cartridges" },
    ],
  },
];

export function findSolution(slug: string): Solution | undefined {
  return SOLUTIONS.find((s) => s.slug === slug);
}
