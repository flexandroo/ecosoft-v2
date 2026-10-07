"use client";

import { useActionState, useState } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { saveProduct, type FormState } from "../../../actions";
import { FormMessage, SubmitButton } from "../../form-status";
import { ImageUploadButton } from "../../image-upload";
import { Card, Checkbox, Field, inputClass, textareaClass } from "../../ui";
import { DocumentsEditor, SpecsEditor, type DocumentRow, type SpecRow } from "./details-editors";
import { ProductCollections, type ProductCollectionOption } from "./product-collections";

type EditableProduct = {
  id: string;
  slug: string;
  sku: string | null;
  category: string;
  name: string;
  price: number;
  old_price: number | null;
  in_stock: boolean;
  cta_type: "buy" | "request";
  description: string;
  images: string[];
  is_hidden: boolean;
  sort: number;
  updated_at: string;
  long_description: string;
  specs: SpecRow[];
  documents: DocumentRow[];
};

export function ProductForm({
  product,
  collections,
  specLabels,
}: {
  product: EditableProduct;
  collections: ProductCollectionOption[];
  /** Characteristic names already used in this category, offered as suggestions. */
  specLabels: string[];
}) {
  const [state, action] = useActionState<FormState, FormData>(saveProduct, null);
  const [images, setImages] = useState(product.images);

  const move = (index: number, delta: number) =>
    setImages((list) => {
      const next = [...list];
      const target = index + delta;
      if (target < 0 || target >= next.length) return list;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  return (
    <form action={action} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <input type="hidden" name="id" value={product.id} />
      <input type="hidden" name="updated_at" value={product.updated_at} />
      <input type="hidden" name="images" value={images.join("\n")} />

      <div className="space-y-5">
        <Card className="space-y-4">
          <Field label="Назва">
            <input name="name" defaultValue={product.name} required className={inputClass} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ціна, грн">
              <input name="price" defaultValue={product.price} inputMode="decimal" required className={inputClass} />
            </Field>
            <Field label="Стара ціна, грн" hint="Показується перекресленою. Порожньо — без знижки.">
              <input name="old_price" defaultValue={product.old_price ?? ""} inputMode="decimal" className={inputClass} />
            </Field>
          </div>
          <Field label="Короткий опис" hint="Під назвою товару, у картках і в рекламному фіді.">
            <textarea name="description" defaultValue={product.description} rows={4} className={textareaClass} />
          </Field>
          <Field label="Повний опис" hint="Вкладка «Опис» на сторінці товару. Порожньо — показується короткий опис.">
            <textarea name="long_description" defaultValue={product.long_description} rows={10} className={textareaClass} />
          </Field>
        </Card>

        <SpecsEditor initial={product.specs} suggestions={specLabels} />
        <DocumentsEditor initial={product.documents} />

        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Фото</h2>
            <ImageUploadButton multiple folder={`products/${product.slug}`} onUploaded={(url) => setImages((l) => (l.includes(url) ? l : [...l, url]))} />
          </div>
          {images.length ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {images.map((src, index) => (
                <li key={`${src}-${index}`} className="relative rounded-lg border bg-white p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="aspect-square w-full object-contain" />
                  {index === 0 && (
                    <span className="absolute top-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      Головне
                    </span>
                  )}
                  <div className="mt-2 flex justify-center gap-1">
                    <IconButton label="Ліворуч" onClick={() => move(index, -1)}>
                      <ArrowUp className="size-3.5 -rotate-90" />
                    </IconButton>
                    <IconButton label="Праворуч" onClick={() => move(index, 1)}>
                      <ArrowDown className="size-3.5 -rotate-90" />
                    </IconButton>
                    <IconButton label="Прибрати" onClick={() => setImages((l) => l.filter((_, i) => i !== index))}>
                      <X className="size-3.5" />
                    </IconButton>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Фото немає.</p>
          )}
        </Card>
      </div>

      <div className="space-y-5">
        <Card className="space-y-3">
          <h2 className="font-semibold">Показ на сайті</h2>
          <div className="flex flex-col gap-2">
            <Checkbox name="in_stock" label="В наявності" defaultChecked={product.in_stock} />
            <Checkbox name="is_hidden" label="Приховати з сайту" defaultChecked={product.is_hidden} />
          </div>
          <Field label="Кнопка на картці">
            <select name="cta_type" defaultValue={product.cta_type} className={inputClass}>
              <option value="buy">Купити (у кошик)</option>
              <option value="request">Запит ціни / консультація</option>
            </select>
          </Field>
          <Field label="Порядок у категорії" hint="Менше число — вище в списку.">
            <input name="sort" defaultValue={product.sort} inputMode="numeric" className={inputClass} />
          </Field>
        </Card>

        <ProductCollections productId={product.id} options={collections} />

        <Card className="space-y-2 text-sm">
          <h2 className="font-semibold">Ідентифікатори</h2>
          <p className="text-xs text-muted-foreground">
            Адреса сторінки й артикул використовуються в рекламі (Meta Pixel, каталог товарів), тому тут не
            редагуються.
          </p>
          <dl className="space-y-1 text-xs">
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <dt className="text-muted-foreground">Артикул</dt>
              <dd className="font-mono">{product.sku ?? "—"}</dd>
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <dt className="text-muted-foreground">Адреса</dt>
              <dd className="font-mono break-all">
                /catalog/{product.category}/{product.slug}
              </dd>
            </div>
          </dl>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton>Зберегти товар</SubmitButton>
          <FormMessage state={state} />
        </div>
      </div>
    </form>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-7 items-center justify-center rounded-md border hover:bg-muted"
    >
      {children}
    </button>
  );
}
