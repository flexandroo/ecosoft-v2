import type { Metadata } from "next";
import { ShieldCheck, Wrench, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { PageHeader } from "@/components/site/page-header";
import { SectionHeading, InfoCard, CtaNote } from "@/components/site/content";

export const metadata: Metadata = {
  title: "Повернення та обмін",
  description:
    "Умови повернення та обміну товарів Ecosoft: терміни, процедура, гарантійні випадки, як діяти при пошкодженні товару.",
};

type Block = { icon: LucideIcon; title: string; text: string };

const cases: Block[] = [
  {
    icon: ShieldCheck,
    title: "Товар не підійшов",
    text: "Можете повернути впродовж 14 днів від моменту отримання, якщо товар не був у використанні та збережено товарний вигляд, пломби й оригінальну упаковку.",
  },
  {
    icon: Wrench,
    title: "Гарантійний випадок",
    text: "Якщо обладнання вийшло з ладу у межах гарантійного терміну — заміна, ремонт або повернення коштів за рішенням сервісного центру Ecosoft.",
  },
  {
    icon: Truck,
    title: "Товар пошкоджений під час доставки",
    text: "Зафіксуйте пошкодження у присутності кур'єра або у відділенні Нової пошти, надішліть фото менеджеру — заміну надсилаємо без додаткової оплати.",
  },
];

const procedure = [
  "Зв'яжіться з менеджером телефоном 0 800 300 999 або поштою info@ecosoft.ua.",
  "Надайте номер замовлення та коротко опишіть причину повернення.",
  "Узгодьте з менеджером спосіб повернення (Нова пошта, кур'єр або самовивіз).",
  "Передайте товар у комплектації, отриманій від нас, разом з документами.",
  "Дочекайтеся перевірки технічного стану — зазвичай це 1–3 робочих дні.",
  "Кошти повертаємо тим самим способом, яким була здійснена оплата.",
];

const notReturnable = [
  "Використане обладнання з порушеною герметичністю або картриджі без оригінальної упаковки.",
  "Засипки й реагенти у відкритих мішках.",
  "Товари, виготовлені або сконфігуровані під індивідуальний об'єкт.",
];

export default function ReturnsPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <PageHeader
          title="Повернення та обмін"
          subtitle="Умови повернення, обміну та дій у гарантійних випадках."
          crumbs={[
            { href: "/", label: "Головна" },
            { label: "Повернення та обмін" },
          ]}
        />

        <div className="mx-auto max-w-5xl space-y-14 px-4 py-12 md:px-8 md:py-16">
          <section>
            <SectionHeading title="Коли можна повернути або обміняти товар" />
            <div className="grid gap-4 sm:grid-cols-3">
              {cases.map((b) => (
                <InfoCard key={b.title} icon={b.icon} title={b.title}>
                  {b.text}
                </InfoCard>
              ))}
            </div>
          </section>

          <section>
            <SectionHeading title="Процедура повернення" />
            <ol className="space-y-3">
              {procedure.map((s, i) => (
                <li
                  key={s}
                  className="flex gap-4 rounded-2xl border border-border bg-card p-4"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground tabular">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-foreground">
                    {s}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <SectionHeading title="Що повернути не вийде" />
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <p className="text-muted-foreground">
                Згідно з постановою КМУ № 172 (товари належної якості, які не
                підлягають обміну), не приймаємо назад:
              </p>
              <ul className="mt-4 list-disc space-y-1.5 pl-5 text-muted-foreground">
                {notReturnable.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <p className="mt-4 text-muted-foreground">
                Якщо сумніваєтеся, чи підійде вам конкретна система, краще
                обговорити це з консультантом до оформлення замовлення.
              </p>
            </div>
          </section>

          <CtaNote
            text="Не впевнені, що товар вам підходить? Розкажіть про вашу воду й тип житла — менеджер допоможе обрати правильно з першого разу."
            primary={{
              href: "/contacts",
              label: "Проконсультуватися перед замовленням",
            }}
            secondary={{ href: "/delivery", label: "Умови доставки" }}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
