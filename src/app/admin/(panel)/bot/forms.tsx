"use client";

import { useActionState, useRef } from "react";
import { Trash2 } from "lucide-react";
import {
  deleteBroadcast,
  deleteFaq,
  deleteGuide,
  deleteServiceItem,
  messageClient,
  saveBroadcast,
  saveFaq,
  saveGuide,
  saveServiceItem,
  sendBroadcastNow,
} from "../../_actions/bot";
import type { FormState } from "../../_actions/form-state";
import { ConfirmSubmitButton, FormMessage, SubmitButton } from "../form-status";
import { Card, Field, inputClass, textareaClass } from "../ui";
import { useUnsavedChanges } from "../use-unsaved-changes";

type Option = { id: string; label: string };

// ---------------------------------------------------------------------------
// Guides and FAQ
// ---------------------------------------------------------------------------
export function GuideForm({ guide }: { guide: { id: string; title: string; body: string; video_url: string; sort: number; is_published: boolean } | null }) {
  const [state, action] = useActionState<FormState, FormData>(saveGuide, null);
  const ref = useRef<HTMLFormElement>(null);
  useUnsavedChanges(ref, state);
  return (
    <Card>
      <form ref={ref} action={action} className="grid gap-4">
        <input type="hidden" name="id" value={guide?.id ?? ""} />
        <Field label="Назва" hint="Так гайд виглядає кнопкою в боті (до ~60 символів).">
          <input name="title" defaultValue={guide?.title} required maxLength={120} className={inputClass} />
        </Field>
        <Field label="Інструкція" hint="Звичайний текст; нові рядки зберігаються. До 3500 символів.">
          <textarea name="body" defaultValue={guide?.body} rows={12} maxLength={3500} className={textareaClass} />
        </Field>
        <Field label="Посилання на відео" hint="YouTube, Instagram тощо — https://…">
          <input name="video_url" defaultValue={guide?.video_url} type="url" placeholder="https://youtube.com/…" className={inputClass} />
        </Field>
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Порядок" className="w-32">
            <input name="sort" type="number" defaultValue={guide?.sort ?? 0} className={inputClass} />
          </Field>
          <label className="inline-flex items-center gap-2 pb-2 text-sm">
            <input type="checkbox" name="is_published" defaultChecked={guide?.is_published ?? true} className="size-4 accent-primary" />
            Показувати в боті
          </label>
        </div>
        <div className="flex items-center gap-3">
          <SubmitButton>{guide ? "Зберегти" : "Створити"}</SubmitButton>
          <FormMessage state={state} />
        </div>
      </form>
      {guide && <DeleteForm action={deleteGuide} id={guide.id} confirmText="Видалити гайд? Його буде відвʼязано від графіків заміни." />}
    </Card>
  );
}

export function FaqForm({ faq }: { faq: { id: string; question: string; answer: string; sort: number; is_published: boolean } | null }) {
  const [state, action] = useActionState<FormState, FormData>(saveFaq, null);
  const ref = useRef<HTMLFormElement>(null);
  useUnsavedChanges(ref, state);
  return (
    <Card>
      <form ref={ref} action={action} className="grid gap-4">
        <input type="hidden" name="id" value={faq?.id ?? ""} />
        <Field label="Питання" hint="Показується кнопкою в боті (до ~60 символів).">
          <input name="question" defaultValue={faq?.question} required maxLength={120} className={inputClass} />
        </Field>
        <Field label="Відповідь">
          <textarea name="answer" defaultValue={faq?.answer} rows={10} maxLength={3500} className={textareaClass} />
        </Field>
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Порядок" className="w-32">
            <input name="sort" type="number" defaultValue={faq?.sort ?? 0} className={inputClass} />
          </Field>
          <label className="inline-flex items-center gap-2 pb-2 text-sm">
            <input type="checkbox" name="is_published" defaultChecked={faq?.is_published ?? true} className="size-4 accent-primary" />
            Показувати в боті
          </label>
        </div>
        <div className="flex items-center gap-3">
          <SubmitButton>{faq ? "Зберегти" : "Створити"}</SubmitButton>
          <FormMessage state={state} />
        </div>
      </form>
      {faq && <DeleteForm action={deleteFaq} id={faq.id} confirmText="Видалити це питання?" />}
    </Card>
  );
}

