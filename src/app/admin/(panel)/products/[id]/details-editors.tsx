"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Card, inputClass } from "../../ui";

export type SpecRow = { label: string; value: string };
export type DocumentRow = { name: string; href: string; size?: string };

type Row<T> = T & { _key: number };
let nextKey = 0;
const withKeys = <T,>(rows: T[]): Row<T>[] => rows.map((r) => ({ ...r, _key: nextKey++ }));

function moveItem<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function RowButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border hover:bg-muted"
    >
      {children}
    </button>
  );
}

/**
 * Characteristics table. Names suggested from the category keep one spelling per
 * property; units, ranges and decimals are unified on save.
 */
export function SpecsEditor({ initial, suggestions }: { initial: SpecRow[]; suggestions: string[] }) {
  const [rows, setRows] = useState(() => withKeys(initial));
  const update = (key: number, patch: Partial<SpecRow>) =>
    setRows((list) => list.map((r) => (r._key === key ? { ...r, ...patch } : r)));

  return (
    <Card>
      <input type="hidden" name="specs" value={JSON.stringify(rows.map(({ label, value }) => ({ label, value })))} />
      <datalist id="spec-labels">
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Характеристики</h2>
        <span className="text-xs text-muted-foreground">Одиниці (°C, м³), діапазони й коми вирівнюються при збереженні.</span>
      </div>
      {rows.length ? (
        <ul className="space-y-2">
          {rows.map((row, index) => (
            <li key={row._key} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              <input
                list="spec-labels"
                value={row.label}
                onChange={(e) => update(row._key, { label: e.target.value })}
                placeholder="Назва, напр. Робочий тиск, бар"
                aria-label="Назва характеристики"
                className={`${inputClass} sm:w-[45%]`}
              />
              <input
                value={row.value}
                onChange={(e) => update(row._key, { value: e.target.value })}
                placeholder="Значення"
                aria-label="Значення характеристики"
                className={`${inputClass} min-w-0 flex-1`}
              />
              <RowButton label="Вище" onClick={() => setRows((l) => moveItem(l, index, -1))}>
                <ArrowUp className="size-3.5" />
              </RowButton>
              <RowButton label="Нижче" onClick={() => setRows((l) => moveItem(l, index, 1))}>
                <ArrowDown className="size-3.5" />
              </RowButton>
              <RowButton label="Прибрати" onClick={() => setRows((l) => l.filter((r) => r._key !== row._key))}>
                <X className="size-3.5" />
              </RowButton>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Характеристик немає.</p>
      )}
      <button
        type="button"
        onClick={() => setRows((l) => [...l, ...withKeys([{ label: "", value: "" }])])}
        className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium hover:bg-muted"
      >
        <Plus className="size-4" /> Додати характеристику
      </button>
    </Card>
  );
}

/** Instruction manuals, certificates and similar links shown in the "Документи" tab. */
export function DocumentsEditor({ initial }: { initial: DocumentRow[] }) {
  const [rows, setRows] = useState(() => withKeys(initial));
  const update = (key: number, patch: Partial<DocumentRow>) =>
    setRows((list) => list.map((r) => (r._key === key ? { ...r, ...patch } : r)));

  return (
    <Card>
      <input
        type="hidden"
        name="documents"
        value={JSON.stringify(rows.map(({ name, href, size }) => ({ name, href, size })))}
      />
      <h2 className="mb-3 font-semibold">Документи</h2>
      {rows.length ? (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row._key} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              <input
                value={row.name}
                onChange={(e) => update(row._key, { name: e.target.value })}
                placeholder="Назва, напр. Інструкція (PDF)"
                aria-label="Назва документа"
                className={`${inputClass} sm:w-[40%]`}
              />
              <input
                value={row.href}
                onChange={(e) => update(row._key, { href: e.target.value })}
                placeholder="/documents/… або https://…"
                aria-label="Посилання на документ"
                className={`${inputClass} min-w-0 flex-1 font-mono text-xs`}
              />
              <RowButton label="Прибрати" onClick={() => setRows((l) => l.filter((r) => r._key !== row._key))}>
                <X className="size-3.5" />
              </RowButton>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Документів немає.</p>
      )}
      <button
        type="button"
        onClick={() => setRows((l) => [...l, ...withKeys([{ name: "", href: "" }])])}
        className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium hover:bg-muted"
      >
        <Plus className="size-4" /> Додати документ
      </button>
    </Card>
  );
}
