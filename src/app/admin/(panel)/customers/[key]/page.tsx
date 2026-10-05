import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone } from "lucide-react";
import { formatUah } from "@/lib/format";
import { kindLabel } from "@/lib/admin/constants";
import { createSessionClient } from "@/lib/supabase/server";
import { Card, PageTitle, StatusBadge, formatDateTime } from "../../ui";

export const metadata: Metadata = { title: "Клієнт" };

export default async function CustomerPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!/^\d{9}$/.test(key)) notFound();
  const supabase = await createSessionClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("id, number, kind, status, customer_name, phone, email, address, total, created_at")
    .ilike("phone", `%${key}`)
    .order("created_at", { ascending: false });
  if (!leads?.length) notFound();

  const latest = leads[0];
  const completed = leads.filter((l) => l.status === "completed").reduce((s, l) => s + Number(l.total || 0), 0);
  const email = leads.find((l) => l.email)?.email;
  const address = leads.find((l) => l.address)?.address;

  return (
    <>
      <div className="mb-2 text-sm">
        <Link href="/admin/customers" className="text-muted-foreground hover:text-foreground">
          ← Клієнти
        </Link>
      </div>
      <PageTitle title={latest.customer_name || "Без імені"} subtitle={`Клієнт з ${formatDateTime(leads[leads.length - 1].created_at)}`} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-x-auto p-0 sm:p-0">
          <h2 className="px-4 pt-4 pb-2 font-semibold sm:px-5">Звернення ({leads.length})</h2>
          <ul className="divide-y border-t">
            {leads.map((lead) => (
              <li key={lead.id}>
                <Link
                  href={`/admin/leads/${lead.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm hover:bg-muted/50 sm:px-5"
                >
                  <span className="w-14 font-mono text-muted-foreground">№{lead.number}</span>
                  <span className="flex-1">{kindLabel(lead.kind)}</span>
                  {Number(lead.total) > 0 && <span className="font-medium">{formatUah(Number(lead.total))}</span>}
                  <StatusBadge status={lead.status} />
                  <span className="text-xs text-muted-foreground">{formatDateTime(lead.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-3 text-sm">
          <h2 className="font-semibold">Контакти</h2>
          <a href={`tel:${latest.phone}`} className="inline-flex items-center gap-1.5 font-medium text-primary">
            <Phone className="size-3.5" /> {latest.phone}
          </a>
          {email && <p>{email}</p>}
          {address && <p className="text-muted-foreground">{address}</p>}
          <dl className="space-y-1 border-t pt-3">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Замовлень</dt>
              <dd>{leads.filter((l) => l.kind === "order").length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Куплено на</dt>
              <dd>{completed ? formatUah(completed) : "—"}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </>
  );
}
