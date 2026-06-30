import Link from "next/link";

const COLS = [
  {
    title: "Каталог",
    links: [
      { href: "/catalog/reverse-osmosis", label: "Зворотний осмос" },
      { href: "/catalog/filtration-systems", label: "Фільтраційні системи" },
      { href: "/catalog/mainline-filters", label: "Магістральні фільтри" },
      { href: "/catalog/ro-cartridges", label: "Картриджі" },
      { href: "/catalog/horeca", label: "Для бізнесу (HoReCa)" },
    ],
  },
  {
    title: "Компанія",
    links: [
      { href: "/about", label: "Про нас" },
      { href: "/blog", label: "Блог" },
      { href: "/contacts", label: "Контакти" },
    ],
  },
  {
    title: "Клієнтам",
    links: [
      { href: "/delivery", label: "Доставка та оплата" },
      { href: "/returns", label: "Повернення та обмін" },
      { href: "/contacts", label: "Підбір та консультація" },
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
              Офіційний партнерський магазин Ecosoft. Підбираємо, доставляємо, монтуємо
              та обслуговуємо системи очищення води для дому та бізнесу.
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
          <div>© {new Date().getFullYear()} Партнерський магазин Ecosoft.</div>
          <div className="max-w-md md:text-right">
            Ecosoft — український виробник систем очищення води. Цей сайт — офіційний
            партнерський магазин: продаж, підбір, монтаж і сервіс.
          </div>
        </div>
      </div>
    </footer>
  );
}
