import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  Home,
  Settings,
  Coffee,
  ShieldCheck,
  Factory,
  FlaskConical,
  HelpCircle,
  Headphones,
  Droplet,
  Award,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { PageHeader } from "@/components/site/page-header";
import { SectionHeading, InfoCard } from "@/components/site/content";

export const metadata: Metadata = {
  title: "Про нас",
  description:
    "Підбираємо надійні системи очищення води Ecosoft для дому, бізнесу та комерційних об'єктів. Допомагаємо обрати, встановити та обслуговувати рішення під вашу воду.",
};

type Card = { icon: LucideIcon; title: string; text: string };

const audiences: Card[] = [
  {
    icon: Building2,
    title: "Квартири",
    text: "Компактні системи під мийку для пиття, готування та щоденних побутових потреб.",
  },
  {
    icon: Home,
    title: "Приватні будинки",
    text: "Комплексне очищення на вході в будинок — захист сантехніки, бойлера й техніки.",
  },
  {
    icon: Settings,
    title: "Офіси",
    text: "Тиха фонова робота, стабільна вода для кави, чаю та кулерів у переговорних.",
  },
  {
    icon: Coffee,
    title: "Кав'ярні та ресторани",
    text: "Підготовка води під кавомашини, пароконвектомати й льодогенератори без сюрпризів.",
  },
  {
    icon: ShieldCheck,
    title: "Комерційні об'єкти",
    text: "Готелі, торгові центри, медичні заклади — рішення з обліковим режимом і сервісом.",
  },
  {
    icon: Factory,
    title: "Невеликі виробництва",
    text: "Технологічна вода для процесів, де якість і стабільні параметри критично важливі.",
  },
];

const reasons: Card[] = [
  {
    icon: FlaskConical,
    title: "Підбір під реальні умови",
    text: "Дивимось на ваш аналіз води, тип об'єкта і сценарій використання — не пропонуємо «універсальних» систем.",
  },
  {
    icon: ShieldCheck,
    title: "Перевірене обладнання Ecosoft",
    text: "Працюємо з оригінальними системами, мембранами та картриджами українського виробника з 1991 року.",
  },
  {
    icon: HelpCircle,
    title: "Просте пояснення без термінів",
    text: "Різниця між лінійками, навіщо мінералізатор, як змінювати картриджі — людською мовою.",
  },
  {
    icon: Headphones,
    title: "Підтримка після покупки",
    text: "Нагадуємо про регламент, виїжджаємо на сервіс, допомагаємо з оригінальними змінними елементами.",
  },
];

const steps = [
  {
    title: "Аналізуємо задачу",
    text: "Тип об'єкта, джерело води, аналіз або опис проблеми — без цього не пропонуємо рішення.",
  },
  {
    title: "Підбираємо рішення",
    text: "Конкретна модель або зв'язка систем під вашу воду, кількість людей і санвузлів.",
  },
  {
    title: "Пояснюємо різницю",
    text: "Показуємо, чому саме ця конфігурація — і що вона дасть у щоденному використанні.",
  },
  {
    title: "Підтримуємо після покупки",
    text: "Монтаж, налаштування, регламент і сервіс — щоб система працювала роками.",
  },
];

