import type { Metadata } from "next";
import Link from "next/link";
import { formatUah } from "@/lib/format";
import { listCustomers } from "@/lib/admin/customers";
import { Card, PageTitle, formatDateTime, inputBaseClass } from "../ui";

export const metadata: Metadata = { title: "Клієнти" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").slice(0, 100);
  const { customers, error } = await listCustomers(q);

  return (
    <>
      <PageTitle title="Клієнти" subtitle="Зібрані із замовлень і заявок за номером телефону" />
      <form className="mb-4 flex flex-wrap gap-2" action="/admin/customers">
        <input name="q" defaultValue={q} placeholder="Імʼя, телефон або email" className={`${inputBaseClass} w-64 max-w-full`} />
        <button type="submit" className="h-9 rounded-lg border bg-background px-3 text-sm font-medium hover:bg-muted">
          Знайти
        </button>
      </form>
      {error && <p className="mb-4 text-sm text-rose-700">Помилка завантаження: {error}</p>}

      <Card className="overflow-x-auto p-0 sm:p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Клієнт</th>
              <th className="px-4 py-2.5 font-medium">Звернень</th>
              <th className="px-4 py-2.5 font-medium">Замовлень</th>
              <th className="px-4 py-2.5 font-medium">Куплено на</th>
              <th className="px-4 py-2.5 font-medium">Остання активність</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {customers.map((c) => (
              <tr key={c.key} className="hover:bg-muted/50">
                <td className="px-4 py-2.5">
                  <Link href={`/admin/customers/${c.key}`} className="font-medium hover:text-primary">
                    {c.name || "Без імені"}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {c.phone}
                    {c.email ? ` · ${c.email}` : ""}
                  </div>
                </td>
                <td className="px-4 py-2.5">{c.leads}</td>
                <td className="px-4 py-2.5">{c.orders}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">{c.completedTotal ? formatUah(c.completedTotal) : "—"}</td>
                <td className="px-4 py-2.5 text-xs whitespace-nowrap text-muted-foreground">{formatDateTime(c.lastAt)}</td>
              </tr>
            ))}
            {!customers.length && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  {q ? "Нічого не знайдено." : "Клієнтів ще немає."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
