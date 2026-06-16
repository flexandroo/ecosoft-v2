import Link from "next/link";
import {
  ShieldCheck,
  Sparkles,
  Wrench,
  Leaf,
  Gauge,
  Package,
  Clock,
  Award,
  Zap,
  Droplet,
  Waves,
  Filter,
  Layers,
  Factory,
  Check,
  Phone,
  FileText,
  Download,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  findCategory,
  relatedProducts,
  type CategoryKey,
  type HighlightIcon,
  type Product,
  type ProductDetails,
  PRODUCTS,
} from "@/lib/products";
import { formatUah } from "@/lib/format";
import { ProductCard } from "@/components/catalog/product-card";
import { DescriptionAccordion } from "./description-accordion";

const ICON_BY_CATEGORY: Record<CategoryKey, LucideIcon> = {
  osmos: Droplet,
  softeners: Waves,
  filters: Filter,
  cartridges: Layers,
  industrial: Factory,
};

const HIGHLIGHT_ICONS: Record<HighlightIcon, LucideIcon> = {
  shield: ShieldCheck,
  sparkles: Sparkles,
  wrench: Wrench,
  leaf: Leaf,
  gauge: Gauge,
  box: Package,
  clock: Clock,
  award: Award,
  zap: Zap,
};

const COMPLEXITY_LABEL = {
  easy: "Самостійно",
  medium: "Майстер 1 година",
  pro: "Лише фахівець",
} as const;

