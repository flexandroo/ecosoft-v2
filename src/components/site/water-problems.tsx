import Link from "next/link";
import {
  Droplets,
  Magnet,
  Wind,
  Mountain,
  GlassWater,
  ShieldCheck,
  Coffee,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Problem = {
  icon: LucideIcon;
  title: string;
  desc: string;
  href: string;
};

const PROBLEMS: Problem[] = [
  {
    icon: Droplets,
    title: "Жорстка вода",
    desc: "Накип на чайнику, бойлері, сантехніці та техніці.",
    href: "/catalog/filtration-systems?q=пом'якшення",
  },
  {
    icon: Magnet,
    title: "Залізо у воді",
    desc: "Жовтий наліт, металевий присмак, плями на сантехніці.",
    href: "/catalog/filtration-systems?q=залізо",
  },
  {
    icon: Wind,
    title: "Запах хлору",
    desc: "Неприємний запах і присмак водопровідної води.",
    href: "/catalog?q=хлор",
  },
  {
    icon: Mountain,
    title: "Вода зі свердловини",
    desc: "Потрібна комплексна очистка перед використанням у будинку.",
    href: "/catalog/filtration-systems",
  },
  {
    icon: GlassWater,
    title: "Питна вода на кухні",
    desc: "Чиста вода для пиття, приготування їжі та кави.",
    href: "/catalog/reverse-osmosis",
  },
  {
    icon: ShieldCheck,
    title: "Захист техніки",
    desc: "Менше накипу та домішок у бойлері, котлі, пральній машині.",
    href: "/catalog/mainline-filters",
  },
  {
    icon: Coffee,
    title: "Вода для кавʼярні або бізнесу",
    desc: "Стабільна якість води для кави, ресторану чи HoReCa.",
    href: "/catalog/horeca",
  },
];

function ProblemCard({ p, hidden }: { p: Problem; hidden?: boolean }) {
  return (
    <Link
      href={p.href}
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : undefined}
      className="group mr-4 flex w-[280px] shrink-0 flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
    >
      <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <p.icon className="size-5" />
      </span>
      <h3 className="mt-4 font-[family-name:var(--font-manrope)] text-lg font-bold tracking-tight">
        {p.title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
        Дивитися рішення
        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export function WaterProblems() {
  return (
    <section className="py-16 md:pb-10 md:pt-24">
      <div className="mx-auto mb-8 max-w-[1600px] px-4 md:mb-10 md:px-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Підбір рішення
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-tight md:text-4xl">
          Підібрати фільтр за проблемою води
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Оберіть, що вас турбує — ми покажемо відповідні рішення Ecosoft для
          квартири, будинку або бізнесу.
        </p>
      </div>

      {/* Single-row auto-scrolling carousel (pauses on hover). Two identical
          copies + per-card right margin make translateX(-50%) loop seamlessly. */}
      <div className="marquee relative overflow-hidden">
        <div className="marquee-track flex w-max py-2">
          {[...PROBLEMS, ...PROBLEMS].map((p, i) => (
            <ProblemCard key={i} p={p} hidden={i >= PROBLEMS.length} />
          ))}
        </div>
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent md:w-16" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent md:w-16" />
      </div>

      <div className="mx-auto mt-8 max-w-[1600px] px-4 md:px-8">
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center sm:flex-row sm:text-left">
          <p className="text-base font-medium text-foreground">
            Не знаєте, що обрати? Отримайте безкоштовну консультацію з підбору.
          </p>
          <Link
            href="/contacts"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
          >
            Отримати консультацію
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
