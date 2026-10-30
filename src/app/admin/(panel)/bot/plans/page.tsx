import type { Metadata } from "next";
import Link from "next/link";
import { createSessionClient } from "@/lib/supabase/server";
import { Card, PageTitle } from "../../ui";

export const metadata: Metadata = { title: "Графіки заміни" };

const FILTER_CATEGORIES = ["reverse-osmosis", "flow-filters", "mainline-filters", "horeca"];
const CATEGORY_LABELS: Record<string, string> = {
  "reverse-osmosis": "Зворотний осмос",
  "flow-filters": "Проточні",
  "mainline-filters": "Магістральні",
  horeca: "HoReCa",
};

export default async function BotPlansPage() {
  const supabase = await createSessionClient();
  const [{ data: products }, { data: items }] = await Promise.all([
    supabase.from("products").select("id, sku, name, category, is_hidden").in("category", FILTER_CATEGORIES).order("sort"),
    supabase.from("bot_service_items").select("product_id, interval_days, cartridge_product_id"),
  ]);
  const byProduct = new Map<string, { count: number; unlinked: number }>();
  for (const i of items ?? []) {
    const cur = byProduct.get(i.product_id) ?? { count: 0, unlinked: 0 };
    byProduct.set(i.product_id, { count: cur.count + 1, unlinked: cur.unlinked + (i.cartridge_product_id ? 0 : 1) });
  }
  const list = products ?? [];
  const withPlan = list.filter((p) => byProduct.has(p.id));
  const without = list.filter((p) => !byProduct.has(p.id) && !p.is_hidden);

  const row = (p: (typeof list)[number]) => {
    const plan = byProduct.get(p.id);
    return (
      <tr key={p.id} className="hover:bg-muted/40">
        <td className="px-4 py-2.5">
          <Link href={`/admin/bot/plans/${p.id}`} className="font-medium hover:underline">
            {p.name}
          </Link>
          <span className="ml-2 text-xs text-muted-foreground">{p.sku}</span>
        </td>
        <td className="px-4 py-2.5 text-muted-foreground">{CATEGORY_LABELS[p.category] ?? p.category}</td>
        <td className="px-4 py-2.5">
          {plan ? (
            <>
              {plan.count} поз.
              {plan.unlinked > 0 && <span className="ml-2 text-xs text-amber-700">{plan.unlinked} без товару</span>}
            </>
          ) : (
            <Link href={`/admin/bot/plans/${p.id}`} className="text-sm font-medium text-primary hover:underline">
              + Додати графік
            </Link>
          )}
        </td>
      </tr>
    );
  };

  return (
    <>
      <PageTitle
        title="Графіки заміни"
        subtitle="Які картриджі і як часто міняти для кожної моделі. Клієнт бачить у боті лише моделі з графіком."
      />
      <Card className="mb-5 overflow-x-auto p-0 sm:p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Фільтр у боті ({withPlan.length})</th>
              <th className="px-4 py-2.5 font-medium">Тип</th>
              <th className="px-4 py-2.5 font-medium">Графік</th>
            </tr>
          </thead>
          <tbody className="divide-y">{withPlan.map(row)}</tbody>
        </table>
      </Card>
      {without.length > 0 && (
        <Card className="overflow-x-auto p-0 sm:p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Без графіка — не показуються в боті ({without.length})</th>
                <th className="px-4 py-2.5 font-medium">Тип</th>
                <th className="px-4 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y">{without.map(row)}</tbody>
          </table>
        </Card>
      )}
    </>
  );
}