export function ProductDetail({ product }: { product: Product }) {
  const cat = findCategory(product.category)!;
  const d: ProductDetails = product.details ?? {};
  const CategoryIcon = ICON_BY_CATEGORY[product.category];
  const related = relatedProducts(product, 4);
  const comparison = buildComparison(product);
  const gallery =
    product.images && product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : [];
  const mainImage = gallery[0];
  const thumbs = gallery.slice(0, 4);

  return (
    <article>
      {/* HERO */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-[1600px] px-4 pt-6 pb-12 md:px-8 md:pt-8 md:pb-16">
          <div className="grid gap-8 md:gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div className="space-y-4">
              <div className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-3xl bg-white">
                {mainImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mainImage}
                    alt={product.name}
                    className="size-full object-contain p-8"
                  />
                ) : (
                  <CategoryIcon className="size-32 text-primary/30" aria-hidden />
                )}
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  {product.oldPrice && (
                    <Badge variant="accent">Знижка</Badge>
                  )}
                  {product.inStock ? (
                    <Badge variant="success">В наявності</Badge>
                  ) : (
                    <Badge variant="muted">Під замовлення</Badge>
                  )}
                </div>
              </div>
              {thumbs.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {thumbs.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={src + i}
                      src={src}
                      alt={`${product.name} — фото ${i + 1}`}
                      loading="lazy"
                      className="aspect-square w-full rounded-xl border border-border bg-white object-contain p-2"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="lg:sticky lg:top-24 lg:h-fit">
              <p className="text-sm font-medium text-muted-foreground">
                {cat.title}
              </p>
              <h1 className="mt-2 font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-tight md:text-4xl">
                {product.name}
              </h1>
              <p className="mt-3 text-base text-muted-foreground">
                {product.description}
              </p>

              {product.features && product.features.length > 0 && (
                <ul className="mt-5 space-y-2">
                  {product.features.slice(0, 4).map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-foreground"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-6 rounded-2xl border border-border bg-background p-5">
                <div className="flex items-baseline gap-3 tabular">
                  <span className="font-[family-name:var(--font-manrope)] text-3xl font-bold text-foreground md:text-4xl">
                    {formatUah(product.price)}
                  </span>
                  {product.oldPrice && (
                    <span className="text-base text-muted-foreground line-through">
                      {formatUah(product.oldPrice)}
                    </span>
                  )}
                </div>
                {d.installation && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Безкоштовний монтаж по Україні
                  </p>
                )}

                <div className="mt-4 flex flex-col gap-2.5">
                  {product.ctaType === "buy" ? (
                    <button className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]">
                      Купити зараз
                      <ArrowRight className="size-4" />
                    </button>
                  ) : (
                    <Link
                      href="#request"
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
                    >
                      Замовити з консультацією
                      <ArrowRight className="size-4" />
                    </Link>
                  )}
                  <a
                    href="tel:+380800300999"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    <Phone className="size-4" /> 0 800 300 999
                  </a>
                </div>

                <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="size-3.5 text-primary" />
                    Гарантія 3 роки
                  </li>
                  <li className="flex items-center gap-2">
                    <Wrench className="size-3.5 text-primary" />
                    Монтаж і сервіс під ключ
                  </li>
                  <li className="flex items-center gap-2">
                    <Award className="size-3.5 text-primary" />
                    Сертифіковано NSF · ДСанПіН
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] space-y-14 px-4 py-14 md:px-8 md:space-y-20 md:py-20">
        {/* AUDIENCE */}
        {d.audience && d.audience.length > 0 && (
          <Section title="Кому підходить" eyebrow="Аудиторія">
            <div className="flex flex-wrap gap-2">
              {d.audience.map((a) => (
                <span
                  key={a}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground"
                >
                  <Check className="size-3.5 text-primary" />
                  {a}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* HIGHLIGHTS */}
        {d.highlights && d.highlights.length > 0 && (
          <Section title="Головні переваги" eyebrow="Чому цей вибір">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {d.highlights.map((h) => {
                const Icon = HIGHLIGHT_ICONS[h.icon];
                return (
                  <div
                    key={h.title}
                    className="rounded-2xl border border-border bg-card p-5"
                  >
                    <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="mt-4 font-[family-name:var(--font-manrope)] text-lg font-bold tracking-tight">
                      {h.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{h.desc}</p>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* SPECS */}
        {d.specs && d.specs.length > 0 && (
          <Section title="Основні характеристики" eyebrow="Технічно">
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <dl className="divide-y divide-border">
                {d.specs.map((s) => (
                  <div
                    key={s.label}
                    className="grid grid-cols-1 gap-1 px-5 py-4 sm:grid-cols-[1fr_2fr] sm:gap-4"
                  >
                    <dt className="text-sm text-muted-foreground">{s.label}</dt>
                    <dd className="text-sm font-medium text-foreground tabular">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Section>
        )}

        {/* REMOVES */}
        {d.removes && d.removes.length > 0 && (
          <Section title="Що очищує" eyebrow="Ефективність">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {d.removes.map((r) => (
                <div
                  key={r.name}
                  className="rounded-xl border border-border bg-card px-4 py-3"
                >
                  <div className="text-sm font-medium text-foreground">{r.name}</div>
                  {r.pct && (
                    <div className="mt-1 text-xs font-bold tabular text-primary">
                      до {r.pct}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* BUNDLE + MAINTENANCE + INSTALLATION */}
        <div className="grid gap-8 lg:grid-cols-3">
          {d.bundle && d.bundle.length > 0 && (
            <Section
              title="Комплектація"
              eyebrow="У коробці"
              className="lg:col-span-3"
            >
              <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {d.bundle.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground"
                  >
                    <Package className="mt-0.5 size-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        {(d.maintenance || d.installation) && (
          <div className="grid gap-6 md:grid-cols-2">
            {d.maintenance && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="size-5" />
                  </span>
                  <h3 className="font-[family-name:var(--font-manrope)] text-xl font-bold">
                    Обслуговування
                  </h3>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-4 border-y border-border py-4">
                  <div>
                    <dt className="text-xs text-muted-foreground">Заміна картриджів</dt>
                    <dd className="mt-1 text-sm font-semibold tabular">
                      {d.maintenance.period}
                    </dd>
                  </div>
                  {d.maintenance.cost && (
                    <div>
                      <dt className="text-xs text-muted-foreground">Вартість</dt>
                      <dd className="mt-1 text-sm font-semibold tabular">
                        {d.maintenance.cost}
                      </dd>
                    </div>
                  )}
                </dl>
                <p className="mt-4 text-sm text-muted-foreground">
                  {d.maintenance.description}
                </p>
              </div>
            )}

            {d.installation && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Wrench className="size-5" />
                  </span>
                  <h3 className="font-[family-name:var(--font-manrope)] text-xl font-bold">
                    Монтаж
                  </h3>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-4 border-y border-border py-4">
                  <div>
                    <dt className="text-xs text-muted-foreground">Час встановлення</dt>
                    <dd className="mt-1 text-sm font-semibold tabular">
                      {d.installation.time}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Складність</dt>
                    <dd className="mt-1 text-sm font-semibold">
                      {COMPLEXITY_LABEL[d.installation.complexity]}
                    </dd>
                  </div>
                </dl>
                <p className="mt-4 text-sm text-muted-foreground">
                  {d.installation.description}
                </p>
              </div>
            )}
          </div>
        )}

        {/* COMPARISON */}
        {comparison && (
          <Section
            title="Порівняння з іншими моделями"
            eyebrow="Як обрати"
          >
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left">
                    <th className="px-5 py-3 font-medium text-muted-foreground"></th>
                    {comparison.columns.map((c) => (
                      <th
                        key={c.slug}
                        className={`px-5 py-3 font-semibold ${c.slug === product.slug ? "text-primary" : "text-foreground"}`}
                      >
                        {c.name}
                        {c.slug === product.slug && (
                          <span className="ml-2 inline-block rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                            Цей товар
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {comparison.rows.map((r) => (
                    <tr key={r.label}>
                      <td className="px-5 py-3 text-muted-foreground">{r.label}</td>
                      {r.values.map((v, i) => (
                        <td
                          key={i}
                          className={`px-5 py-3 tabular ${comparison.columns[i].slug === product.slug ? "font-semibold text-foreground" : "text-foreground"}`}
                        >
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* LONG DESCRIPTION */}
        {d.longDescription && (
          <Section title="Детальний опис" eyebrow="Про продукт">
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <DescriptionAccordion text={d.longDescription} />
            </div>
          </Section>
        )}

        {/* DOCUMENTS */}
        {d.documents && d.documents.length > 0 && (
          <Section title="Документи" eyebrow="Завантаження">
            <ul className="grid gap-2 sm:grid-cols-2">
              {d.documents.map((doc) => (
                <li key={doc.name}>
                  <a
                    href={doc.href}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted"
                  >
                    <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="size-4" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-foreground">
                        {doc.name}
                      </span>
                      {doc.size && (
                        <span className="block text-xs text-muted-foreground">
                          {doc.size}
                        </span>
                      )}
                    </span>
                    <Download className="size-4 text-muted-foreground" />
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* RELATED */}
        {related.length > 0 && (
          <Section title="Схожі моделі" eyebrow="З цієї категорії">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* MOBILE STICKY CTA */}
      <div className="sticky bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground">Ціна</div>
            <div className="font-[family-name:var(--font-manrope)] text-lg font-bold tabular">
              {formatUah(product.price)}
            </div>
          </div>
          {product.ctaType === "buy" ? (
            <button className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]">
              Купити
            </button>
          ) : (
            <Link
              href="#request"
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
            >
              Замовити
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function Section({
  title,
  eyebrow,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mb-5 md:mb-6">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-1 font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight md:text-3xl">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function Badge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "accent" | "success" | "muted";
}) {
  const cls =
    variant === "accent"
      ? "bg-accent text-accent-foreground"
      : variant === "success"
      ? "bg-primary text-primary-foreground"
      : "bg-card text-muted-foreground ring-1 ring-border";
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {children}
    </span>
  );
}

function buildComparison(product: Product): {
  columns: { slug: string; name: string }[];
  rows: { label: string; values: string[] }[];
} | null {
  const siblings = PRODUCTS.filter(
    (p) => p.category === product.category && p.slug !== product.slug,
  )
    .sort((a, b) => Math.abs(a.price - product.price) - Math.abs(b.price - product.price))
    .slice(0, 2);

  if (siblings.length === 0) return null;

  const cols = [product, ...siblings];

  const rows = [
    {
      label: "Ціна",
      values: cols.map((p) => formatUah(p.price)),
    },
    {
      label: "Ступенів",
      values: cols.map((p) => (p.stages != null ? `${p.stages}` : "—")),
    },
    {
      label: "Продуктивність",
      values: cols.map((p) =>
        p.capacityLpd != null
          ? p.capacityLpd >= 1000
            ? `${p.capacityLpd / 1000} м³/добу`
            : `${p.capacityLpd} л/добу`
          : "—",
      ),
    },
    {
      label: "Наявність",
      values: cols.map((p) => (p.inStock ? "В наявності" : "Під замовлення")),
    },
  ];

  return {
    columns: cols.map((p) => ({ slug: p.slug, name: p.name })),
    rows,
  };
}
