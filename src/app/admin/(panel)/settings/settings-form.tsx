"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { SOCIAL_LABELS, type SiteSettings } from "@/lib/settings-shared";
import { saveSettings, type FormState } from "../../actions";
import { FormMessage, SubmitButton } from "../form-status";
import { Card, Field, inputClass } from "../ui";

type FormValue = SiteSettings & { telegramExtraChatIds: string[] };

export function SettingsForm({ initial, canEdit }: { initial: FormValue; canEdit: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(saveSettings, null);
  const [v, setV] = useState<FormValue>(initial);

  const set = <K extends keyof FormValue>(key: K, value: FormValue[K]) => setV((prev) => ({ ...prev, [key]: value }));
  const setIn = <K extends "address" | "socials" | "legal">(key: K, field: keyof FormValue[K], value: string) =>
    setV((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="payload" value={JSON.stringify(v)} />
      <fieldset disabled={!canEdit} className="space-y-5">
        {!canEdit && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Змінювати налаштування може лише адміністратор.</p>
        )}

        <Card className="space-y-4">
          <h2 className="font-semibold">Контакти</h2>
          <div className="space-y-2">
            <p className="text-sm font-medium">Телефони</p>
            {v.phones.map((phone, i) => (
              <div key={i} className="flex flex-wrap gap-2">
                <input
                  value={phone.number}
                  onChange={(e) => set("phones", v.phones.map((p, j) => (j === i ? { ...p, number: e.target.value } : p)))}
                  placeholder="+380 50 000 00 00"
                  aria-label={`Телефон ${i + 1}`}
                  className={`${inputClass} max-w-56`}
                />
                <input
                  value={phone.label}
                  onChange={(e) => set("phones", v.phones.map((p, j) => (j === i ? { ...p, label: e.target.value } : p)))}
                  placeholder="Підпис (необовʼязково), напр. Відділ продажів"
                  aria-label={`Підпис телефону ${i + 1}`}
                  className={`${inputClass} min-w-48 flex-1`}
                />
                <IconButton
                  label="Видалити телефон"
                  disabled={v.phones.length < 2}
                  onClick={() => set("phones", v.phones.filter((_, j) => j !== i))}
                />
              </div>
            ))}
            <AddButton onClick={() => set("phones", [...v.phones, { number: "", label: "" }])}>Додати телефон</AddButton>
            <p className="text-xs text-muted-foreground">Перший номер показується в шапці сайту.</p>
          </div>
          <Field label="Email">
            <input type="email" value={v.email} onChange={(e) => set("email", e.target.value)} className={inputClass} />
          </Field>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold">Адреса</h2>
          <Field label="Повна адреса" hint="На сторінках «Контакти» і «Доставка», для маршруту в Google Maps.">
            <input value={v.address.full} onChange={(e) => setIn("address", "full", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Коротка адреса" hint="У шапці сайту і на головній.">
            <input value={v.address.short} onChange={(e) => setIn("address", "short", e.target.value)} className={inputClass} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Вулиця і будинок">
              <input value={v.address.street} onChange={(e) => setIn("address", "street", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Населений пункт">
              <input value={v.address.locality} onChange={(e) => setIn("address", "locality", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Область">
              <input value={v.address.region} onChange={(e) => setIn("address", "region", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Поштовий індекс">
              <input value={v.address.postalCode} onChange={(e) => setIn("address", "postalCode", e.target.value)} className={inputClass} />
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">Ці чотири поля йдуть у мікророзмітку для Google.</p>
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold">Графік роботи</h2>
          {v.hours.map((row, i) => (
            <div key={i} className="flex flex-wrap gap-2">
              <input
                value={row.days}
                onChange={(e) => set("hours", v.hours.map((h, j) => (j === i ? { ...h, days: e.target.value } : h)))}
                placeholder="Пн–Пт"
                aria-label={`Дні ${i + 1}`}
                className={`${inputClass} max-w-32`}
              />
              <input
                value={row.time}
                onChange={(e) => set("hours", v.hours.map((h, j) => (j === i ? { ...h, time: e.target.value } : h)))}
                placeholder="09:00–18:00 або вихідний"
                aria-label={`Години ${i + 1}`}
                className={`${inputClass} min-w-40 flex-1`}
              />
              <IconButton label="Видалити рядок" onClick={() => set("hours", v.hours.filter((_, j) => j !== i))} />
            </div>
          ))}
          <AddButton onClick={() => set("hours", [...v.hours, { days: "", time: "" }])}>Додати рядок</AddButton>
          <p className="text-xs text-muted-foreground">Для вихідних напишіть «вихідний».</p>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold">Соцмережі</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {(Object.keys(SOCIAL_LABELS) as (keyof SiteSettings["socials"])[]).map((key) => (
              <Field key={key} label={SOCIAL_LABELS[key]}>
                <input
                  value={v.socials[key]}
                  onChange={(e) => setIn("socials", key, e.target.value)}
                  placeholder="https://…"
                  className={inputClass}
                />
              </Field>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold">Реквізити для оплати</h2>
          <Field label="Продавець">
            <input value={v.legal.name} onChange={(e) => setIn("legal", "name", e.target.value)} className={inputClass} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="IBAN">
              <input value={v.legal.iban} onChange={(e) => setIn("legal", "iban", e.target.value)} className={`${inputClass} font-mono`} />
            </Field>
            <Field label="Банк">
              <input value={v.legal.bank} onChange={(e) => setIn("legal", "bank", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Код ЄДРПОУ / ІПН">
              <input value={v.legal.edrpou} onChange={(e) => setIn("legal", "edrpou", e.target.value)} className={`${inputClass} font-mono`} />
            </Field>
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold">Сповіщення в Telegram</h2>
          <p className="text-sm text-muted-foreground">
            Нові заявки завжди йдуть в основний чат, налаштований на сервері. Тут можна додати чати, які отримуватимуть копію.
          </p>
          {v.telegramExtraChatIds.map((id, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={id}
                onChange={(e) => set("telegramExtraChatIds", v.telegramExtraChatIds.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder="ID чату, напр. -1001234567890"
                aria-label={`Telegram-чат ${i + 1}`}
                className={`${inputClass} max-w-72 font-mono`}
              />
              <IconButton
                label="Видалити чат"
                onClick={() => set("telegramExtraChatIds", v.telegramExtraChatIds.filter((_, j) => j !== i))}
              />
            </div>
          ))}
          <AddButton onClick={() => set("telegramExtraChatIds", [...v.telegramExtraChatIds, ""])}>Додати чат</AddButton>
          <p className="text-xs text-muted-foreground">Бот має бути доданий у цей чат, інакше повідомлення не дійдуть.</p>
        </Card>

        {canEdit && (
          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton>Зберегти налаштування</SubmitButton>
            <FormMessage state={state} />
          </div>
        )}
      </fieldset>
    </form>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-background px-2.5 text-sm font-medium hover:bg-muted"
    >
      <Plus className="size-4" /> {children}
    </button>
  );
}

function IconButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-9 items-center justify-center rounded-lg border text-muted-foreground hover:bg-muted hover:text-rose-700 disabled:opacity-40"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
