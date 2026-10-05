"use client";

import { useTransition } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { moveCategory, setCategoryHidden } from "../../actions";

export function CategoryRowControls({
  categoryKey,
  hidden,
  first,
  last,
}: {
  categoryKey: string;
  hidden: boolean;
  first: boolean;
  last: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<void>) =>
    startTransition(async () => {
      try {
        await fn();
      } catch {
        alert("Не вдалося зберегти зміну. Оновіть сторінку і спробуйте ще раз.");
      }
    });

  return (
    <>
      <td className="px-4 py-2">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={!hidden}
            disabled={pending}
            onChange={(e) => run(() => setCategoryHidden(categoryKey, !e.target.checked))}
            className="size-4 accent-primary"
          />
          {hidden ? "Прихована" : "У меню"}
        </label>
      </td>
      <td className="px-4 py-2">
        <div className="flex justify-end gap-1">
          <button
            type="button"
            aria-label="Вище"
            disabled={pending || first}
            onClick={() => run(() => moveCategory(categoryKey, "up"))}
            className="grid size-8 place-items-center rounded-md border hover:bg-muted disabled:opacity-30"
          >
            <ArrowUp className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Нижче"
            disabled={pending || last}
            onClick={() => run(() => moveCategory(categoryKey, "down"))}
            className="grid size-8 place-items-center rounded-md border hover:bg-muted disabled:opacity-30"
          >
            <ArrowDown className="size-4" />
          </button>
        </div>
      </td>
    </>
  );
}
