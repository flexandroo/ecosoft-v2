"use client";

import { useActionState, useState, useRef } from "react";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_MENUS,
  MENU_LIMITS,
  isExternalHref,
  isValidMenuHref,
  type HeaderMenuItem,
  type MenuLink,
  type SiteMenus,
} from "@/lib/menus-shared";
import { saveMenus, type FormState } from "../../actions";
import { OrderButton } from "../collections/controls";
import { FormMessage, SubmitButton } from "../form-status";
import { Card, inputClass } from "../ui";
import { useUnsavedChanges } from "../use-unsaved-changes";

export type LinkOption = { href: string; label: string; note?: string };
export type LinkOptionGroup = { title: string; links: LinkOption[] };

// Rows carry a client-only id so inputs keep focus when rows move; the server ignores it.
type Row<T> = T & { id: number };
type EditorState = { header: Row<HeaderMenuItem>[]; footer: Row<{ title: string; links: Row<MenuLink>[] }>[] };

let nextId = 1;
const withId = <T,>(value: T): Row<T> => ({ ...value, id: nextId++ });
const toState = (menus: SiteMenus): EditorState => ({
  header: menus.header.map(withId),
  footer: menus.footer.map((col) => withId({ title: col.title, links: col.links.map(withId) })),
});

function move<T>(list: T[], index: number, delta: -1 | 1): T[] {
  const next = [...list];
  [next[index], next[index + delta]] = [next[index + delta], next[index]];
  return next;
}

