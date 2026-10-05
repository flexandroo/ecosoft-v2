"use client";

import { useActionState, useTransition } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { createCollection, moveCollection, setCollectionOnHome, type FormState } from "../../actions";
import { FormMessage, SubmitButton } from "../form-status";
import { Field, inputClass } from "../ui";

function useGuarded() {
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<void>) =>
    startTransition(async () => {
      try {
        await fn();
      } catch {
        alert("Не вдалося зберегти зміну. Оновіть сторінку і спробуйте ще раз.");
      }
    });
  return { pending, run };
}

export function CollectionRowControls({ id, onHome, first, last }: { id: string; onHome: boolean; first: boolean; last: boolean }) {
  const { pending, run } = useGuarded();
  return (
    <>
      <td className="px-4 py-2.5">
        <input
          type="checkbox"
          aria-label="Показувати на головній"
          checked={onHome}
          disabled={pending}
          onChange={(e) => run(() => setCollectionOnHome(id, e.target.checked))}
          className="size-4 accent-primary"
        />
      </td>
      <td className="px-4 py-2.5">
        <div className="flex justify-end gap-1">
          <OrderButton label="Вище" disabled={pending || first} onClick={() => run(() => moveCollection(id, "up"))} up />
          <OrderButton label="Нижче" disabled={pending || last} onClick={() => run(() => moveCollection(id, "down"))} />
        </div>
      </td>
    </>
  );
}

export function OrderButton({
  label,
  disabled,
  onClick,
  up,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  up?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-md border hover:bg-muted disabled:opacity-30"
    >
      {up ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />}
    </button>
  );
}

export function NewCollectionForm() {
  const [state, action] = useActionState<FormState, FormData>(createCollection, null);
  return (
    <form action={action} className="space-y-3">
      <Field label="Назва" hint="Напр. «Новинки», «Для будинку», «Комплекти зі знижкою».">
        <input name="title" required maxLength={120} className={inputClass} />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingLabel="Створюємо…">Створити</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
