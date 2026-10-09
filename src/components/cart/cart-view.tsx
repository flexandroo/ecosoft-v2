"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ProductImage } from "@/components/catalog/product-image";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  ArrowRight,
  ArrowLeft,
  Check,
  Phone,
  Info,
} from "lucide-react";
import { MAX_LINE_QTY, useCart, type CartLine } from "./cart-context";
import { formatUah } from "@/lib/format";
import { isValidUkrainianPhone } from "@/lib/validation";
import { useSiteSettings } from "@/components/site/settings-context";
import { toPhoneContacts } from "@/lib/settings-shared";
import {
  pushBeginCheckout,
  pushGenerateLead,
  pushPurchase,
} from "@/utils/gtmEcommerce";
import { createLeadIdentity, getMarketingAttribution } from "@/utils/marketing-attribution";

const FREE_SHIPPING_THRESHOLD = 5000;

function toGA4Items(lines: CartLine[]) {
  return lines.map((l) => ({
    sku: l.sku,
    id: l.slug,
    name: l.name,
    category: l.category,
    subcategory: l.subcategory,
    price: l.price,
    quantity: l.qty,
  }));
}

export function CartView() {
  const PHONE_CONTACTS = toPhoneContacts(useSiteSettings().phones);
  const { lines, total, count, hydrated, setQty, remove, clear, syncPrices } = useCart();
  const catalog = useLiveCatalog(hydrated && lines.length > 0);
  // Lines the live catalogue no longer sells (hidden, price on request, unknown SKU).
  const unavailable = new Set(
    catalog ? lines.filter((l) => !isOrderable(catalog.get(l.sku ?? ""))).map((l) => l.slug) : [],
  );
  const [repriced, setRepriced] = useState<string[]>([]);

  // Prices in the cart are a snapshot from when the item was added: bring them
  // up to date so the customer sees what the order will actually cost.
  useEffect(() => {
    if (!catalog) return;
    const changed = lines.filter((l) => {
      const live = catalog.get(l.sku ?? "");
      return isOrderable(live) && live.price !== l.price;
    });
    if (!changed.length) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRepriced(changed.map((l) => catalog.get(l.sku ?? "")?.name ?? l.name));
    syncPrices(catalog);
  }, [catalog, lines, syncPrices]);
  const [placed, setPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const beganCheckout = useRef(false);
  const orderIdentity = useRef<ReturnType<typeof createLeadIdentity> | null>(null);

  const contactValid = name.trim().length >= 2 && isValidUkrainianPhone(phone);

  // GA4: begin_checkout — once per checkout session (this cart-page mount),
  // as soon as the cart is hydrated and not empty.
  useEffect(() => {
    if (beganCheckout.current) return;
    if (!hydrated || lines.length === 0) return;
    beganCheckout.current = true;
    pushBeginCheckout(toGA4Items(lines), total);
  }, [hydrated, lines, total]);

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !contactValid || unavailable.size > 0) return;

    // Snapshot the order before the cart is cleared.
    const items = toGA4Items(lines);
    const orderTotal = total;
    orderIdentity.current ??= createLeadIdentity("ECO");
    const identity = orderIdentity.current;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalId: identity.externalId,
          eventId: identity.eventId,
          attribution: getMarketingAttribution(),
          customer: {
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
            comment: comment.trim(),
          },
          company, // honeypot
          items: items.map((it) => ({
            sku: it.sku,
            qty: it.quantity,
          })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        orderId?: string;
        total?: number;
        error?: string;
        sku?: string;
      };
      if (!res.ok || !data.ok) {
        const line = data.sku ? lines.find((l) => l.sku === data.sku) : undefined;
        throw new Error(orderErrorMessage(data.error, line?.name));
      }
      // The server prices the order from the live catalogue; report that amount to ads.
      const confirmedTotal = typeof data.total === "number" ? data.total : orderTotal;

      const transactionId = data.orderId ?? identity.externalId;
      pushGenerateLead({
        leadId: transactionId,
        leadType: "order",
        total: confirmedTotal,
        items,
      });
      // There is no online payment: for Meta, Purchase means the customer has
      // successfully placed an order that the manager will confirm and invoice.
      pushPurchase({
        transactionId,
        total: confirmedTotal,
        items,
      });
      setOrderId(data.orderId ?? null);
      clear();
      setPlaced(true);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : orderErrorMessage());
    } finally {
      setSubmitting(false);
    }
  }

  // Avoid hydration flash: render nothing meaningful until storage is read.
  if (!hydrated) {
    return (
      <div className="mx-auto max-w-[1600px] px-4 py-16 md:px-8">
        <div className="h-40 animate-pulse rounded-2xl border border-border bg-card" />
      </div>
    );
  }

  if (placed) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center md:px-8">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
          <Check className="size-7" />
        </span>
        <h2 className="mt-5 font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight">
          Замовлення прийнято
        </h2>
        <p className="mt-3 text-muted-foreground">
          Наш менеджер звʼяжеться з вами найближчим часом, щоб підтвердити
          деталі та доставку.
        </p>
        {orderId && (
          <p className="mt-3 text-sm font-semibold text-foreground tabular">
            Номер звернення: {orderId}
          </p>
        )}
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/catalog"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
          >
            Повернутися до каталогу
            <ArrowRight className="size-4" />
          </Link>
          {PHONE_CONTACTS.map((phone) => (
            <a
              key={phone.raw}
              href={phone.href}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <Phone className="size-4 shrink-0" /> {phone.display}
            </a>
          ))}
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center md:px-8">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
          <ShoppingCart className="size-7" />
        </span>
        <h2 className="mt-5 font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight">
          Кошик порожній
        </h2>
        <p className="mt-3 text-muted-foreground">
          Перегляньте каталог і додайте системи очищення води до кошика.
        </p>
        <Link
          href="/catalog"
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
        >
          Перейти до каталогу
          <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  const freeShipping = total >= FREE_SHIPPING_THRESHOLD;

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-10 md:px-8 md:py-14">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Items */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="tabular font-semibold text-foreground">{count}</span>{" "}
              {pluralize(count, ["товар", "товари", "товарів"])} у кошику
            </p>
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-destructive"
            >
              <Trash2 className="size-4" /> Очистити
            </button>
          </div>

          {(repriced.length > 0 || unavailable.size > 0) && (
            <div role="status" className="mb-3 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              <div className="space-y-1">
                {repriced.length > 0 && <p>Ціни оновлено за актуальним каталогом: {repriced.join(", ")}.</p>}
                {unavailable.size > 0 && <p>Деякі товари зараз недоступні — приберіть їх із кошика, щоб оформити замовлення.</p>}
              </div>
            </div>
          )}

          <ul className="space-y-3">
            {lines.map((l) => (
              <li
                key={l.slug}
                className="flex gap-4 rounded-2xl border border-border bg-card p-3 sm:p-4"
              >
                <Link
                  href={`/catalog/${l.category}/${l.slug}`}
                  className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-white sm:size-24"
                >
                  {l.image ? (
                    <ProductImage src={l.image} alt={l.name} sizes="96px" className="object-contain p-1.5" />
                  ) : (
                    <ShoppingCart className="size-7 text-muted-foreground" />
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <Link
                    href={`/catalog/${l.category}/${l.slug}`}
                    className="font-[family-name:var(--font-manrope)] text-sm font-bold leading-snug tracking-tight text-foreground transition-colors hover:text-primary sm:text-base"
                  >
                    {l.name}
                  </Link>
                  <div className="mt-1 text-sm text-muted-foreground tabular">
                    {formatUah(l.price)}
                  </div>
                  {unavailable.has(l.slug) ? (
                    <p className="mt-1 text-xs font-semibold text-destructive">Товар недоступний — приберіть з кошика</p>
                  ) : (
                    catalog?.get(l.sku ?? "")?.inStock === false && (
                      <p className="mt-1 text-xs font-medium text-muted-foreground">Під замовлення — менеджер уточнить строк</p>
                    )
                  )}

                  <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                    <QtyStepper
                      qty={l.qty}
                      onDec={() => setQty(l.slug, l.qty - 1)}
                      onInc={() => setQty(l.slug, l.qty + 1)}
                      max={MAX_LINE_QTY}
                      name={l.name}
                    />
                    <div className="flex items-center gap-3">
                      <span className="font-[family-name:var(--font-manrope)] text-sm font-bold tabular text-foreground sm:text-base">
                        {formatUah(l.price * l.qty)}
                      </span>
                      <button
                        type="button"
                        aria-label={`Видалити «${l.name}» з кошика`}
                        onClick={() => remove(l.slug)}
                        className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <Link
            href="/catalog"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="size-4" /> Продовжити покупки
          </Link>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-32 lg:h-fit">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-[family-name:var(--font-manrope)] text-lg font-bold tracking-tight">
              Разом
            </h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Товари ({count})</dt>
                <dd className="tabular font-medium text-foreground">
                  {formatUah(total)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Доставка</dt>
                <dd className="font-medium text-foreground">
                  {freeShipping ? "Безкоштовно" : "За тарифами перевізника"}
                </dd>
              </div>
            </dl>

            {!freeShipping && (
              <p className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                Безкоштовна доставка від {formatUah(FREE_SHIPPING_THRESHOLD)}.
              </p>
            )}

            <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
              <span className="text-sm font-medium text-muted-foreground">
                До сплати
              </span>
              <span className="font-[family-name:var(--font-manrope)] text-2xl font-bold tabular text-foreground">
                {formatUah(total)}
              </span>
            </div>

            <form onSubmit={handlePlaceOrder} className="mt-5 space-y-3">
              {/* Honeypot — hidden from users, filled only by bots. */}
              <input
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="hidden"
                aria-hidden="true"
              />
              <div>
                <label htmlFor="ord-name" className="sr-only">
                  Імʼя
                </label>
                <input
                  id="ord-name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Імʼя *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <div>
                <label htmlFor="ord-phone" className="sr-only">
                  Телефон
                </label>
                <input
                  id="ord-phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="+380 __ ___ __ __ *"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm tabular outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <div>
                <label htmlFor="ord-address" className="sr-only">
                  Місто та відділення / адреса доставки
                </label>
                <input
                  id="ord-address"
                  type="text"
                  autoComplete="street-address"
                  placeholder="Місто, відділення Нової пошти / адреса"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <div>
                <label htmlFor="ord-comment" className="sr-only">
                  Коментар
                </label>
                <textarea
                  id="ord-comment"
                  rows={2}
                  placeholder="Коментар до замовлення (необовʼязково)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
              </div>

              {unavailable.size > 0 && !error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                  У кошику є недоступні товари.
                </p>
              )}
              {error && (
                <p role="alert" aria-live="assertive" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || !contactValid || unavailable.size > 0}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Надсилаємо…" : "Оформити замовлення"}
                {!submitting && <ArrowRight className="size-4" />}
              </button>
            </form>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Підтвердження та оплата — після дзвінка менеджера.
            </p>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Оформлюючи замовлення, ви погоджуєтесь із{" "}
              <Link href="/privacy" className="font-medium text-foreground underline underline-offset-2">
                політикою конфіденційності
              </Link>
              .
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function QtyStepper({
  qty,
  onDec,
  onInc,
  max,
  name,
}: {
  qty: number;
  onDec: () => void;
  onInc: () => void;
  max: number;
  name: string;
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border">
      <button
        type="button"
        aria-label={`Зменшити кількість «${name}»`}
        onClick={onDec}
        className="grid size-8 place-items-center rounded-l-lg text-foreground transition-colors hover:bg-muted active:scale-95"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="grid h-8 min-w-9 place-items-center px-2 text-sm font-semibold tabular">
        {qty}
      </span>
      <button
        type="button"
        aria-label={`Збільшити кількість «${name}»`}
        onClick={onInc}
        disabled={qty >= max}
        title={qty >= max ? `Не більше ${max} шт. в одному замовленні` : undefined}
        className="grid size-8 place-items-center rounded-r-lg text-foreground transition-colors hover:bg-muted active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

type LiveProduct = { name: string; price: number; inStock: boolean };

/** Out-of-stock products are still orderable ("Під замовлення"); request-only ones (no price) are not. */
function isOrderable(item: LiveProduct | undefined): item is LiveProduct {
  return Boolean(item && item.price > 0);
}

/** Current names, prices and stock by SKU from /api/catalog; null until loaded or on failure. */
function useLiveCatalog(enabled: boolean): Map<string, LiveProduct> | null {
  const [catalog, setCatalog] = useState<Map<string, LiveProduct> | null>(null);
  useEffect(() => {
    if (!enabled || catalog) return;
    const controller = new AbortController();
    fetch("/api/catalog", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { products?: (LiveProduct & { sku: string })[] } | null) => {
        if (!data?.products?.length) return;
        setCatalog(new Map(data.products.filter((p) => p.sku).map((p) => [p.sku, { name: p.name, price: p.price, inStock: p.inStock }])));
      })
      // Offline or blocked: keep the stored snapshot; the order API still validates every line.
      .catch(() => {});
    return () => controller.abort();
  }, [enabled, catalog]);
  return catalog;
}

function orderErrorMessage(code?: string, itemName?: string): string {
  if (code === "invalid_items") {
    return itemName
      ? `Товар «${itemName}» зараз недоступний для замовлення або змінився. Приберіть його з кошика чи зателефонуйте нам.`
      : "Деякі товари в кошику зараз недоступні. Оновіть сторінку або зателефонуйте нам.";
  }
  if (code === "invalid_contact") return "Перевірте імʼя та номер телефону.";
  if (code === "rate_limited") return "Забагато спроб. Зачекайте кілька хвилин або зателефонуйте нам.";
  return "Не вдалося надіслати замовлення. Спробуйте ще раз або зателефонуйте нам.";
}

function pluralize(n: number, [one, few, many]: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
