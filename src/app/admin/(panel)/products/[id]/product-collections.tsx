"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { setProductInCollection } from "../../../actions";
import { Card } from "../../ui";

export type ProductCollectionOption = { id: string; title: string; included: boolean; showOnHome: boolean };

/** Membership toggles; each change is saved immediately (independent of the product form). */
export function ProductCollections({ productId, options }: { productId: string; options: ProductCollectionOption[] }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useOptimistic(options);

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">У підбірках</h2>
        <Link href="/admin/collections" className="text-xs text-primary hover:underline">
          Керувати
        </Link>
      </div>
      {state.length ? (
        <ul className="space-y-2">
          {state.map((c) => (
            <li key={c.id}>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={c.included}
                  disabled={pending}
                  className="size-4 accent-primary"
                  onChange={(e) => {
                    const included = e.target.checked;
                    startTransition(async () => {
                      setState((list) => list.map((x) => (x.id === c.id ? { ...x, included } : x)));
                      try {
                        await setProductInCollection(c.id, productId, included);
                      } catch {
                        alert("Не вдалося зберегти зміну. Оновіть сторінку і спробуйте ще раз.");
                      }
                    });
                  }}
                />
                {c.title}
                {c.showOnHome && <span className="text-xs text-muted-foreground">· на головній</span>}
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Підбірок ще немає.</p>
      )}
      <p className="text-xs text-muted-foreground">Зберігається одразу. Товари без наявності в стрічках не показуються.</p>
    </Card>
  );
}
