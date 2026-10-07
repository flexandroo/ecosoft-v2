"use client";

import { useActionState, useState, useTransition, useRef } from "react";
import { ChevronDown, ExternalLink, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_PAGES,
  PAGE_ICONS,
  PAGE_META,
  PAGE_TOKENS,
  SECTION_LIMITS,
  SECTION_TYPES,
  type PageIcon,
  type PageKey,
  type PageSection,
  type SectionType,
  type SitePage,
} from "@/lib/pages-shared";
import { cn } from "@/lib/utils";
import { resetPage, savePage } from "../../../_actions/pages";
import type { FormState } from "../../../_actions/form-state";
import { OrderButton } from "../../collections/controls";
import { FormMessage, SubmitButton } from "../../form-status";
import { ImageUploadButton } from "../../image-upload";
import { Card, Field, inputClass, textareaClass } from "../../ui";
import { useUnsavedChanges } from "../../use-unsaved-changes";

// Client-only ids keep inputs stable while sections and items move; the server ignores them.
type WithId<T> = T & { _id: number };
type EditorSection = WithId<PageSection>;
let nextId = 1;
const withId = <T extends object>(value: T): WithId<T> => ({ ...value, _id: nextId++ });

const BLANK: Record<Exclude<SectionType, "requisites" | "contacts">, PageSection> = {
  text: { type: "text", eyebrow: "", title: "", lead: "", body: "", boxed: false },
  cards: { type: "cards", eyebrow: "", title: "", lead: "", layout: "stacked", columns: 3, items: [{ icon: "CheckCircle2", title: "", text: "" }] },
  steps: { type: "steps", eyebrow: "", title: "", lead: "", layout: "list", items: [{ title: "", text: "" }] },
  notes: { type: "notes", eyebrow: "", title: "", lead: "", items: [""] },
  cta: { type: "cta", layout: "note", title: "", text: "", primaryLabel: "Звʼязатися з менеджером", primaryHref: "/contacts", secondaryLabel: "", secondaryHref: "" },
};

function move<T>(list: T[], index: number, delta: -1 | 1): T[] {
  const next = [...list];
  [next[index], next[index + delta]] = [next[index + delta], next[index]];
  return next;
}

