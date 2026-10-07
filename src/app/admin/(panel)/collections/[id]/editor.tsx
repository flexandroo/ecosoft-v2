"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { Plus, Search, X } from "lucide-react";
import { formatUah } from "@/lib/format";
import { deleteCollection, moveCollectionItem, saveCollection, setProductInCollection } from "../../../_actions/collections";
import type { FormState } from "../../../_actions/form-state";
import { FormMessage, SubmitButton } from "../../form-status";
import { Card, Checkbox, Field, inputClass } from "../../ui";
import { OrderButton } from "../controls";

export type CollectionProduct = {
  id: string;
  sku: string | null;
  name: string;
  price: number;
  old_price: number | null;
  image: string | null;
  in_stock: boolean;
  is_hidden: boolean;
};

type Collection = {
  id: string;
  slug: string;
  title: string;
  eyebrow: string;
  link_href: string;
  link_label: string;
  show_on_home: boolean;
};

export function CollectionEditor({
  collection,
  selected,
  allProducts,
}: {
  collection: Collection;
  selected: CollectionProduct[];
  allProducts: CollectionProduct[];
}) {
  const [state, action] = useActionState<FormState, FormData>(saveCollection, null);
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState("");

  const run = (fn: () => Promise<void>) =>
    startTransition(async () => {
      try {
        await fn();
      } catch {
        alert("Не вдалося зберегти зміну. Оновіть сторінку і спробуйте ще раз.");
      }
    });

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    const selectedIds = new Set(selected.map((p) => p.id));
    return allProducts
      .filter((p) => !selectedIds.has(p.id))
      .filter((p) => p.name.toLowerCase().includes(term) || (p.sku ?? "").toLowerCase().includes(term))
      .slice(0, 12);
  }, [q, allProducts, selected]);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-5">
        <Card className="space-y-3">
          <h2 className="font-semibold">Товари в підбірці</h2>
          {selected.length ? (
            <ol className="divide-y rounded-lg border">
              {selected.map((p, index) => (
                <li key={p.id} className="flex items-center gap-3 px-3 py-2">
                  <span className="w-6 text-center text-xs text-muted-foreground">{index + 1}</span>
                  <ProductThumb product={p} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {p.sku} · {formatUah(Number(p.price))}
                      {!p.in_stock && " · немає в наявності (не показується)"}
                      {p.is_hidden && " · прихований (не показується)"}
                    </span>
                  </span>
                  <OrderButton label="Вище" up disabled={pending || index === 0} onClick={() => run(() => moveCollectionItem(collection.id, p.id, "up"))} />
                  <OrderButton
                    label="Нижче"
                    disabled={pending || index === selected.length - 1}
                    onClick={() => run(() => moveCollectionItem(collection.id, p.id, "down"))}
                  />
                  <button
                    type="button"
                    aria-label="Прибрати з підбірки"
                    disabled={pending}
                    onClick={() => run(() => setProductInCollection(collection.id, p.id, false))}
                    className="grid size-8 place-items-center rounded-md border text-muted-foreground hover:bg-rose-50 hover:text-rose-700"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">Поки порожньо — додайте товари через пошук нижче.</p>
          )}
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold">Додати товари</h2>
          <label className="relative block">
            <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Назва або артикул (від 2 символів)"
              className={`${inputClass} pl-9`}
            />
          </label>
          {results.length > 0 && (
            <ul className="divide-y rounded-lg border">
              {results.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-3 py-2">
                  <ProductThumb product={p} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{p.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {p.sku} · {formatUah(Number(p.price))}
                    </span>
                  </span>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => setProductInCollection(collection.id, p.id, true))}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 text-sm font-medium hover:bg-muted"
                  >
                    <Plus className="size-4" /> Додати
                  </button>
                </li>
              ))}
            </ul>
          )}
          {q.trim().length >= 2 && !results.length && <p className="text-sm text-muted-foreground">Нічого не знайдено.</p>}
        </Card>
      </div>

      <div className="space-y-5">
        <form action={action}>
          <Card className="space-y-3">
            <input type="hidden" name="id" value={collection.id} />
            <h2 className="font-semibold">Налаштування</h2>
            <Field label="Назва">
              <input name="title" defaultValue={collection.title} required maxLength={120} className={inputClass} />
            </Field>
            <Field label="Надпис над назвою" hint="Необовʼязково, напр. «Обслуговування».">
              <input name="eyebrow" defaultValue={collection.eyebrow} maxLength={60} className={inputClass} />
            </Field>
            <Field label="Посилання «Дивитися всі»" hint="Напр. /catalog/ro-cartridges. Порожньо — без посилання.">
              <input name="link_href" defaultValue={collection.link_href} className={inputClass} />
            </Field>
            <Field label="Текст посилання">
              <input name="link_label" defaultValue={collection.link_label} maxLength={40} className={inputClass} />
            </Field>
            <Checkbox name="show_on_home" label="Показувати на головній" defaultChecked={collection.show_on_home} />
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <SubmitButton>Зберегти</SubmitButton>
              <FormMessage state={state} />
            </div>
          </Card>
        </form>
        <form
          action={deleteCollection}
          onSubmit={(e) => {
            if (!confirm("Видалити підбірку? Товари залишаться в каталозі.")) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={collection.id} />
          <button type="submit" className="text-sm font-medium text-rose-700 hover:underline">
            Видалити підбірку
          </button>
        </form>
      </div>
    </div>
  );
}

function ProductThumb({ product }: { product: CollectionProduct }) {
  return product.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={product.image} alt="" className="size-10 shrink-0 rounded-md border bg-white object-contain" />
  ) : (
    <span className="size-10 shrink-0 rounded-md border bg-muted" />
  );
}
