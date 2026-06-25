"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  ArrowRight,
  ArrowLeft,
  Check,
  Phone,
} from "lucide-react";
import { useCart, type CartLine } from "./cart-context";
import { formatUah } from "@/lib/format";
import { pushBeginCheckout, pushPurchase } from "@/utils/gtmEcommerce";

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
  const { lines, total, count, hydrated, setQty, remove, clear } = useCart();
  const [placed, setPlaced] = useState(false);
  const beganCheckout = useRef(false);

  // GA4: begin_checkout — once per checkout session (this cart-page mount),
  // as soon as the cart is hydrated and not empty.
  useEffect(() => {
    if (beganCheckout.current) return;
    if (!hydrated || lines.length === 0) return;
    beganCheckout.current = true;
    pushBeginCheckout(toGA4Items(lines), total);
  }, [hydrated, lines, total]);

  function handlePlaceOrder() {
    // Snapshot the order before the cart is cleared.
    const items = toGA4Items(lines);
    const orderTotal = total;
    const shipping = orderTotal >= FREE_SHIPPING_THRESHOLD ? 0 : 0;
    const transactionId = `ECO-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`;
    // GA4: purchase — after the order is created, deduped by transaction_id.
    pushPurchase({
      transactionId,
      total: orderTotal,
      shipping,
      tax: 0,
      items,
    });
    clear();
    setPlaced(true);
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
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/catalog"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
          >
            Повернутися до каталогу
            <ArrowRight className="size-4" />
          </Link>
          <a
            href="tel:+380800300999"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <Phone className="size-4" /> 0 800 300 999
          </a>
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

          <ul className="space-y-3">
            {lines.map((l) => (
              <li
                key={l.slug}
                className="flex gap-4 rounded-2xl border border-border bg-card p-3 sm:p-4"
              >
                <Link
                  href={`/catalog/${l.category}/${l.slug}`}
                  className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-white sm:size-24"
                >
                  {l.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={l.image}
                      alt={l.name}
                      loading="lazy"
                      className="size-full object-contain p-1.5"
                    />
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

                  <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                    <QtyStepper
                      qty={l.qty}
                      onDec={() => setQty(l.slug, l.qty - 1)}
                      onInc={() => setQty(l.slug, l.qty + 1)}
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
        <aside className="lg:sticky lg:top-24 lg:h-fit">
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

            <button
              type="button"
              onClick={handlePlaceOrder}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
            >
              Оформити замовлення
              <ArrowRight className="size-4" />
            </button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Підтвердження та оплата — після дзвінка менеджера.
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
  name,
}: {
  qty: number;
  onDec: () => void;
  onInc: () => void;
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
        className="grid size-8 place-items-center rounded-r-lg text-foreground transition-colors hover:bg-muted active:scale-95"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

function pluralize(n: number, [one, few, many]: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
