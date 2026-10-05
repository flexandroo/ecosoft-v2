import type { Metadata } from "next";
import { LeadsList, type LeadsSearchParams } from "../leads/leads-list";

export const metadata: Metadata = { title: "Замовлення" };

export default async function Page({ searchParams }: { searchParams: Promise<LeadsSearchParams> }) {
  return (
    <LeadsList
      basePath="/admin/orders"
      kinds={["order"]}
      title="Замовлення"
      subtitle="Оформлені через кошик на сайті"
      params={await searchParams}
    />
  );
}
