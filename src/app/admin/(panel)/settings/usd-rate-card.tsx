"use client";

import { useActionState } from "react";
import { refreshUsdRate } from "../../_actions/settings";
import type { FormState } from "../../_actions/form-state";
import { FormMessage, SubmitButton } from "../form-status";
import { Card } from "../ui";

/** Current NBU rate behind the catalogue prices, with a manual refresh. */
export function UsdRateCard({ rate }: { rate: { rate: number; date: string; updatedAt: string } | null }) {
  const [state, action] = useActionState<FormState, FormData>(refreshUsdRate, null);
  const updated = rate?.updatedAt ? new Date(rate.updatedAt).toLocaleString("uk-UA", { timeZone: "Europe/Kyiv" }) : null;
  return (
    <Card>
      <h2 className="mb-2 font-semibold">Курс долара (НБУ)</h2>
      {rate ? (
        <p className="text-sm">
          <span className="font-heading text-2xl font-bold">{rate.rate.toLocaleString("uk-UA", { maximumFractionDigits: 4 })}</span>{" "}
          ₴/$ на {rate.date}
          {updated && <span className="block text-xs text-muted-foreground">Оновлено {updated}</span>}
        </p>
      ) : (
        <p className="text-sm text-rose-700">Курс ще не завантажено.</p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        Ціни товарів зберігаються в доларах (прайс Ecosoft) і перераховуються автоматично двічі на день — після
        півночі та опівдні за Києвом. На сайті оновлюються протягом 5 хвилин.
      </p>
      <form action={action} className="mt-3 flex flex-wrap items-center gap-3">
        <SubmitButton pendingLabel="Оновлюємо…">Оновити зараз</SubmitButton>
        <FormMessage state={state} />
      </form>
    </Card>
  );
}
