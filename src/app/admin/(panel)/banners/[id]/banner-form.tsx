"use client";

import { useActionState, useState } from "react";
import { BANNER_PLACEMENTS } from "@/lib/admin/constants";
import { deleteBanner, saveBanner, type FormState } from "../../../actions";
import { FormMessage, SubmitButton } from "../../form-status";
import { ImageUploadButton } from "../../image-upload";
import { Card, Checkbox, Field, inputClass } from "../../ui";

export type EditableBanner = {
  id: string;
  placement: "hero" | "side";
  eyebrow: string;
  title: string;
  subtitle: string;
  cta_label: string;
  href: string;
  image_desktop: string | null;
  image_mobile: string | null;
  theme: "dark" | "light";
  sort: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

/** ISO timestamp -> value for <input type="datetime-local"> in Kyiv time. */
function toLocalInput(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return parts.replace(" ", "T");
}

export function BannerForm({ banner }: { banner: EditableBanner }) {
  const [state, action] = useActionState<FormState, FormData>(saveBanner, null);
  const [desktop, setDesktop] = useState(banner.image_desktop ?? "");
  const [mobile, setMobile] = useState(banner.image_mobile ?? "");

  return (
    <>
      <form action={action} className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <input type="hidden" name="id" value={banner.id} />
        <input type="hidden" name="image_desktop" value={desktop} />
        <input type="hidden" name="image_mobile" value={mobile} />

        <div className="space-y-5">
          <Card className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Де показувати">
                <select name="placement" defaultValue={banner.placement} className={inputClass}>
                  {BANNER_PLACEMENTS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Надпис над заголовком">
                <input name="eyebrow" defaultValue={banner.eyebrow} maxLength={120} className={inputClass} />
              </Field>
            </div>
            <Field label="Заголовок">
              <input name="title" defaultValue={banner.title} required maxLength={200} className={inputClass} />
            </Field>
            <Field label="Підзаголовок">
              <input name="subtitle" defaultValue={banner.subtitle} maxLength={300} className={inputClass} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Текст кнопки">
                <input name="cta_label" defaultValue={banner.cta_label} maxLength={60} className={inputClass} />
              </Field>
              <Field label="Посилання" hint="Напр. /catalog/reverse-osmosis або https://…">
                <input name="href" defaultValue={banner.href} required className={inputClass} />
              </Field>
            </div>
          </Card>

          <Card className="space-y-4">
            <ImageSlot label="Зображення для компʼютера" hint="Рекомендовано 1600×700" value={desktop} onChange={setDesktop} />
            <ImageSlot
              label="Зображення для телефона"
              hint="Рекомендовано 900×1100. Якщо порожньо — береться компʼютерне."
              value={mobile}
              onChange={setMobile}
            />
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="space-y-3">
            <h2 className="font-semibold">Показ</h2>
            <Checkbox name="is_active" label="Увімкнено" defaultChecked={banner.is_active} />
            <Field label="Тема тексту">
              <select name="theme" defaultValue={banner.theme} className={inputClass}>
                <option value="dark">Світлий текст на темному фото</option>
                <option value="light">Темний текст на світлому фото</option>
              </select>
            </Field>
            <Field label="Порядок" hint="Менше число — раніше.">
              <input name="sort" defaultValue={banner.sort} inputMode="numeric" className={inputClass} />
            </Field>
            <Field label="Показувати з" hint="Київський час. Порожньо — одразу.">
              <KyivDateInput name="starts_at" defaultValue={toLocalInput(banner.starts_at)} />
            </Field>
            <Field label="Показувати до" hint="Порожньо — без обмеження.">
              <KyivDateInput name="ends_at" defaultValue={toLocalInput(banner.ends_at)} />
            </Field>
          </Card>
          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton>Зберегти банер</SubmitButton>
            <FormMessage state={state} />
          </div>
        </div>
      </form>

      {banner.id && (
        <form
          action={deleteBanner}
          className="mt-8 border-t pt-5"
          onSubmit={(event) => {
            if (!confirm("Видалити банер?")) event.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={banner.id} />
          <button type="submit" className="text-sm font-medium text-rose-700 hover:underline">
            Видалити банер
          </button>
        </form>
      )}
    </>
  );
}

/**
 * datetime-local has no timezone; we keep the Kyiv wall time the manager typed
 * and send it with Kyiv's current UTC offset so the server stores the right instant.
 */
function KyivDateInput({ name, defaultValue }: { name: string; defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  const withOffset = value ? `${value}:00${kyivOffset(value)}` : "";
  return (
    <>
      <input type="datetime-local" value={value} onChange={(e) => setValue(e.target.value)} className={inputClass} />
      <input type="hidden" name={name} value={withOffset} />
    </>
  );
}

function kyivOffset(localValue: string): string {
  const guess = new Date(`${localValue}:00Z`);
  const tz = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Kyiv", timeZoneName: "longOffset" })
    .formatToParts(guess)
    .find((p) => p.type === "timeZoneName")?.value;
  const match = tz?.match(/GMT([+-]\d{2}:\d{2})/);
  return match ? match[1] : "+02:00";
}

function ImageSlot({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className="flex items-center gap-2">
          <ImageUploadButton folder="banners" onUploaded={onChange} />
          {value && (
            <button type="button" onClick={() => onChange("")} className="text-sm text-muted-foreground hover:text-foreground">
              Прибрати
            </button>
          )}
        </div>
      </div>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="max-h-56 w-full rounded-lg border object-cover" />
      ) : (
        <div className="flex h-24 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
          Немає зображення
        </div>
      )}
    </div>
  );
}