const values: Card[] = [
  {
    icon: ShieldCheck,
    title: "Комфорт у щоденному житті",
    text: "Смачна питна вода, відсутність накипу, м'якша шкіра після душу — речі, які помічаєш, коли вони перестають дратувати.",
  },
  {
    icon: Droplet,
    title: "Здоров'я родини",
    text: "Вода, у якій ви впевнені, — для пиття, готування й купання дітей.",
  },
  {
    icon: Settings,
    title: "Захист обладнання",
    text: "Бойлер, посудомийна, кавомашина, сантехніка — все це служить довше, коли вода підготовлена.",
  },
  {
    icon: Award,
    title: "Стабільність для бізнесу",
    text: "Передбачувана якість води — це передбачуваний смак напоїв, ресурс техніки та задоволені гості.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <PageHeader
          title="Підбираємо надійні системи очищення води для дому та бізнесу"
          subtitle="Допомагаємо обрати правильну систему очищення води, виконуємо монтаж і супроводжуємо її сервісно. Працюємо з обладнанням українського виробника Ecosoft, який розвиває напрямок водопідготовки з 1991 року."
          crumbs={[
            { href: "/", label: "Головна" },
            { label: "Про нас" },
          ]}
        />

        <div className="mx-auto max-w-5xl space-y-16 px-4 py-12 md:px-8 md:py-16">
          <section>
            <SectionHeading
              eyebrow="Хто ми"
              title="Партнер з підбору і сервісу систем Ecosoft"
            />
            <div className="space-y-4 text-muted-foreground">
              <p>
                Ми не виробник, а команда, яка щодня допомагає клієнтам обрати
                правильне обладнання для очищення води, привезти, встановити та
                обслуговувати його. Наш фокус — не великий каталог заради
                каталогу, а рішення, яке справді закриває проблему з водою у
                конкретному об’єкті.
              </p>
              <p>
                Працюємо з обладнанням <strong className="text-foreground">Ecosoft</strong> —
                українського виробника систем водопідготовки, заснованого{" "}
                <strong className="text-foreground">1991 року</strong>. У них
                власне виробництво, сертифікація й сервісна мережа. Ми, своєю
                чергою, відповідаємо за грамотний підбір, монтаж під ключ і
                супровід після покупки.
              </p>
            </div>
          </section>

          <section>
            <SectionHeading
              eyebrow="Для кого ми працюємо"
              title="Шість типових сценаріїв"
              lead="Кожен об'єкт має свої умови — джерело води, об'єм споживання, задачі. Ми працюємо з усіма основними категоріями."
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {audiences.map((c) => (
                <InfoCard key={c.title} icon={c.icon} title={c.title}>
                  {c.text}
                </InfoCard>
              ))}
            </div>
          </section>

          <section>
            <SectionHeading
              eyebrow="Чому обирають нас"
              title="Чотири причини довіряти підбір саме нам"
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {reasons.map((c) => (
                <InfoCard key={c.title} icon={c.icon} title={c.title}>
                  {c.text}
                </InfoCard>
              ))}
            </div>
          </section>

          <section>
            <SectionHeading
              eyebrow="Наш підхід"
              title="Чотири кроки від запиту до сервісу"
            />
            <ol className="grid gap-4 sm:grid-cols-2">
              {steps.map((s, i) => (
                <li
                  key={s.title}
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <span className="font-[family-name:var(--font-manrope)] text-3xl font-extrabold tabular text-primary/30">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 font-[family-name:var(--font-manrope)] text-lg font-bold tracking-tight">
                    {s.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {s.text}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <SectionHeading
              eyebrow="Що для нас важливо"
              title="Якісна вода — це спокій, здоров'я і стабільність"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {values.map((c) => (
                <div
                  key={c.title}
                  className="flex gap-4 rounded-2xl border border-border bg-card p-5"
                >
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <c.icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-[family-name:var(--font-manrope)] text-base font-bold tracking-tight">
                      {c.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {c.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl bg-[oklch(0.18_0.04_220)] px-6 py-12 text-white md:px-12 md:py-16">
            <div className="max-w-2xl">
              <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight md:text-3xl">
                Не знаєте, яка система підійде саме вам?
              </h2>
              <p className="mt-3 text-white/80">
                Залиште заявку — ми допоможемо підібрати рішення під вашу воду,
                бюджет і тип об’єкта.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contacts"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-foreground transition-all duration-200 hover:bg-white/90 active:scale-[0.98]"
                >
                  Підібрати систему очищення води
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/catalog"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/5 px-6 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/10"
                >
                  Переглянути каталог
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
