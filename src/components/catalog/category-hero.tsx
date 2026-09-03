import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { CategoryKey, Product } from "@/lib/products";
import { getProductImagePath } from "@/lib/product-identity";

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
  /** Optional representative product from the verified Ecosoft catalogue. */
  image?: string;
}) {
  const count = products.length;
  const montage = products
    .map((p) => getProductImagePath(p))
    .filter((src): src is string => Boolean(src))
    .slice(0, 3);

  return (
    <section className="relative isolate overflow-hidden border-b border-primary/10 bg-[oklch(0.96_0.018_222)] text-foreground">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(75%_160%_at_88%_40%,oklch(0.87_0.065_222/0.72),transparent_64%)]"
      />

      <div className="mx-auto flex max-w-[1600px] items-end justify-between gap-5 px-4 pb-6 pt-20 md:min-h-52 md:px-8 md:pb-8 md:pt-24">
        <div className="max-w-2xl">
          <nav
            aria-label="Хлібні крихти"
            className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Link href="/" className="transition-colors hover:text-primary">
              Головна
            </Link>
            <ChevronRight className="size-3" aria-hidden />
            <Link href="/catalog" className="transition-colors hover:text-primary">
              Каталог
            </Link>
            <ChevronRight className="size-3" aria-hidden />
            <span className="text-foreground">{title}</span>
          </nav>

          <h1 className="mt-3 font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight md:text-4xl">
            {title}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-base">
            {SUBTITLES[categoryKey]}
          </p>
          <p className="mt-3 text-xs text-muted-foreground md:text-sm">
            <span className="tabular font-semibold text-foreground">{count}</span>{" "}
            {pluralize(count, ["товар", "товари", "товарів"])} у категорії
          </p>
        </div>

        {image ? (
          <div
            aria-hidden
            className="relative hidden h-36 w-60 shrink-0 overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-lg shadow-primary/10 md:block lg:h-40 lg:w-72"
          >
            <Image src={image} alt="" fill sizes="288px" className="object-contain p-3" />
          </div>
        ) : montage.length > 0 ? (
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
        ) : null}
      </div>
    </section>
  );
}
