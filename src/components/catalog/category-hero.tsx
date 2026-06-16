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
  image,
}: {
  categoryKey: CategoryKey;
  title: string;
  products: Product[];
  /** Optional generated category background (full-bleed cover). */
  image?: string;
}) {
  const count = products.length;
  const montage = products
    .map((p) => p.image)
    .filter((src): src is string => Boolean(src))
    .slice(0, 3);

  return (
    <section className="relative isolate overflow-hidden bg-[oklch(0.18_0.04_220)] text-white">
      {image ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            aria-hidden
            className="absolute inset-0 -z-20 size-full object-cover"
          />
          {/* left-weighted overlay keeps the copy legible over any image */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,oklch(0.15_0.04_220/0.92)_0%,oklch(0.16_0.04_220/0.7)_42%,oklch(0.18_0.04_220/0.4)_100%)]"
          />
        </>
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(120%_140%_at_85%_0%,oklch(0.30_0.10_232/0.55),transparent_60%)]"
        />
      )}

      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 pb-8 pt-24 md:flex-row md:items-center md:justify-between md:px-8 md:pb-12 md:pt-28">
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

          <h1 className="mt-3 font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight md:text-4xl">
            {title}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/80 md:text-base">
            {SUBTITLES[categoryKey]}
          </p>
          <p className="mt-3 text-xs text-white/60 md:text-sm">
            <span className="tabular font-semibold text-white">{count}</span>{" "}
            {pluralize(count, ["товар", "товари", "товарів"])} у категорії
          </p>
        </div>

        {/* product montage — shown only as a fallback when no generated image */}
        {!image && montage.length > 0 && (
          <div aria-hidden className="hidden shrink-0 items-center lg:flex">
            {montage.map((src, i) => (
              <span
                key={src + i}
                className="grid size-24 place-items-center overflow-hidden rounded-2xl bg-white shadow-xl shadow-black/30 ring-1 ring-white/15"
                style={{
                  marginLeft: i === 0 ? 0 : -22,
                  rotate: `${(i - 1) * 5}deg`,
                  zIndex: montage.length - i,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="size-full object-contain p-2.5"
                />
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
