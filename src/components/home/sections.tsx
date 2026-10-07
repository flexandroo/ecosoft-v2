import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Clock,
  Headphones,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";
import { ProductCard } from "@/components/catalog/product-card";
import { getSiteSettings } from "@/lib/settings";
import { mapsUrl, toPhoneContacts } from "@/lib/settings-shared";
import type { HomeCategory, HomeSlide } from "@/lib/home";
import type { Product } from "@/lib/products";
import { cn } from "@/lib/utils";
import { InlineCallbackForm } from "./inline-callback-form";
import { RailScroller } from "./rail-scroller";


export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1600px] px-4 md:px-8", className)}>{children}</div>;
}

export function SectionHeading({
  eyebrow,
  title,
  href,
  hrefLabel,
  className,
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  hrefLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex items-end justify-between gap-4 md:mb-6", className)}>
      <div>
        {eyebrow && <p className="text-xs font-bold tracking-[0.14em] text-primary uppercase">{eyebrow}</p>}
        <h2 className="mt-1 font-[family-name:var(--font-manrope)] text-2xl font-extrabold tracking-tight md:text-[32px]">
          {title}
        </h2>
      </div>
      {href && (
        <Link href={href} className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline md:mr-28 md:inline-flex">
          {hrefLabel ?? "Дивитися всі"} <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

/** Vertical category list (desktop sidebar in the hero grid). */
export function CategoryMenu({ categories, className }: { categories: HomeCategory[]; className?: string }) {
  return (
    <nav aria-label="Категорії" className={cn("rounded-2xl border border-border bg-card p-2", className)}>
      <ul className="flex h-full flex-col">
        {categories.map((c) => (
          <li key={c.key} className="flex flex-1">
            <Link
              href={`/catalog/${c.key}`}
              className="group flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-2 transition-colors hover:bg-primary/6"
            >
              <span className="min-w-0 flex-1 text-[15px] leading-snug font-semibold group-hover:text-primary">{c.title}</span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Horizontal category chips (phones). */
export function CategoryChips({ categories, className }: { categories: HomeCategory[]; className?: string }) {
  return (
    <nav aria-label="Категорії" className={cn("-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}>
      <ul className="flex w-max gap-2">
        {categories.map((c) => (
          <li key={c.key}>
            <Link
              href={`/catalog/${c.key}`}
              className="inline-flex h-11 items-center rounded-full border border-border bg-card px-4 text-sm font-semibold whitespace-nowrap"
            >
              {c.short}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Promo card: text and photo side by side (photo on top on phones), no overlay on the photo. */
export function PromoTile({ tile, className }: { tile: HomeSlide; className?: string }) {
  return (
    <Link
      href={tile.href}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-card sm:flex-row-reverse",
        className,
      )}
    >
      <span className="relative block aspect-[16/10] shrink-0 overflow-hidden bg-muted sm:aspect-auto sm:w-[42%]">
        {/* Local art is resized by next/image; admin uploads (Supabase) are already compressed. */}
        <Image
          src={tile.imageDesktop}
          alt=""
          fill
          sizes="(min-width: 1024px) 200px, 50vw"
          unoptimized={/^https?:\/\//.test(tile.imageDesktop)}
          className="object-cover object-[78%_center] transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        {tile.eyebrow && <span className="text-[11px] font-bold tracking-wider break-words text-primary uppercase">{tile.eyebrow}</span>}
        <span className="mt-1.5 font-[family-name:var(--font-manrope)] text-lg leading-tight font-extrabold sm:text-xl">{tile.title}</span>
        {tile.subtitle && <span className="mt-1 text-sm font-semibold text-foreground/80">{tile.subtitle}</span>}
        <span className="mt-auto inline-flex w-fit items-center gap-1.5 pt-3 text-sm font-semibold text-primary">
          {tile.ctaLabel} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </span>
    </Link>
  );
}

export function ProductRail({ label, products }: { label: string; products: Product[] }) {
  return (
    <RailScroller label={label}>
      {products.map((p) => (
        <div key={p.slug} role="listitem" className="flex w-[230px] shrink-0 snap-start md:w-[268px] [&>article]:w-full">
          <ProductCard product={p} />
        </div>
      ))}
    </RailScroller>
  );
}

const BENEFITS = [
  { icon: BadgeCheck, title: "Офіційна гарантія", text: "до 5 років залежно від моделі" },
  { icon: Truck, title: "Доставка 1–3 дні", text: "безкоштовно від 5000 ₴" },
  { icon: Wrench, title: "Монтаж під ключ", text: "сертифіковані інженери" },
  { icon: Headphones, title: "Сервіс і картриджі", text: "заміна картриджів і обслуговування" },
];

export function BenefitsRow({ className, tone = "card" }: { className?: string; tone?: "card" | "plain" }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>
      {BENEFITS.map(({ icon: Icon, title, text }) => (
        <li
          key={title}
          className={cn("flex items-center gap-2.5 rounded-2xl p-2.5 md:gap-3 md:p-4", tone === "card" ? "border border-border bg-card" : "")}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary md:size-11">
            <Icon className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm leading-tight font-bold md:text-[15px]">{title}</span>
            <span className="hidden text-[13px] text-muted-foreground md:block">{text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export async function StoreContactCard({ className }: { className?: string }) {
  const settings = await getSiteSettings();
  const phones = toPhoneContacts(settings.phones);
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 md:p-6", className)}>
      <p className="text-xs font-bold tracking-[0.14em] text-primary uppercase">Магазин і склад</p>
      <p className="mt-2 font-[family-name:var(--font-manrope)] text-xl leading-tight font-extrabold md:text-2xl">{settings.address.short}</p>
      <dl className="mt-5 space-y-3 text-[15px]">
        <div className="flex items-center gap-3">
          <dt className="sr-only">Телефон</dt>
          <Phone className="size-4 text-primary" aria-hidden />
          <dd className="flex flex-wrap gap-x-3">
            {phones.map((phone) => (
              <a key={phone.raw} href={phone.href} className="font-semibold tabular hover:text-primary">
                {phone.display}
              </a>
            ))}
          </dd>
        </div>
        <div className="flex items-center gap-3">
          <dt className="sr-only">Доставка</dt>
          <Truck className="size-4 text-primary" aria-hidden />
          <dd>Нова пошта по всій Україні, 1–3 дні</dd>
        </div>
        <div className="flex items-center gap-3">
          <dt className="sr-only">Монтаж</dt>
          <Clock className="size-4 text-primary" aria-hidden />
          <dd>Монтаж у Києві та області протягом 24 год</dd>
        </div>
      </dl>
      <a
        href={mapsUrl(settings.address.full)}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-muted"
      >
        <MapPin className="size-4" /> Прокласти маршрут
      </a>
    </div>
  );
}

export function CallbackPanel({ source, className }: { source: string; className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-foreground p-6 text-white md:p-8", className)}>
      <p className="text-xs font-bold tracking-[0.14em] text-accent uppercase">Безкоштовна консультація</p>
      <h2 className="mt-2 font-[family-name:var(--font-manrope)] text-2xl leading-tight font-extrabold md:text-[30px]">
        Не знаєте, який фільтр потрібен?
      </h2>
      <p className="mt-2 max-w-lg text-[15px] text-white/75">
        Залиште номер — інженер передзвонить, розпитає про воду і підбере систему під ваш бюджет. Без нав’язування.
      </p>
      <InlineCallbackForm source={source} tone="dark" className="mt-6" />
    </div>
  );
}

export function BusinessBlock({ className }: { className?: string }) {
  return (
    <div className={cn("grid overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-2", className)}>
      <div className="p-6 md:p-10">
        <p className="text-xs font-bold tracking-[0.14em] text-primary uppercase">Для бізнесу і монтажників</p>
        <h2 className="mt-2 font-[family-name:var(--font-manrope)] text-2xl leading-tight font-extrabold md:text-[30px]">
          Вода для кавʼярень, ресторанів і обʼєктів
        </h2>
        <ul className="mt-5 space-y-3 text-[15px]">
          {[
            "Підбір під навантаження і якість вхідної води",
            "Обладнання Ecosoft RObust для кавомашин і кухні",
            "Комплектація обʼєктів за специфікацією і безготівкова оплата",
          ].map((t) => (
            <li key={t} className="flex gap-2.5">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden /> {t}
            </li>
          ))}
        </ul>
        <Link
          href="/catalog/horeca"
          className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-[15px] font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Рішення для HoReCa <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="relative min-h-[220px] bg-muted">
        <Image
          src="/images/category-scenes-v3/horeca.png"
          alt=""
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover object-[65%_center]"
        />
      </div>
    </div>
  );
}
