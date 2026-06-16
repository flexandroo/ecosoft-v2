import type { Metadata } from "next";
import {
  Truck,
  MapPin,
  Home,
  Building2,
  Landmark,
  CreditCard,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { PageHeader } from "@/components/site/page-header";
import { SectionHeading, InfoCard, CtaNote } from "@/components/site/content";

export const metadata: Metadata = {
  title: "Доставка і оплата",
  description:
    "Способи доставки та оплати замовлень систем очищення води: Нова Пошта, адресна доставка, власний транспорт, самовивіз. Реквізити для безготівкового розрахунку.",
};

type Block = { icon: LucideIcon; title: string; text: string };

const delivery: Block[] = [
  {
    icon: Truck,
    title: "Нова Пошта",
    text: "Доставка у відділення, поштомат або адресна доставка кур'єром по Україні. Зазвичай 1–3 робочі дні, вартість — за тарифами перевізника залежно від ваги й габаритів. Перед відправленням менеджер підтверджує замовлення.",
  },
  {
    icon: MapPin,
    title: "Адресна доставка",
    text: "Для габаритного обладнання, комплексних систем, колонних фільтрів і замовлень під монтаж — узгоджується індивідуально з менеджером. Враховуємо тип, вагу, адресу й необхідність подальшого монтажу.",
  },
  {
    icon: Home,
    title: "Власна доставка",
    text: "Для Києва, Київської області та суміжних регіонів — доставка нашим транспортом. Дату й час погоджуємо після підтвердження замовлення.",
  },
  {
    icon: Building2,
    title: "Самовивіз",
    text: "Київська обл., с. Софіївська Борщагівка, вул. Київська, 3. Пн–Пт: 09:00–18:00, Сб: 10:00–15:00. Перед самовивозом дочекайтеся підтвердження менеджера.",
  },
];

const payment: Block[] = [
  {
    icon: Landmark,
    title: "Безготівковий розрахунок",
    text: "Оплата на розрахунковий рахунок. Для юридичних осіб і ФОП виставляємо рахунок-фактуру. Відвантаження — після надходження коштів.",
  },
  {
    icon: CreditCard,
    title: "Картка або онлайн-оплата",
    text: "За наявності технічної можливості оплата може бути здійснена карткою або через онлайн-платіж. Деталі уточнює менеджер під час підтвердження.",
  },
  {
    icon: Wallet,
    title: "Передоплата",
    text: "Може знадобитися для нестандартних конфігурацій, обладнання під замовлення, великих комплексних систем і замовлень з монтажем. Розмір узгоджується індивідуально.",
  },
];

const installNotes = [
  "Адреса об'єкта та тип системи.",
  "Умови підключення й наявність місця для монтажу.",
  "Зручний день і час виконання робіт.",
];

const importantNotes = [
  "Замовлення обробляються після підтвердження менеджером.",
  "Терміни доставки залежать від наявності товару, регіону та способу.",
  "При отриманні перевірте цілісність пакування у присутності перевізника.",
  "Якщо пакування або товар пошкоджено — складіть акт із перевізником і зробіть фото.",
  "Для габаритного обладнання й систем під монтаж умови доставки погоджуємо окремо.",
  "Усі ціни на сайті — у гривнях.",
  "Доставка за межі України розраховується індивідуально.",
];

const requisites: { legal: string; rows: { label: string; value: string }[] }[] = [
  {
    legal: "ТОВ «СОФІЇВКА-МОНТАЖ»",
    rows: [
      { label: "Рахунок", value: "UA103348510000000026007117600" },
      { label: "Банк", value: "ПАТ «ПУМБ», м. Київ" },
      {
        label: "Адреса",
        value:
          "08131, Київська обл., Бучанський р-н, с. Софіївська Борщагівка, вул. Київська, 3",
      },
      { label: "Телефон", value: "(044) 496-83-06" },
      { label: "Код ЄДРПОУ", value: "37074476" },
      { label: "ІПН", value: "370744710131" },
    ],
  },
  {
    legal: "ФОП Куцевич Олена Юріївна",
    rows: [
      { label: "Рахунок", value: "UA513052990000026004040127953" },
      { label: "Банк", value: "АТ КБ «ПРИВАТБАНК»" },
      { label: "Код ЄДРПОУ", value: "2509805221" },
    ],
  },
];

export default function DeliveryPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <PageHeader
          title="Доставка і оплата"
          subtitle="Доставляємо обладнання для очищення води по Україні та допомагаємо організувати монтаж системи після покупки."
          crumbs={[
            { href: "/", label: "Головна" },
            { label: "Доставка і оплата" },
          ]}
        />

        <div className="mx-auto max-w-5xl space-y-14 px-4 py-12 md:px-8 md:py-16">
          <section>
            <SectionHeading eyebrow="Логістика" title="Способи доставки" />
            <div className="grid gap-4 sm:grid-cols-2">
              {delivery.map((b) => (
                <InfoCard key={b.title} icon={b.icon} title={b.title}>
                  {b.text}
                </InfoCard>
              ))}
            </div>
          </section>

          <section>
            <SectionHeading title="Доставка обладнання під монтаж" />
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <p className="text-muted-foreground">
                Якщо ви замовляєте систему очищення води з монтажем, доставка
                може бути узгоджена разом із виїздом спеціаліста. У такому випадку
                менеджер уточнює:
              </p>
              <ul className="mt-4 list-disc space-y-1.5 pl-5 text-muted-foreground">
                {installNotes.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <p className="mt-4 text-muted-foreground">
                Для комплексних систем очищення води, колонних фільтрів,
                кабінетних пом’якшувачів і комерційного обладнання умови доставки
                й монтажу узгоджуємо індивідуально.
              </p>
            </div>
          </section>

          <section>
            <SectionHeading eyebrow="Оплата" title="Способи оплати" />
            <div className="grid gap-4 sm:grid-cols-3">
              {payment.map((b) => (
                <InfoCard key={b.title} icon={b.icon} title={b.title}>
                  {b.text}
                </InfoCard>
              ))}
            </div>
          </section>

          <section>
            <SectionHeading title="Важливо знати" />
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {importantNotes.map((s) => (
                <li
                  key={s}
                  className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground"
                >
                  {s}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <SectionHeading
              title="Реквізити для оплати"
              lead="Для безготівкового розрахунку оберіть актуальний рахунок або попросіть рахунок-фактуру у менеджера."
            />
            <div className="grid gap-4 md:grid-cols-2">
              {requisites.map((r) => (
                <div
                  key={r.legal}
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <h3 className="font-[family-name:var(--font-manrope)] text-base font-bold tracking-tight">
                    {r.legal}
                  </h3>
                  <dl className="mt-3 divide-y divide-border text-sm">
                    {r.rows.map((row) => (
                      <div
                        key={row.label}
                        className="grid grid-cols-[auto_1fr] gap-4 py-2.5"
                      >
                        <dt className="text-muted-foreground">{row.label}</dt>
                        <dd className="break-all text-right font-medium text-foreground tabular">
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </section>

          <CtaNote
            text="Маєте складний випадок або потрібен монтаж за межами Київщини? Зв'яжіться з менеджером — підкажемо терміни й вартість для вашого регіону."
            primary={{ href: "/contacts", label: "Зв'язатися з менеджером" }}
            secondary={{ href: "/catalog", label: "До каталогу" }}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
