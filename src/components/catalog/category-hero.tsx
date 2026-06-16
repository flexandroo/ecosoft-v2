import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { CategoryKey, Product } from "@/lib/products";

const SUBTITLES: Record<CategoryKey, string> = {
  "reverse-osmosis":
    "Чиста питна вода для дому та офісу — багатоступенева очистка зі збалансованим мінеральним складом.",
  "flow-filters":
    "Компактні проточні фільтри під мийку для щоденного приготування та пиття.",
  "filtration-systems":
    "Помʼякшення, знезалізнення та механічне очищення води для квартири й будинку.",
  "mainline-filters":
    "Захист сантехніки, котла й техніки — очищення води на вході в будинок.",
  "ro-cartridges":
    "Оригінальні змінні картриджі та мембрани для систем зворотного осмосу.",
  "mainline-cartridges":
    "Змінні картриджі для магістральних фільтрів холодної та гарячої води.",
  "filter-media":
    "Засипки, таблетована сіль, іонообмінні смоли та вугілля для фільтрів.",
  horeca:
    "Підготовка води для кавʼярень, ресторанів і готелів — стабільна якість напоїв.",
};

function pluralize(n: number, [one, few, many]: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export function CategoryHero({
  categoryKey,
  title,
  products,
}: {
  categoryKey: CategoryKey;
  title: string;
  products: Product[];
}) {
  const images = products
    .map((p) => p.image)
    .filter((src): src is string => Boolean(src))
    .slice(0, 3);
  const count = products.length;

  return (
    <section className="relative isolate overflow-hidden bg-[oklch(0.18_0.04_220)] text-white">
      {/* ambient brand gradient */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_140%_at_85%_0%,oklch(0.30_0.10_232/0.55),transparent_60%)]"
      />

      <div className="mx-auto flex max-w-[1600px] flex-col gap-8 px-4 pb-12 pt-28 md:px-8 md:pb-16 md:pt-32 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <nav
            aria-label="Хлібні крихти"
            className="flex flex-wrap items-center gap-1.5 text-xs text-white/70"
          >
            <Link href="/" className="transition-colors hover:text-white">
              Головна
            </Link>
            <ChevronRight className="size-3" aria-hidden />
            <Link href="/catalog" className="transition-colors hover:text-white">
              Каталог
            </Link>
            <ChevronRight className="size-3" aria-hidden />
            <span className="text-white">{title}</span>
          </nav>

          <h1 className="mt-4 font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="mt-3 max-w-xl text-base text-white/80 md:text-lg">
            {SUBTITLES[categoryKey]}
          </p>
          <p className="mt-4 text-sm text-white/60">
            <span className="tabular font-semibold text-white">{count}</span>{" "}
            {pluralize(count, ["товар", "товари", "товарів"])} у категорії
          </p>
        </div>

        {images.length > 0 && (
          <div
            aria-hidden
            className="hidden shrink-0 items-center lg:flex"
          >
            {images.map((src, i) => (
              <span
                key={src + i}
                className="grid size-36 place-items-center overflow-hidden rounded-2xl bg-white shadow-xl shadow-black/30 ring-1 ring-white/15"
                style={{
                  marginLeft: i === 0 ? 0 : -28,
                  rotate: `${(i - 1) * 5}deg`,
                  zIndex: images.length - i,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="size-full object-contain p-3"
                />
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
