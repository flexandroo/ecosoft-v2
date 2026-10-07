"use client";

import { useActionState, useState } from "react";
import { slugify } from "@/lib/posts-shared";
import { createProduct } from "../../../_actions/products";
import type { FormState } from "../../../_actions/form-state";
import { FormMessage, SubmitButton } from "../../form-status";
import { Card, Field, inputClass } from "../../ui";

export type NewProductDefaults = {
  from?: string;
  name: string;
  category: string;
  price: string;
};

export function NewProductForm({
  categories,
  defaults,
}: {
  categories: { key: string; title: string }[];
  defaults: NewProductDefaults;
}) {
  const [state, action] = useActionState<FormState, FormData>(createProduct, null);
  const [name, setName] = useState(defaults.name);
  // The address follows the name until it is edited by hand.
  const [slug, setSlug] = useState<string | null>(null);

  return (
    <form action={action} className="max-w-2xl space-y-5">
      {defaults.from && <input type="hidden" name="from" value={defaults.from} />}
      <Card className="space-y-4">
        <Field label="Назва">
          <input name="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={300} className={inputClass} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Категорія">
            <select name="category" defaultValue={defaults.category} required className={inputClass}>
              <option value="" disabled>
                Оберіть категорію
              </option>
              {categories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ціна, $" hint="РРЦ з прайсу Ecosoft; у гривнях рахується за курсом НБУ.">
            <input name="price_usd" defaultValue={defaults.price} inputMode="decimal" required className={inputClass} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Артикул (SKU)" hint="Як у прайсі Ecosoft. Після створення не змінюється — це ID у рекламі.">
            <input name="sku" required maxLength={40} pattern="[A-Za-z0-9][A-Za-z0-9._\/\-]{1,39}" className={`${inputClass} font-mono`} />
          </Field>
          <Field label="Адреса сторінки" hint="Латиниця, цифри й дефіси. Після створення не змінюється.">
            <input
              name="slug"
              value={slug ?? slugify(name, 90)}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              required
              maxLength={100}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              className={`${inputClass} font-mono`}
            />
          </Field>
        </div>
      </Card>
      <p className="text-sm text-muted-foreground">
        {defaults.from
          ? "Опис, фото, характеристики й фільтри скопіюються з вихідного товару. "
          : ""}
        Товар створиться прихованим: додайте фото й перевірте дані, потім зніміть «Приховати з сайту».
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingLabel="Створюємо…">Створити товар</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
