"use client";

import { useOptimistic, useTransition } from "react";
import { setProductFlag } from "../../_actions/products";

type Flag = "in_stock" | "is_hidden";

export function ProductFlagToggle({ id, field, value }: { id: string; field: Flag; value: boolean }) {
  const [pending, startTransition] = useTransition();
  const [checked, setChecked] = useOptimistic(value);
  return (
    <input
      type="checkbox"
      aria-label={field === "in_stock" ? "В наявності" : "Приховати з сайту"}
      checked={checked}
      disabled={pending}
      className="size-4 cursor-pointer accent-primary disabled:cursor-wait"
      onChange={(event) => {
        const next = event.target.checked;
        startTransition(async () => {
          setChecked(next);
          try {
            const result = await setProductFlag(id, field, next);
            if (!result.ok) alert(result.error ?? "Не вдалося зберегти зміну.");
          } catch {
            alert("Не вдалося зберегти зміну. Оновіть сторінку і спробуйте ще раз.");
          }
        });
      }}
    />
  );
}
