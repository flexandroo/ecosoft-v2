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
  Boxes,
  FlaskConical,
  Coffee,
  Check,
  Phone,
  FileText,
  Download,
  ArrowRight,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  type CategoryKey,
  type HighlightIcon,
  type Product,
  type ProductDetails,
} from "@/lib/products";
import { relatedFrom } from "@/lib/catalog";
import { formatUah } from "@/lib/format";
import type { PhoneContact } from "@/lib/settings-shared";
import { ProductCard } from "@/components/catalog/product-card";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { keySpecLabels, keySpecValue, keySpecs, productBrand } from "@/lib/catalog-facets";
import { BuyBox, CopySku } from "./buy-box";
import { ProductGallery } from "./product-gallery";
import { ProductTabs, type ProductTab } from "./product-tabs";
import { ViewItemTracker } from "./view-item-tracker";
import { ProductDescription } from "./product-description";
import { getProductDisplayImage } from "@/lib/product-identity";

const ICON_BY_CATEGORY: Record<CategoryKey, LucideIcon> = {
  "reverse-osmosis": Droplet,
  "flow-filters": Waves,
  "filtration-systems": Package,
  "mainline-filters": Filter,
  "ro-cartridges": Layers,
  "mainline-cartridges": Boxes,
  "filter-media": FlaskConical,
  horeca: Coffee,
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

export function ProductDetail({
  product,
  allProducts,
  phones,
  categoryTitle,
}: {
  product: Product;
  allProducts: Product[];
  phones: PhoneContact[];
  /** Storefront (admin-managed) category name. */
  categoryTitle: string;
}) {
  const d: ProductDetails = product.details ?? {};
  const CategoryIcon = ICON_BY_CATEGORY[product.category];
  const related = relatedFrom(allProducts, product, 4);
  const comparison = buildComparison(product, allProducts);
  const detailedDescription = d.longDescription?.trim() || product.description;
  // Use a model-specific warranty if the data has one; otherwise stay neutral
  // (no hardcoded "3 роки" / "5 років" that could contradict other pages).
  const warranty = d.specs?.find((s) => /гаран/i.test(s.label))?.value;
  const localImage = getProductDisplayImage(product);
  const gallery = [
    localImage,
    ...(product.images ?? []).filter((image) => image && image !== localImage),
  ].filter(Boolean);
  const brand = productBrand(product);
  const topSpecs = keySpecs(product, 4);
  const sideSpecs = keySpecs(product, 6);

  const description = (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
      <div className="min-w-0 space-y-10">
        {detailedDescription && <ProductDescription text={detailedDescription} />}

        {d.audience && d.audience.length > 0 && (
          <SubSection title="Кому підходить">
            <div className="flex flex-wrap gap-2">
              {d.audience.map((a) => (
                <span key={a} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground">
                  <Check className="size-3.5 text-primary" />
                  {a}
                </span>
              ))}
            </div>
          </SubSection>
        )}

        {d.highlights && d.highlights.length > 0 && (
          <SubSection title="Головні переваги">
            <div className="grid gap-4 sm:grid-cols-2">
              {d.highlights.map((h) => {
                const Icon = HIGHLIGHT_ICONS[h.icon];
                return (
                  <div key={h.title} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <h4 className="font-[family-name:var(--font-manrope)] font-bold tracking-tight">{h.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{h.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </SubSection>
        )}

        {d.removes && d.removes.length > 0 && (
          <SubSection title="Що очищує">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {d.removes.map((r) => (
                <div key={r.name} className="rounded-xl border border-border bg-card px-4 py-3">
                  <div className="text-sm font-medium text-foreground">{r.name}</div>
                  {r.pct && <div className="mt-1 text-xs font-bold text-primary tabular">до {r.pct}</div>}
                </div>
              ))}
            </div>
          </SubSection>
        )}

        {d.bundle && d.bundle.length > 0 && (
          <SubSection title="Комплектація">
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {d.bundle.map((item) => (
                <li key={item} className="flex items-start gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground">
                  <Package className="mt-0.5 size-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </SubSection>
        )}

        {(d.maintenance || d.installation) && (
          <div className="grid gap-6 md:grid-cols-2">
            {d.maintenance && (
              <InfoPanel
                icon={Sparkles}
                title="Обслуговування"
                rows={[
                  { label: "Заміна картриджів", value: d.maintenance.period },
                  ...(d.maintenance.cost ? [{ label: "Вартість", value: d.maintenance.cost }] : []),
                ]}
                text={d.maintenance.description}
              />
            )}
            {d.installation && (
              <InfoPanel
                icon={Wrench}
                title="Монтаж"
                rows={[
                  { label: "Час встановлення", value: d.installation.time },
                  { label: "Складність", value: COMPLEXITY_LABEL[d.installation.complexity] },
                ]}
                text={d.installation.description}
              />
            )}
          </div>
        )}
      </div>

      {sideSpecs.length > 0 && (
        <aside className="h-fit rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-44">
          <h3 className="font-[family-name:var(--font-manrope)] text-lg font-bold tracking-tight">Ключові характеристики</h3>
          <dl className="mt-3 divide-y divide-border text-sm">
            {sideSpecs.map((s) => (
              <div key={s.label} className="flex items-baseline justify-between gap-3 py-2.5">
                <dt className="text-muted-foreground">{s.label}</dt>
                <dd className="text-right font-semibold text-foreground">{s.value}</dd>
              </div>
            ))}
          </dl>
          {d.specs && d.specs.length > 0 && (
            <a href="#specs" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              Усі характеристики <ArrowRight className="size-3.5" />
            </a>
          )}
        </aside>
      )}
    </div>
  );

  const tabs: ProductTab[] = [{ id: "description", label: "Опис", content: description }];
  if (d.specs && d.specs.length > 0) {
    tabs.push({
      id: "specs",
      label: `Характеристики (${d.specs.length})`,
      content: (
        <div className="max-w-4xl overflow-hidden rounded-2xl border border-border bg-card">
          <dl className="divide-y divide-border">
            {d.specs.map((s) => (
              <div key={s.label} className="grid grid-cols-1 gap-1 px-5 py-3.5 sm:grid-cols-[1fr_1.3fr] sm:gap-6">
                <dt className="text-sm text-muted-foreground">{s.label}</dt>
                <dd className="text-sm font-medium text-foreground tabular">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ),
    });
  }
  if (d.documents && d.documents.length > 0) {
    tabs.push({
      id: "documents",
      label: `Документи (${d.documents.length})`,
      content: (
        <ul className="grid max-w-4xl gap-2 sm:grid-cols-2">
          {d.documents.map((doc) => (
            <li key={doc.name} className="min-w-0">
              <a href={doc.href} className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium break-words text-foreground">{doc.name}</span>
                  {doc.size && <span className="block text-xs text-muted-foreground">{doc.size}</span>}
                </span>
                <Download className="size-4 shrink-0 text-muted-foreground" />
              </a>
            </li>
          ))}
        </ul>
      ),
    });
  }

  return (
    <article className="pb-20 md:pb-0">
      <ViewItemTracker
        product={{
          sku: product.sku,
          id: product.slug,
          slug: product.slug,
          name: product.name,
          category: product.category,
          subcategory: product.subcategory,
          price: product.price,
        }}
      />
      {/* HERO: gallery | name, code, key specs, price, buy */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-[1600px] px-4 pt-6 pb-10 md:px-8 md:pt-8 md:pb-14">
          <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12">
            <ProductGallery
              images={gallery}
              alt={product.name}
              fallback={<CategoryIcon className="size-32 text-primary/30" aria-hidden />}
              badges={product.oldPrice ? <Badge variant="accent">Знижка</Badge> : undefined}
            />

            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">
                {categoryTitle}
                {brand && <span className="text-muted-foreground/70"> · {brand}</span>}
              </p>
              <h1 className="mt-2 font-[family-name:var(--font-manrope)] text-2xl leading-tight font-bold tracking-tight md:text-[34px]">
                {product.name}
              </h1>
              {product.sku && (
                <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                  Артикул <span className="font-semibold text-foreground tabular">{product.sku}</span>
                  <CopySku sku={product.sku} />
                </p>
              )}

              {topSpecs.length > 0 && (
                <div className="mt-5 border-t border-border pt-4">
                  <dl className="grid gap-x-8 gap-y-2.5 text-sm sm:grid-cols-2">
                    {topSpecs.map((s) => (
                      <div key={s.label} className="flex items-baseline justify-between gap-3 border-b border-dashed border-border pb-2">
                        <dt className="text-muted-foreground">{s.label}</dt>
                        <dd className="text-right font-semibold text-foreground">{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                  {d.specs && d.specs.length > 0 && (
                    <a href="#specs" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                      Усі характеристики <ArrowRight className="size-3.5" />
                    </a>
                  )}
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-border bg-background p-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <span
                    className={`inline-flex items-center gap-2 text-sm font-medium ${product.inStock ? "text-emerald-700" : "text-muted-foreground"}`}
                  >
                    <span aria-hidden className={`size-2 rounded-full ${product.inStock ? "bg-emerald-500" : "bg-muted-foreground/50"}`} />
                    {product.inStock ? "В наявності" : "Під замовлення"}
                  </span>
                  <span className="text-right tabular">
                    {product.oldPrice && (
                      <span className="block text-sm text-muted-foreground line-through">{formatUah(product.oldPrice)}</span>
                    )}
                    <span className="font-[family-name:var(--font-manrope)] text-3xl font-bold text-foreground md:text-4xl">
                      {formatUah(product.price)}
                    </span>
                  </span>
                </div>

                <div className="mt-4">
                  <BuyBox product={product} />
                </div>

                {phones.length > 0 && (
                  <p className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                    Потрібна порада?
                    {phones.map((phone) => (
                      <a key={phone.raw} href={phone.href} className="inline-flex items-center gap-1 font-semibold text-foreground hover:text-primary">
                        <Phone className="size-3.5" /> {phone.display}
                      </a>
                    ))}
                  </p>
                )}
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Ціну, наявність і комплектність менеджер підтвердить перед оплатою.
                </p>
              </div>

              <ul className="mt-5 grid gap-3 sm:grid-cols-3">
                <Perk icon={Truck} title="Доставка" text="по Україні 1–3 дні" />
                <Perk icon={ShieldCheck} title="Гарантія" text={warranty ? warranty : "від виробника"} />
                <Perk icon={Wrench} title="Монтаж і сервіс" text="під ключ" />
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] space-y-14 px-4 pb-14 md:space-y-20 md:px-8 md:pb-20">
        <ProductTabs tabs={tabs} />

        {/* COMPARISON */}
        {comparison && (
          <Section title="Порівняння з іншими моделями" eyebrow="Як обрати">
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left">
                    <th className="px-5 py-3 font-medium text-muted-foreground"></th>
                    {comparison.columns.map((c) => (
                      <th key={c.slug} className={`px-5 py-3 font-semibold ${c.slug === product.slug ? "text-primary" : "text-foreground"}`}>
                        {c.name}
                        {c.slug === product.slug && (
                          <span className="ml-2 inline-block rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold tracking-wider text-primary-foreground uppercase">
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

        {/* RELATED */}
        {related.length > 0 && (
          <Section title="Схожі товари" eyebrow="З цієї категорії">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* MOBILE STICKY CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur-md md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground">Ціна</div>
            <div className="font-[family-name:var(--font-manrope)] text-lg font-bold tabular">
              {formatUah(product.price)}
            </div>
          </div>
          <AddToCartButton
            product={product}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
          >
            Купити
          </AddToCartButton>
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

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-4 font-[family-name:var(--font-manrope)] text-xl font-bold tracking-tight">{title}</h3>
      {children}
    </section>
  );
}

function InfoPanel({
  icon: Icon,
  title,
  rows,
  text,
}: {
  icon: LucideIcon;
  title: string;
  rows: { label: string; value: string }[];
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <h3 className="font-[family-name:var(--font-manrope)] text-xl font-bold">{title}</h3>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-4 border-y border-border py-4">
        {rows.map((r) => (
          <div key={r.label}>
            <dt className="text-xs text-muted-foreground">{r.label}</dt>
            <dd className="mt-1 text-sm font-semibold tabular">{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function Perk({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-border bg-background px-3.5 py-3">
      <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
      <span>
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className="block text-xs text-muted-foreground">{text}</span>
      </span>
    </li>
  );
}

function buildComparison(product: Product, allProducts: Product[]): {
  columns: { slug: string; name: string }[];
  rows: { label: string; values: string[] }[];
} | null {
  // Compare within the same subcategory first, then fall back to the category.
  let siblings = allProducts.filter(
    (p) =>
      p.category === product.category &&
      p.slug !== product.slug &&
      (product.subcategory ? p.subcategory === product.subcategory : true),
  );
  if (siblings.length === 0) {
    siblings = allProducts.filter((p) => p.category === product.category && p.slug !== product.slug);
  }
  siblings = siblings.sort((a, b) => Math.abs(a.price - product.price) - Math.abs(b.price - product.price)).slice(0, 2);
  if (siblings.length === 0) return null;

  const cols = [product, ...siblings];
  const rows: { label: string; values: string[] }[] = [{ label: "Ціна", values: cols.map((p) => formatUah(p.price)) }];
  for (const label of keySpecLabels(product.category)) {
    const values = cols.map((p) => keySpecValue(p, label));
    // Only keep rows where at least one product actually has a value.
    if (values.some((v) => v)) rows.push({ label, values: values.map((v) => v || "—") });
  }
  // Hide the table unless it carries something beyond price (price + ≥2 attrs).
  if (rows.length < 3) return null;
  return { columns: cols.map((p) => ({ slug: p.slug, name: p.name })), rows };
}
