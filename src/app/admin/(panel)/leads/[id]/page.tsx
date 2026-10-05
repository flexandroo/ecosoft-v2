import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone } from "lucide-react";
import { formatUah } from "@/lib/format";
import { LEAD_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES, kindLabel, labelOf } from "@/lib/admin/constants";
import { createSessionClient } from "@/lib/supabase/server";
import { Card, PageTitle, StatusBadge, formatDateTime } from "../../ui";
import { LeadCommentForm, LeadManageForm } from "./forms";

export const metadata: Metadata = { title: "Заявка" };

type LeadItem = { sku?: string; name: string; quantity: number; price: number };
type TrackingEntry = { state: string; error: string | null; at: string };

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createSessionClient();

  const [{ data: lead }, { data: events }, { data: staff }] = await Promise.all([
    supabase.from("leads").select("*").eq("id", id).maybeSingle(),
    supabase.from("lead_events").select("id, type, data, actor, created_at").eq("lead_id", id).order("created_at", { ascending: false }),
    supabase.from("admin_users").select("user_id, name, email").order("name"),
  ]);
  if (!lead) notFound();

  const staffName = new Map((staff ?? []).map((s) => [s.user_id, s.name || s.email]));
  const items = (lead.items ?? []) as LeadItem[];
  const tracking = (lead.tracking ?? {}) as Record<string, TrackingEntry>;

  const attribution = [
    ["Сторінка входу", lead.landing_page],
    ["Звідки прийшов", lead.referrer],
    ["utm_source", lead.utm_source],
    ["utm_medium", lead.utm_medium],
    ["utm_campaign", lead.utm_campaign],
    ["utm_content", lead.utm_content],
    ["utm_term", lead.utm_term],
    ["fbclid", lead.fbclid],
    ["gclid", lead.gclid],
  ].filter(([, value]) => value) as [string, string][];

  return (
    <>
      <div className="mb-2 text-sm">
        <Link
          href={lead.kind === "order" ? "/admin/orders" : "/admin/leads"}
          className="text-muted-foreground hover:text-foreground"
        >
          ← {lead.kind === "order" ? "Замовлення" : "Заявки"}
        </Link>
      </div>
      <PageTitle
        title={`${kindLabel(lead.kind)} №${lead.number}`}
        subtitle={
          <>
            {formatDateTime(lead.created_at)} · <span className="font-mono">{lead.external_id}</span>
          </>
        }
        actions={<StatusBadge status={lead.status} />}
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <Card>
            <h2 className="mb-3 font-semibold">Клієнт</h2>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <Info label="Імʼя" value={lead.customer_name || "—"} />
              <div>
                <dt className="text-xs text-muted-foreground">Телефон</dt>
                <dd>
                  <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 font-medium text-primary">
                    <Phone className="size-3.5" /> {lead.phone}
                  </a>
                </dd>
              </div>
              {lead.email && <Info label="Email" value={lead.email} />}
              {lead.address && <Info label="Адреса доставки" value={lead.address} />}
              <Info label="Джерело на сайті" value={lead.source_detail || "—"} />
            </dl>
            {lead.message && (
              <p className="mt-4 rounded-lg bg-muted/60 p-3 text-sm whitespace-pre-wrap">{lead.message}</p>
            )}
            {lead.comment && (
              <p className="mt-4 rounded-lg bg-muted/60 p-3 text-sm whitespace-pre-wrap">
                <span className="text-muted-foreground">Коментар клієнта: </span>
                {lead.comment}
              </p>
            )}
          </Card>

          {items.length > 0 && (
            <Card className="overflow-x-auto">
              <h2 className="mb-3 font-semibold">Товари</h2>
              <table className="w-full min-w-[480px] text-sm">
                <tbody className="divide-y">
                  {items.map((item, index) => (
                    <tr key={`${item.sku}-${index}`}>
                      <td className="py-2 pr-3">
                        {item.name}
                        {item.sku && <div className="font-mono text-xs text-muted-foreground">{item.sku}</div>}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                        {item.quantity} × {formatUah(Number(item.price))}
                      </td>
                      <td className="py-2 text-right font-medium whitespace-nowrap">
                        {formatUah(Number(item.price) * Number(item.quantity))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t">
                    <td colSpan={2} className="pt-3 font-semibold">
                      Разом
                    </td>
                    <td className="pt-3 text-right font-semibold whitespace-nowrap">{formatUah(Number(lead.total))}</td>
                  </tr>
                </tfoot>
              </table>
            </Card>
          )}

          <Card>
            <h2 className="mb-3 font-semibold">Історія та коментарі</h2>
            <LeadCommentForm id={lead.id} />
            <ol className="mt-4 space-y-3 text-sm">
              {(events ?? []).map((event) => (
                <li key={event.id} className="border-l-2 pl-3">
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(event.created_at)}
                    {event.actor ? ` · ${staffName.get(event.actor) ?? "співробітник"}` : " · сайт"}
                  </div>
                  <EventText type={event.type} data={event.data as Record<string, unknown>} staffName={staffName} />
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <h2 className="mb-3 font-semibold">Обробка</h2>
            <LeadManageForm
              lead={{
                id: lead.id,
                status: lead.status,
                payment_method: lead.payment_method,
                payment_status: lead.payment_status,
                assigned_to: lead.assigned_to,
                manager_note: lead.manager_note,
                address: lead.address,
              }}
              staff={(staff ?? []).map((s) => ({ id: s.user_id, name: s.name || s.email }))}
            />
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold">Реклама</h2>
            {attribution.length ? (
              <dl className="space-y-1.5 text-xs">
                {attribution.map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[110px_1fr] gap-2">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="break-all">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">Без рекламних міток.</p>
            )}
            <div className="mt-4 space-y-1 border-t pt-3 text-xs">
              <TrackingLine label="Lead → Meta/GA4" entry={tracking.lead} />
              <TrackingLine label="Purchase → Meta/GA4" entry={tracking.purchase} />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function TrackingLine({ label, entry }: { label: string; entry?: TrackingEntry }) {
  const text = !entry
    ? "не надсилалось"
    : entry.state === "sent"
      ? `надіслано ${formatDateTime(entry.at)}`
      : `помилка: ${entry.error ?? ""}`;
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={entry?.state === "failed" ? "text-rose-700" : ""}>{text}</span>
    </div>
  );
}

const FIELD_LABELS: Record<string, string> = {
  status: "Статус",
  manager_note: "Нотатка",
  assigned_to: "Відповідальний",
  payment_method: "Оплата",
  payment_status: "Статус оплати",
  address: "Адреса",
};

function EventText({
  type,
  data,
  staffName,
}: {
  type: string;
  data: Record<string, unknown>;
  staffName: Map<string, string>;
}) {
  if (type === "created") return <p>Заявка надійшла з сайту</p>;
  if (type === "comment") return <p className="whitespace-pre-wrap">{String(data.text ?? "")}</p>;
  const entries = Object.entries(data) as [string, { from: unknown; to: unknown }][];
  return (
    <ul>
      {entries.map(([field, change]) => {
        let to = String(change?.to ?? "—");
        if (field === "status") to = labelOf(LEAD_STATUSES, to);
        if (field === "payment_method") to = labelOf(PAYMENT_METHODS, to);
        if (field === "payment_status") to = labelOf(PAYMENT_STATUSES, to);
        if (field === "assigned_to") to = staffName.get(to) ?? "—";
        if (field === "manager_note") to = to.length > 80 ? `${to.slice(0, 80)}…` : to;
        return (
          <li key={field}>
            {FIELD_LABELS[field] ?? field}: <span className="font-medium">{to}</span>
          </li>
        );
      })}
    </ul>
  );
}
