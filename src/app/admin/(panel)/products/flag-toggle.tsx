"use client";

import { useOptimistic, useTransition } from "react";
import { setProductFlag } from "../../actions";

type Flag = "in_stock" | "is_hidden" | "is_hit" | "is_promo";

export function ProductFlagToggle({ id, field, value }: { id: string; field: Flag; value: boolean }) {
  const [pending, startTransition] = useTransition();
  const [checked, setChecked] = useOptimistic(value);
  return (
    <input
      type="checkbox"
      aria-label={field}
      checked={checked}
      disabled={pending}
      className="size-4 cursor-pointer accent-primary disabled:cursor-wait"
      onChange={(event) => {
        const next = event.target.checked;
        startTransition(async () => {
          setChecked(next);
          try {
            await setProductFlag(id, field, next);
          } catch {
            alert("Не вдалося зберегти зміну. Оновіть сторінку і спробуйте ще раз.");
          }
        });
      }}
    />
  );
}
