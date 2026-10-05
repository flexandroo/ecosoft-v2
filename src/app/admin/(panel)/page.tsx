import Link from "next/link";
import { formatUah } from "@/lib/format";
import { kindLabel } from "@/lib/admin/constants";
import { createSessionClient } from "@/lib/supabase/server";
import { Card, PageTitle, StatusBadge, formatDateTime } from "./ui";

function startOfKyivDay(daysAgo = 0): string {
  const now = new Date();
  const kyiv = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Kyiv" }));
  const offset = now.getTime() - kyiv.getTime();
  kyiv.setHours(0, 0, 0, 0);
  kyiv.setDate(kyiv.getDate() - daysAgo);
  return new Date(kyiv.getTime() + offset).toISOString();
}

export default async function AdminDashboard() {
  const supabase = await createSessionClient();
  const today = startOfKyivDay();
  const week = startOfKyivDay(6);
  const month = startOfKyivDay(29);

  const countLeads = () => supabase.from("leads").select("id", { count: "exact", head: true });

  const [newOrders, newRequests, todayCount, weekCount, completed, latest] = await Promise.all([
    countLeads().eq("status", "new").eq("kind", "order"),
    countLeads().eq("status", "new").in("kind", ["callback", "contact"]),
    countLeads().gte("created_at", today),
    countLeads().gte("created_at", week),
    supabase.from("leads").select("total").eq("status", "completed").gte("completed_at", month),
    supabase
      .from("leads")
      .select("id, number, kind, status, customer_name, phone, total, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const revenue = (completed.data ?? []).reduce((sum, row) => sum + Number(row.total || 0), 0);
  const stats = [
    { label: "Нові замовлення", value: newOrders.count ?? 0, href: "/admin/orders?status=new" },
    { label: "Нові заявки", value: newRequests.count ?? 0, href: "/admin/leads?status=new" },
    { label: "Звернень сьогодні / 7 днів", value: `${todayCount.count ?? 0} / ${weekCount.count ?? 0}` },
    { label: "Продажі за 30 днів", value: formatUah(revenue) },
  ];

  return (
    <>
      <PageTitle title="Огляд" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => {
          const body = (
            <Card className="h-full">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="mt-1 font-heading text-2xl font-bold">{stat.value}</p>
            </Card>
          );
          return stat.href ? (
            <Link key={stat.label} href={stat.href} className="block hover:opacity-90">
              {body}
            </Link>
          ) : (
            <div key={stat.label}>{body}</div>
          );
        })}
      </div>

      <Card className="mt-6 p-0 sm:p-0">
        <div className="flex items-center justify-between px-4 py-3 sm:px-5">
          <h2 className="font-semibold">Останні звернення</h2>
          <Link href="/admin/orders" className="text-sm text-primary hover:underline">
            Усі замовлення
          </Link>
        </div>
        <ul className="divide-y border-t">
          {(latest.data ?? []).map((lead) => (
            <li key={lead.id}>
              <Link
                href={`/admin/leads/${lead.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm hover:bg-muted/50 sm:px-5"
              >
                <span className="w-14 font-mono text-muted-foreground">№{lead.number}</span>
                <span className="min-w-40 flex-1 font-medium">
                  {lead.customer_name || "Без імені"} <span className="text-muted-foreground">{lead.phone}</span>
                </span>
                <span className="text-muted-foreground">{kindLabel(lead.kind)}</span>
                {Number(lead.total) > 0 && <span className="font-medium">{formatUah(Number(lead.total))}</span>}
                <StatusBadge status={lead.status} />
                <span className="text-xs text-muted-foreground">{formatDateTime(lead.created_at)}</span>
              </Link>
            </li>
          ))}
          {!latest.data?.length && <li className="px-5 py-8 text-center text-sm text-muted-foreground">Заявок ще немає.</li>}
        </ul>
      </Card>
    </>
  );
}
