import type { Metadata } from "next";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { PageHeader } from "@/components/site/page-header";
import { PHONE_CONTACTS } from "@/lib/contact-details";

export const metadata: Metadata = {
  title: "Політика конфіденційності",
  description: "Як партнерський магазин Ecosoft обробляє дані відвідувачів і покупців.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  {
    title: "Які дані ми отримуємо",
    text: "Імʼя, номер телефону, email, адресу або відділення доставки, коментар до замовлення та відомості про обрані товари. Технічні засоби аналітики можуть також отримувати тип пристрою, сторінки переходу та події взаємодії із сайтом.",
  },
  {
    title: "Навіщо використовуємо дані",
    text: "Щоб відповісти на звернення, підібрати обладнання, підтвердити й виконати замовлення, організувати доставку, монтаж і сервіс, а також вимірювати роботу сайту та рекламних кампаній.",
  },
  {
    title: "Кому можуть передаватися дані",
    text: "Продавцю, зазначеному в підтвердженні або рахунку, працівникам і підрядникам, які обробляють звернення, перевізникам та сервісним партнерам у межах, потрібних для виконання замовлення. Дані не продаються третім особам.",
  },
  {
    title: "Зберігання та захист",
    text: "Зберігаємо дані лише стільки, скільки потрібно для обробки звернення, виконання зобовʼязань і дотримання вимог обліку. Доступ обмежується особами, яким він потрібен для роботи із замовленням.",
  },
  {
    title: "Ваші права",
    text: "Ви можете попросити уточнити, виправити або видалити надані дані, а також відкликати згоду на подальший звʼязок, якщо зберігання не потрібне для виконання замовлення чи вимог законодавства.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <PageHeader
          title="Політика конфіденційності"
          subtitle="Пояснюємо, які дані отримуємо через сайт і як використовуємо їх для обробки звернень та замовлень."
          crumbs={[{ href: "/", label: "Головна" }, { label: "Політика конфіденційності" }]}
        />
        <article className="mx-auto max-w-3xl space-y-8 px-4 py-12 md:px-8 md:py-16">
          <p className="text-sm text-muted-foreground">Оновлено 13 серпня 2026 року.</p>
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="font-[family-name:var(--font-manrope)] text-xl font-bold tracking-tight">
                {section.title}
              </h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{section.text}</p>
            </section>
          ))}
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-[family-name:var(--font-manrope)] text-xl font-bold tracking-tight">
              Звернення щодо персональних даних
            </h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              Зателефонуйте за номером{" "}
              {PHONE_CONTACTS.map((phone, index) => (
                <span key={phone.raw}>
                  {index > 0 && " або "}
                  <a href={phone.href} className="font-medium text-foreground underline underline-offset-2">
                    {phone.display}
                  </a>
                </span>
              ))}{" "}
              або скористайтеся формою на сторінці контактів. Актуальний продавець і платіжні реквізити зазначаються під час підтвердження замовлення.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
