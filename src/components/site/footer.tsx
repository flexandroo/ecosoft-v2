import Link from "next/link";

const COLS = [
  {
    title: "Каталог",
    links: [
      { href: "/catalog/osmos", label: "Зворотний осмос" },
      { href: "/catalog/softeners", label: "Помʼякшувачі" },
      { href: "/catalog/filters", label: "Фільтри" },
      { href: "/catalog/cartridges", label: "Картриджі" },
    ],
  },
  {
    title: "Компанія",
    links: [
      { href: "/about", label: "Про нас" },
      { href: "/blog", label: "Блог" },
      { href: "/contacts", label: "Контакти" },
      { href: "/careers", label: "Карʼєра" },
    ],
  },
  {
    title: "Клієнтам",
    links: [
      { href: "/delivery", label: "Доставка та оплата" },
      { href: "/warranty", label: "Гарантія" },
      { href: "/service", label: "Сервіс" },
      { href: "/faq", label: "FAQ" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-[1600px] px-4 py-14 md:px-8 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="font-[family-name:var(--font-manrope)] text-2xl font-extrabold lowercase tracking-tight text-primary">
              ecosoft
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Український виробник систем водопідготовки. Чиста вода для дому та бізнесу.
            </p>
            <a
              href="tel:+380800300999"
              className="mt-4 inline-block font-[family-name:var(--font-manrope)] text-xl font-bold text-foreground"
            >
              0 800 300 999
            </a>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <div className="text-sm font-semibold">{col.title}</div>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start gap-2 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>© {new Date().getFullYear()} Ecosoft. Всі права захищені.</div>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Конфіденційність
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Умови
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