export function MenuEditor({ initial, options }: { initial: SiteMenus; options: LinkOptionGroup[] }) {
  const [state, action] = useActionState<FormState, FormData>(saveMenus, null);
  const formRef = useRef<HTMLFormElement>(null);
  useUnsavedChanges(formRef, state);
  const [v, setV] = useState<EditorState>(() => toState(initial));

  const setHeader = (header: EditorState["header"]) => setV((prev) => ({ ...prev, header }));
  const setFooter = (footer: EditorState["footer"]) => setV((prev) => ({ ...prev, footer }));
  const setColumn = (index: number, column: EditorState["footer"][number]) =>
    setFooter(v.footer.map((c, j) => (j === index ? column : c)));

  const resetToDefault = () => {
    if (confirm("Повернути стандартне меню? Ваші зміни на цій сторінці зникнуть (на сайті — після збереження).")) {
      setV(toState(DEFAULT_MENUS));
    }
  };

  return (
    <form ref={formRef} action={action} className="space-y-5">
      <input type="hidden" name="payload" value={JSON.stringify(v)} />

      <Card className="space-y-3">
        <div>
          <h2 className="font-semibold">Шапка</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            «ПК» — темна смужка над шапкою (видно на широких екранах). «Телефон» — блок «Покупцям» у висувному меню.
          </p>
        </div>
        <ul className="divide-y rounded-lg border">
          {v.header.map((item, i) => (
            <li key={item.id} className="p-3">
              <LinkRow
                link={item}
                options={options}
                onChange={(link) => setHeader(v.header.map((h, j) => (j === i ? { ...h, ...link } : h)))}
                first={i === 0}
                last={i === v.header.length - 1}
                onMove={(delta) => setHeader(move(v.header, i, delta))}
                onRemove={() => setHeader(v.header.filter((_, j) => j !== i))}
              >
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={item.desktop}
                      onChange={(e) => setHeader(v.header.map((h, j) => (j === i ? { ...h, desktop: e.target.checked } : h)))}
                      className="size-4 accent-primary"
                    />
                    ПК
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={item.mobile}
                      onChange={(e) => setHeader(v.header.map((h, j) => (j === i ? { ...h, mobile: e.target.checked } : h)))}
                      className="size-4 accent-primary"
                    />
                    Телефон
                  </label>
                  {!item.desktop && !item.mobile && <span className="text-xs text-amber-700">Пункт ніде не показується</span>}
                </div>
              </LinkRow>
            </li>
          ))}
          {!v.header.length && <li className="p-6 text-center text-sm text-muted-foreground">Пунктів немає.</li>}
        </ul>
        <AddButton
          disabled={v.header.length >= MENU_LIMITS.headerItems}
          onClick={() => setHeader([...v.header, withId({ label: "", href: "", desktop: true, mobile: true })])}
        >
          Додати пункт
        </AddButton>
      </Card>

      <Card className="space-y-4">
        <div>
          <h2 className="font-semibold">Футер</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Колонки посилань праворуч від контактів, до {MENU_LIMITS.footerColumns}. Порожні колонки на сайті не показуються.
          </p>
        </div>
        {v.footer.map((col, i) => (
          <section key={col.id} className="space-y-3 rounded-lg border p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={col.title}
                onChange={(e) => setColumn(i, { ...col, title: e.target.value })}
                placeholder="Заголовок колонки, напр. Клієнтам"
                aria-label={`Заголовок колонки ${i + 1}`}
                maxLength={MENU_LIMITS.label}
                className={`${inputClass} min-w-48 flex-1 font-semibold`}
              />
              <OrderButton label="Колонку лівіше" up disabled={i === 0} onClick={() => setFooter(move(v.footer, i, -1))} />
              <OrderButton
                label="Колонку правіше"
                disabled={i === v.footer.length - 1}
                onClick={() => setFooter(move(v.footer, i, 1))}
              />
              <IconButton
                label="Видалити колонку"
                onClick={() => {
                  if (!col.links.length || confirm(`Видалити колонку «${col.title || "без назви"}» з усіма посиланнями?`)) {
                    setFooter(v.footer.filter((_, j) => j !== i));
                  }
                }}
              />
            </div>
            <ul className="divide-y rounded-lg border">
              {col.links.map((link, k) => (
                <li key={link.id} className="p-3">
                  <LinkRow
                    link={link}
                    options={options}
                    onChange={(next) => setColumn(i, { ...col, links: col.links.map((l, j) => (j === k ? { ...l, ...next } : l)) })}
                    first={k === 0}
                    last={k === col.links.length - 1}
                    onMove={(delta) => setColumn(i, { ...col, links: move(col.links, k, delta) })}
                    onRemove={() => setColumn(i, { ...col, links: col.links.filter((_, j) => j !== k) })}
                  />
                </li>
              ))}
              {!col.links.length && <li className="p-4 text-center text-sm text-muted-foreground">Посилань немає.</li>}
            </ul>
            <AddButton
              disabled={col.links.length >= MENU_LIMITS.footerLinks}
              onClick={() => setColumn(i, { ...col, links: [...col.links, withId({ label: "", href: "" })] })}
            >
              Додати посилання
            </AddButton>
          </section>
        ))}
        <AddButton
          disabled={v.footer.length >= MENU_LIMITS.footerColumns}
          onClick={() => setFooter([...v.footer, withId({ title: "", links: [withId({ label: "", href: "" })] })])}
        >
          Додати колонку
        </AddButton>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>Зберегти меню</SubmitButton>
        <Button type="button" variant="outline" size="lg" onClick={resetToDefault}>
          Повернути стандартне
        </Button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

function LinkRow({
  link,
  options,
  onChange,
  first,
  last,
  onMove,
  onRemove,
  children,
}: {
  link: MenuLink;
  options: LinkOptionGroup[];
  onChange: (link: MenuLink) => void;
  first: boolean;
  last: boolean;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
  children?: React.ReactNode;
}) {
  const known = options.flatMap((g) => g.links).find((o) => o.href === link.href);
  let warning = "";
  if (link.href && !isValidMenuHref(link.href)) warning = "Посилання має починатися з «/» (сторінка сайту) або з https://";
  else if (link.href.startsWith("/") && !known && !/^\/catalog\/[^/]+\/[^/]+/.test(link.href.split(/[?#]/)[0])) {
    warning = "Такої сторінки немає в списку — перевірте адресу";
  } else if (known?.note) warning = known.note;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={link.label}
          onChange={(e) => onChange({ ...link, label: e.target.value })}
          placeholder="Назва"
          aria-label="Назва пункту"
          maxLength={MENU_LIMITS.label}
          className={`${inputClass} min-w-40 flex-1 sm:max-w-64`}
        />
        <input
          value={link.href}
          onChange={(e) => onChange({ ...link, href: e.target.value.trim() })}
          placeholder="/delivery або https://…"
          aria-label="Посилання"
          maxLength={MENU_LIMITS.href}
          className={`${inputClass} min-w-40 flex-1 font-mono text-[13px]`}
        />
        <select
          value=""
          aria-label="Вибрати сторінку сайту"
          onChange={(e) => {
            const option = options.flatMap((g) => g.links).find((o) => o.href === e.target.value);
            if (option) onChange({ href: option.href, label: link.label || option.label });
          }}
          className={`${inputClass} w-auto max-w-48`}
        >
          <option value="">Вибрати сторінку…</option>
          {options.map((group) => (
            <optgroup key={group.title} label={group.title}>
              {group.links.map((o) => (
                <option key={o.href} value={o.href}>
                  {o.label}
                  {o.note ? ` (${o.note})` : ""}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <div className="flex gap-1">
          <OrderButton label="Вище" up disabled={first} onClick={() => onMove(-1)} />
          <OrderButton label="Нижче" disabled={last} onClick={() => onMove(1)} />
          <IconButton label="Видалити пункт" onClick={onRemove} />
        </div>
      </div>
      {(children || warning || isExternalHref(link.href)) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {children}
          {isExternalHref(link.href) && !warning && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <ExternalLink className="size-3.5" /> Відкриється в новій вкладці
            </span>
          )}
          {warning && <span className="text-xs text-amber-700">{warning}</span>}
        </div>
      )}
    </div>
  );
}

function AddButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-background px-2.5 text-sm font-medium hover:bg-muted disabled:opacity-40"
    >
      <Plus className="size-4" /> {children}
    </button>
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