function DeleteForm({ action, id, confirmText, extra }: { action: (fd: FormData) => Promise<void>; id: string; confirmText: string; extra?: Record<string, string> }) {
  return (
    <form action={action} className="mt-4 border-t pt-4">
      <input type="hidden" name="id" value={id} />
      {extra && Object.entries(extra).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <ConfirmSubmitButton confirmText={confirmText} className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-700 hover:underline">
        <Trash2 className="size-4" /> Видалити
      </ConfirmSubmitButton>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Replacement schedule rows
// ---------------------------------------------------------------------------
export type ItemValue = { id: string; title: string; interval_days: number; cartridge_product_id: string | null; guide_id: string | null; sort: number };

export function ServiceItemForm({
  productId,
  item,
  cartridges,
  guides,
}: {
  productId: string;
  item: ItemValue | null;
  cartridges: Option[];
  guides: Option[];
}) {
  const [state, action] = useActionState<FormState, FormData>(saveServiceItem, null);
  return (
    <div className="rounded-lg border p-3">
      <form action={action} className="grid gap-3 md:grid-cols-[minmax(0,2fr)_110px_minmax(0,2fr)_minmax(0,2fr)_80px] md:items-end">
        <input type="hidden" name="id" value={item?.id ?? ""} />
        <input type="hidden" name="product_id" value={productId} />
        <Field label="Картридж / ступінь">
          <input name="title" defaultValue={item?.title} required maxLength={100} placeholder="Картриджі 1-2-3" className={inputClass} />
        </Field>
        <Field label="Раз на, днів" hint="180 ≈ 6 міс.">
          <input name="interval_days" type="number" min={7} max={3650} defaultValue={item?.interval_days ?? 180} required className={inputClass} />
        </Field>
        <Field label="Товар для «Замовити»">
          <select name="cartridge_product_id" defaultValue={item?.cartridge_product_id ?? ""} className={inputClass}>
            <option value="">— без кнопки —</option>
            {cartridges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Гайд «Як замінити»">
          <select name="guide_id" defaultValue={item?.guide_id ?? ""} className={inputClass}>
            <option value="">— без гайда —</option>
            {guides.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Порядок">
          <input name="sort" type="number" defaultValue={item?.sort ?? 0} className={inputClass} />
        </Field>
        <div className="flex items-center gap-3 md:col-span-5">
          <SubmitButton pendingLabel="…">{item ? "Зберегти" : "Додати"}</SubmitButton>
          <FormMessage state={state} />
        </div>
      </form>
      {item && (
        <form action={deleteServiceItem} className="mt-2">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="product_id" value={productId} />
          <ConfirmSubmitButton
            confirmText="Видалити цей картридж з графіка? Історія замін клієнтів для нього теж зникне."
            className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 hover:underline"
          >
            <Trash2 className="size-3.5" /> Видалити з графіка
          </ConfirmSubmitButton>
        </form>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Broadcasts
// ---------------------------------------------------------------------------
export type BroadcastValue = {
  id: string;
  topic: string;
  title: string;
  body: string;
  button_label: string;
  button_url: string;
  product_ids: string[];
  due_within_days: number | null;
};

export function BroadcastForm({ broadcast, models }: { broadcast: BroadcastValue | null; models: Option[] }) {
  const [state, action] = useActionState<FormState, FormData>(saveBroadcast, null);
  const ref = useRef<HTMLFormElement>(null);
  useUnsavedChanges(ref, state);
  return (
    <Card>
      <form ref={ref} action={action} className="grid gap-4">
        <input type="hidden" name="id" value={broadcast?.id ?? ""} />
        <Field label="Тип">
          <select name="topic" defaultValue={broadcast?.topic ?? "promo"} className={inputClass}>
            <option value="promo">🎁 Акція (отримують підписані на акції)</option>
            <option value="news">📰 Новина (отримують підписані на новини)</option>
          </select>
        </Field>
        <Field label="Заголовок">
          <input name="title" defaultValue={broadcast?.title} required maxLength={150} className={inputClass} />
        </Field>
        <Field label="Текст">
          <textarea name="body" defaultValue={broadcast?.body} rows={8} maxLength={3500} className={textareaClass} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Текст кнопки" hint="Напр. «Купити зі знижкою». Порожньо — без кнопки.">
            <input name="button_label" defaultValue={broadcast?.button_label} maxLength={60} className={inputClass} />
          </Field>
          <Field label="Посилання кнопки">
            <input name="button_url" type="url" defaultValue={broadcast?.button_url} placeholder="https://sofiivkawater.com/promo" className={inputClass} />
          </Field>
        </div>
        <fieldset className="rounded-lg border p-3">
          <legend className="px-1 text-sm font-medium">Кому надіслати</legend>
          <p className="mb-2 text-xs text-muted-foreground">
            Нічого не обрано — усім, хто підписаний на цей тип. Обрані моделі — лише їхнім власникам.
          </p>
          <div className="grid max-h-64 gap-1 overflow-y-auto sm:grid-cols-2">
            {models.map((m) => (
              <label key={m.id} className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" name="product_ids" value={m.id} defaultChecked={broadcast?.product_ids.includes(m.id)} className="size-4 accent-primary" />
                {m.label}
              </label>
            ))}
          </div>
          <Field label="Лише тим, у кого заміна протягом, днів" hint="Порожньо — без обмеження. Напр. 30 — для акції на картриджі." className="mt-3 max-w-xs">
            <input name="due_within_days" type="number" min={0} max={365} defaultValue={broadcast?.due_within_days ?? ""} className={inputClass} />
          </Field>
        </fieldset>
        <div className="flex items-center gap-3">
          <SubmitButton>{broadcast ? "Зберегти чернетку" : "Створити чернетку"}</SubmitButton>
          <FormMessage state={state} />
        </div>
      </form>
      {broadcast && <DeleteForm action={deleteBroadcast} id={broadcast.id} confirmText="Видалити чернетку?" />}
    </Card>
  );
}

export function SendBroadcastForm({ id, recipients }: { id: string; recipients: number }) {
  return (
    <form action={sendBroadcastNow}>
      <input type="hidden" name="id" value={id} />
      <ConfirmSubmitButton
        confirmText={`Надіслати зараз ${recipients} клієнтам? Скасувати після відправки не можна.`}
        className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        Надіслати {recipients} клієнтам
      </ConfirmSubmitButton>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Message to a customer
// ---------------------------------------------------------------------------
export function MessageClientForm({ clientId, blocked }: { clientId: string; blocked: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(messageClient, null);
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="client_id" value={clientId} />
      <textarea name="text" rows={3} maxLength={3500} placeholder={blocked ? "Клієнт заблокував бота" : "Повідомлення клієнту в боті"} disabled={blocked} className={textareaClass} />
      <div className="flex items-center gap-3">
        <SubmitButton pendingLabel="Надсилаємо…">Надіслати</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
