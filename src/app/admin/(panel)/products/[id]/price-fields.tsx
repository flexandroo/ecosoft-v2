"use client";

import { useState } from "react";
import { formatUah } from "@/lib/format";
import { Field, inputClass } from "../../ui";

const parse = (value: string) => {
  const n = Number(value.replace(/\s/g, "").replace(",", "."));
  return value.trim() && Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * Prices in USD (Ecosoft price list) with the UAH amount at the current NBU
 * rate; the rate refreshes twice a day and UAH prices follow it. Clearing the
 * USD price switches the product to a fixed UAH price set by hand.
 */
export function PriceFields({
  priceUsd,
  oldPriceUsd,
  price,
  oldPrice,
  rate,
}: {
  priceUsd: number | null;
  oldPriceUsd: number | null;
  price: number;
  oldPrice: number | null;
  rate: { rate: number; date: string } | null;
}) {
  const [usd, setUsd] = useState(priceUsd == null ? "" : String(priceUsd));
  const [oldUsd, setOldUsd] = useState(oldPriceUsd == null ? "" : String(oldPriceUsd));
  const usdValue = parse(usd);
  const oldUsdValue = parse(oldUsd);
  const inUah = (v: number | null) => (v != null && rate ? formatUah(Math.round(v * rate.rate)) : null);

  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ціна, $" hint={inUah(usdValue) ? `= ${inUah(usdValue)} на сайті` : "Порожньо — ціна в гривнях вручну."}>
          <input name="price_usd" value={usd} onChange={(e) => setUsd(e.target.value)} inputMode="decimal" className={inputClass} />
        </Field>
        <Field
          label="Стара ціна, $"
          hint={inUah(oldUsdValue) ? `= ${inUah(oldUsdValue)}, перекреслена` : "Показується перекресленою. Порожньо — без знижки."}
        >
          <input name="old_price_usd" value={oldUsd} onChange={(e) => setOldUsd(e.target.value)} inputMode="decimal" className={inputClass} />
        </Field>
      </div>
      {rate && (
        <p className="text-xs text-muted-foreground">
          Курс НБУ {rate.rate.toLocaleString("uk-UA", { maximumFractionDigits: 4 })} ₴/$ на {rate.date}. Ціни в гривнях
          оновлюються автоматично двічі на день.
        </p>
      )}
      {usdValue == null && (
        <div className="grid gap-4 rounded-lg border border-dashed p-3 sm:grid-cols-2">
          <Field label="Ціна, грн (фіксована)">
            <input name="price" defaultValue={price} inputMode="decimal" required className={inputClass} />
          </Field>
          <Field label="Стара ціна, грн" hint="Не залежить від курсу.">
            <input name="old_price" defaultValue={oldPrice ?? ""} inputMode="decimal" className={inputClass} />
          </Field>
        </div>
      )}
    </div>
  );
}
