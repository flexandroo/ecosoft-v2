"use client";

import { useActionState, useState } from "react";
import { CATEGORY_GROUPS, type StoreCategory } from "@/lib/categories-shared";
import { saveCategory, type FormState } from "../../../actions";
import { FormMessage, SubmitButton } from "../../form-status";
import { ImageUploadButton } from "../../image-upload";
import { Card, Checkbox, Field, inputClass, textareaClass } from "../../ui";

export function CategoryForm({ category }: { category: StoreCategory }) {
  const [state, action] = useActionState<FormState, FormData>(saveCategory, null);
  const [image, setImage] = useState(category.image);
  const [metaLength, setMetaLength] = useState(category.metaDescription.length);

  return (
    <form action={action} className="grid gap-5 xl:grid-cols-[1fr_340px]">
      <input type="hidden" name="key" value={category.key} />
      <input type="hidden" name="image" value={image} />

      <div className="space-y-5">
        <Card className="space-y-4">
          <Field label="Назва">
            <input name="title" defaultValue={category.title} required maxLength={120} className={inputClass} />
          </Field>
          <Field label="Коротка назва" hint="На кнопках-категоріях у каталозі та на телефоні.">
            <input name="short_title" defaultValue={category.short} maxLength={40} className={inputClass} />
          </Field>
          <Field label="Підзаголовок" hint="Під назвою у шапці сторінки категорії.">
            <textarea name="subtitle" defaultValue={category.subtitle} rows={2} maxLength={300} className={textareaClass} />
          </Field>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold">SEO</h2>
          <Field label="Заголовок сторінки (title)" hint="Порожньо — використовується назва категорії.">
            <input name="seo_title" defaultValue={category.seoTitle} maxLength={120} className={inputClass} />
          </Field>
          <Field label={`Meta description (${metaLength}/160)`} hint="Опис у результатах Google. Порожньо — стандартний текст.">
            <textarea
              name="meta_description"
              defaultValue={category.metaDescription}
              rows={2}
              maxLength={300}
              onChange={(e) => setMetaLength(e.target.value.length)}
              className={textareaClass}
            />
          </Field>
          <Field label="SEO-текст під товарами" hint="Абзаци розділяйте порожнім рядком. Порожньо — блок не показується.">
            <textarea name="seo_text" defaultValue={category.seoText} rows={8} maxLength={8000} className={textareaClass} />
          </Field>
        </Card>
      </div>

      <div className="space-y-5">
        <Card className="space-y-3">
          <h2 className="font-semibold">Показ</h2>
          <Checkbox name="is_hidden" label="Приховати з меню й головної" defaultChecked={category.hidden} />
          <Field label="Група в меню «Каталог»">
            <select name="group_key" defaultValue={category.group} className={inputClass}>
              {CATEGORY_GROUPS.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.title}
                </option>
              ))}
            </select>
          </Field>
        </Card>

        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Картинка</h2>
            <ImageUploadButton folder="categories" onUploaded={setImage} />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="aspect-[16/9] w-full rounded-lg border object-cover" />
          <p className="text-xs text-muted-foreground">У шапці сторінки категорії та в соцмережах. Рекомендовано 1600×900.</p>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton>Зберегти категорію</SubmitButton>
          <FormMessage state={state} />
        </div>
      </div>
    </form>
  );
}