export function PageEditor({ pageKey, initial, edited }: { pageKey: PageKey; initial: SitePage; edited: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(savePage, null);
  const formRef = useRef<HTMLFormElement>(null);
  useUnsavedChanges(formRef, state);
  const [page, setPage] = useState<SitePage>(initial);
  const [sections, setSections] = useState<EditorSection[]>(() => initial.sections.map(withId));
  const [open, setOpen] = useState<number | null>(null);
  const [addType, setAddType] = useState<keyof typeof BLANK>("text");
  const [resetting, startReset] = useTransition();
  const meta = PAGE_META[pageKey];

  const set = <K extends keyof SitePage>(key: K, value: SitePage[K]) => setPage((p) => ({ ...p, [key]: value }));
  const update = (id: number, patch: Partial<PageSection>) =>
    setSections((list) => list.map((s) => (s._id === id ? ({ ...s, ...patch } as EditorSection) : s)));

  const loadDefaults = () => {
    if (!confirm("Підставити стандартний текст сторінки у форму? Зміни на сайті зʼявляться після збереження.")) return;
    const d = DEFAULT_PAGES[pageKey];
    setPage(d);
    setSections(d.sections.map(withId));
  };

  return (
    <form ref={formRef} action={action} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <input type="hidden" name="key" value={pageKey} />
      <input type="hidden" name="payload" value={JSON.stringify({ ...page, sections })} />

      <div className="min-w-0 space-y-5">
        <Card className="space-y-4">
          <h2 className="font-semibold">Шапка сторінки</h2>
          <Field label="Заголовок (H1)">
            <input value={page.title} onChange={(e) => set("title", e.target.value)} required maxLength={200} className={inputClass} />
          </Field>
          <Field label="Підзаголовок">
            <textarea value={page.subtitle} onChange={(e) => set("subtitle", e.target.value)} rows={2} maxLength={600} className={textareaClass} />
          </Field>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">Фото в шапці</p>
              <span className="flex items-center gap-2">
                <ImageUploadButton folder="pages" onUploaded={(url) => set("image", url)} />
                {page.image && (
                  <button type="button" onClick={() => set("image", "")} className="text-sm text-muted-foreground hover:text-foreground">
                    Прибрати
                  </button>
                )}
              </span>
            </div>
            {page.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={page.image} alt="" className="max-h-40 w-full rounded-lg border object-cover" />
            ) : (
              <div className="flex h-16 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Без фото: шапка буде світлою
              </div>
            )}
            {page.image && (
              <Field label="Опис фото (alt)">
                <input value={page.imageAlt} onChange={(e) => set("imageAlt", e.target.value)} maxLength={200} className={inputClass} />
              </Field>
            )}
          </div>
        </Card>

        <div className="space-y-3">
          <h2 className="font-semibold">Секції</h2>
          {sections.map((section, i) => {
            const info = SECTION_TYPES[section.type];
            const title = "title" in section ? section.title : "";
            const expanded = open === section._id;
            return (
              <Card key={section._id} className="p-0 sm:p-0">
                <div className="flex items-center gap-2 p-3 sm:px-4">
                  <button
                    type="button"
                    onClick={() => setOpen(expanded ? null : section._id)}
                    aria-expanded={expanded}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <ChevronDown className={cn("size-4 shrink-0 transition-transform", !expanded && "-rotate-90")} />
                    <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{info.label}</span>
                    <span className="truncate text-sm font-medium">{title || (section.type === "contacts" ? "" : "Без заголовка")}</span>
                  </button>
                  <OrderButton label="Секцію вище" up disabled={i === 0} onClick={() => setSections((l) => move(l, i, -1))} />
                  <OrderButton label="Секцію нижче" disabled={i === sections.length - 1} onClick={() => setSections((l) => move(l, i, 1))} />
                  {!info.system && (
                    <IconButton
                      label="Видалити секцію"
                      onClick={() => {
                        if (confirm(`Видалити секцію «${title || info.label}»?`)) setSections((l) => l.filter((s) => s._id !== section._id));
                      }}
                    />
                  )}
                </div>
                {expanded && (
                  <div className="space-y-4 border-t p-3 sm:p-4">
                    <SectionFields section={section} onChange={(patch) => update(section._id, patch)} />
                  </div>
                )}
              </Card>
            );
          })}
          <div className="flex flex-wrap items-center gap-2">
            <select value={addType} onChange={(e) => setAddType(e.target.value as keyof typeof BLANK)} className={`${inputClass} w-auto`}>
              {(Object.keys(BLANK) as (keyof typeof BLANK)[]).map((t) => (
                <option key={t} value={t}>
                  {SECTION_TYPES[t].label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={sections.length >= SECTION_LIMITS.sections}
              onClick={() => {
                const created = withId(structuredClone(BLANK[addType]));
                setSections((l) => [...l, created]);
                setOpen(created._id);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-background px-3 text-sm font-medium hover:bg-muted disabled:opacity-40"
            >
              <Plus className="size-4" /> Додати секцію
            </button>
            <span className="text-xs text-muted-foreground">{SECTION_TYPES[addType].hint}</span>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <Card className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton>Зберегти сторінку</SubmitButton>
            <a href={meta.path} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              На сайті <ExternalLink className="size-3.5" />
            </a>
          </div>
          <FormMessage state={state} />
          <div className="flex flex-col items-start gap-1 border-t pt-3 text-sm">
            <button type="button" onClick={loadDefaults} className="text-muted-foreground hover:text-foreground">
              Підставити стандартний текст у форму
            </button>
            {edited && (
              <button
                type="button"
                disabled={resetting}
                onClick={() => {
                  if (confirm("Повернути на сайті стандартний текст сторінки? Ваша редакція буде видалена.")) {
                    startReset(async () => {
                      await resetPage(pageKey);
                      const d = DEFAULT_PAGES[pageKey];
                      setPage(d);
                      setSections(d.sections.map(withId));
                    });
                  }
                }}
                className="text-rose-700 hover:underline disabled:opacity-50"
              >
                {resetting ? "Повертаємо…" : "Повернути стандартну сторінку на сайті"}
              </button>
            )}
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold">Пошук Google</h2>
          <Field label="SEO-заголовок" hint={`Порожньо — береться заголовок. ${page.seoTitle.length}/60`}>
            <input value={page.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} maxLength={120} className={inputClass} />
          </Field>
          <Field label="SEO-опис" hint={`Порожньо — береться підзаголовок. ${page.metaDescription.length}/160`}>
            <textarea value={page.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} rows={3} maxLength={300} className={textareaClass} />
          </Field>
        </Card>

        <Card className="space-y-2 text-sm">
          <h2 className="font-semibold">Підказки до тексту</h2>
          <ul className="space-y-1 text-muted-foreground">
            <li>Абзаци — через порожній рядок.</li>
            <li>
              <code className="rounded bg-muted px-1">## </code> на початку — підзаголовок.
            </li>
            <li>
              <code className="rounded bg-muted px-1">- </code> на початку рядка — пункт списку.
            </li>
            <li>
              <code className="rounded bg-muted px-1">**слово**</code> — жирний.
            </li>
            <li>
              <code className="rounded bg-muted px-1">[текст](/delivery)</code> — посилання.
            </li>
          </ul>
          <p className="pt-1 font-medium">Дані з «Налаштувань»</p>
          <ul className="space-y-1 text-muted-foreground">
            {PAGE_TOKENS.map((t) => (
              <li key={t.token}>
                <code className="rounded bg-muted px-1">{t.token}</code> — {t.label}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </form>
  );
}

function SectionFields({ section, onChange }: { section: PageSection; onChange: (patch: Partial<PageSection>) => void }) {
  const headingFields = "eyebrow" in section && (
    <div className="grid gap-3 sm:grid-cols-[200px_minmax(0,1fr)]">
      <Field label="Надпис над заголовком">
        <input value={section.eyebrow} onChange={(e) => onChange({ eyebrow: e.target.value })} maxLength={80} className={inputClass} />
      </Field>
      <Field label="Заголовок секції">
        <input value={section.title} onChange={(e) => onChange({ title: e.target.value })} maxLength={200} className={inputClass} />
      </Field>
      <Field label="Вступ під заголовком" className="sm:col-span-2">
        <textarea value={section.lead} onChange={(e) => onChange({ lead: e.target.value })} rows={2} maxLength={600} className={textareaClass} />
      </Field>
    </div>
  );

  switch (section.type) {
    case "text":
      return (
        <>
          {headingFields}
          <Field label="Текст">
            <textarea
              value={section.body}
              onChange={(e) => onChange({ body: e.target.value })}
              rows={8}
              maxLength={SECTION_LIMITS.body}
              className={`${textareaClass} font-mono text-[13px] leading-relaxed`}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={section.boxed} onChange={(e) => onChange({ boxed: e.target.checked })} className="size-4 accent-primary" />
            Показати текст у рамці
          </label>
        </>
      );

    case "cards":
      return (
        <>
          {headingFields}
          <div className="flex flex-wrap gap-3">
            <Field label="Вигляд">
              <select value={section.layout} onChange={(e) => onChange({ layout: e.target.value as "stacked" | "inline" })} className={inputClass}>
                <option value="stacked">Іконка над заголовком</option>
                <option value="inline">Іконка зліва</option>
              </select>
            </Field>
            <Field label="Колонок на ПК">
              <select value={section.columns} onChange={(e) => onChange({ columns: Number(e.target.value) as 2 | 3 | 4 })} className={inputClass}>
                {[2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <ItemList
            items={section.items}
            onChange={(items) => onChange({ items })}
            blank={{ icon: "CheckCircle2" as PageIcon, title: "", text: "" }}
            addLabel="Додати картку"
            render={(item, setItem) => (
              <>
                <div className="grid gap-2 sm:grid-cols-[170px_minmax(0,1fr)]">
                  <select value={item.icon} onChange={(e) => setItem({ ...item, icon: e.target.value as PageIcon })} aria-label="Іконка" className={inputClass}>
                    {(Object.keys(PAGE_ICONS) as PageIcon[]).map((icon) => (
                      <option key={icon} value={icon}>
                        {PAGE_ICONS[icon]}
                      </option>
                    ))}
                  </select>
                  <input value={item.title} onChange={(e) => setItem({ ...item, title: e.target.value })} placeholder="Заголовок картки" aria-label="Заголовок картки" className={inputClass} />
                </div>
                <textarea value={item.text} onChange={(e) => setItem({ ...item, text: e.target.value })} rows={2} placeholder="Текст" aria-label="Текст картки" className={textareaClass} />
              </>
            )}
          />
        </>
      );

    case "steps":
      return (
        <>
          {headingFields}
          <Field label="Вигляд">
            <select value={section.layout} onChange={(e) => onChange({ layout: e.target.value as "list" | "cards" })} className={`${inputClass} w-auto`}>
              <option value="list">Нумерований список</option>
              <option value="cards">Картки 01, 02…</option>
            </select>
          </Field>
          <ItemList
            items={section.items}
            onChange={(items) => onChange({ items })}
            blank={{ title: "", text: "" }}
            addLabel="Додати крок"
            render={(item, setItem) => (
              <>
                <input value={item.title} onChange={(e) => setItem({ ...item, title: e.target.value })} placeholder="Заголовок кроку (необовʼязково)" aria-label="Заголовок кроку" className={inputClass} />
                <textarea value={item.text} onChange={(e) => setItem({ ...item, text: e.target.value })} rows={2} placeholder="Текст" aria-label="Текст кроку" className={textareaClass} />
              </>
            )}
          />
        </>
      );

    case "notes":
      return (
        <>
          {headingFields}
          <Field label="Пункти" hint="Кожен пункт з нового рядка.">
            <textarea
              value={section.items.join("\n")}
              onChange={(e) => onChange({ items: e.target.value.split("\n") })}
              rows={7}
              className={textareaClass}
            />
          </Field>
        </>
      );

    case "cta":
      return (
        <>
          <Field label="Вигляд">
            <select value={section.layout} onChange={(e) => onChange({ layout: e.target.value as "note" | "banner" })} className={`${inputClass} w-auto`}>
              <option value="note">Світлий блок</option>
              <option value="banner">Темний банер</option>
            </select>
          </Field>
          <Field label="Заголовок" hint="Для світлого блоку можна залишити порожнім.">
            <input value={section.title} onChange={(e) => onChange({ title: e.target.value })} maxLength={200} className={inputClass} />
          </Field>
          <Field label="Текст">
            <textarea value={section.text} onChange={(e) => onChange({ text: e.target.value })} rows={2} maxLength={1000} className={textareaClass} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Головна кнопка">
              <input value={section.primaryLabel} onChange={(e) => onChange({ primaryLabel: e.target.value })} maxLength={80} className={inputClass} />
            </Field>
            <Field label="Посилання">
              <input value={section.primaryHref} onChange={(e) => onChange({ primaryHref: e.target.value.trim() })} placeholder="/contacts" className={inputClass} />
            </Field>
            <Field label="Друга кнопка (необовʼязково)">
              <input value={section.secondaryLabel} onChange={(e) => onChange({ secondaryLabel: e.target.value })} maxLength={80} className={inputClass} />
            </Field>
            <Field label="Посилання">
              <input value={section.secondaryHref} onChange={(e) => onChange({ secondaryHref: e.target.value.trim() })} placeholder="/catalog" className={inputClass} />
            </Field>
          </div>
        </>
      );

    case "requisites":
      return (
        <>
          {headingFields}
          <p className="text-sm text-muted-foreground">Продавець, IBAN, банк, ЄДРПОУ і телефони беруться з «Налаштувань».</p>
        </>
      );

    case "contacts":
      return (
        <p className="text-sm text-muted-foreground">
          Телефони, email, адреса і графік беруться з «Налаштувань», поруч — форма звернення. Секцію можна перемістити, але не видалити.
        </p>
      );
  }
}

function ItemList<T extends object>({
  items,
  onChange,
  blank,
  addLabel,
  render,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  blank: T;
  addLabel: string;
  render: (item: T, setItem: (item: T) => void) => React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 rounded-lg border p-2.5">
            <div className="min-w-0 flex-1 space-y-2">{render(item, (next) => onChange(items.map((x, j) => (j === i ? next : x))))}</div>
            <div className="flex flex-col gap-1">
              <OrderButton label="Вище" up disabled={i === 0} onClick={() => onChange(move(items, i, -1))} />
              <OrderButton label="Нижче" disabled={i === items.length - 1} onClick={() => onChange(move(items, i, 1))} />
              <IconButton label="Видалити пункт" onClick={() => onChange(items.filter((_, j) => j !== i))} />
            </div>
          </li>
        ))}
      </ul>
      <Button type="button" variant="outline" size="sm" disabled={items.length >= SECTION_LIMITS.items} onClick={() => onChange([...items, { ...blank }])}>
        <Plus className="size-3.5" /> {addLabel}
      </Button>
    </div>
  );
}

function IconButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-md border text-muted-foreground hover:bg-muted hover:text-rose-700"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
