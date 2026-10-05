import type { Metadata } from "next";
import Link from "next/link";
import { formatUah } from "@/lib/format";
import { LEAD_KINDS, LEAD_STATUSES, isLeadKind, isLeadStatus, kindLabel } from "@/lib/admin/constants";
import { createSessionClient } from "@/lib/supabase/server";
import { Card, PageTitle, StatusBadge, formatDateTime, inputBaseClass } from "../ui";

export const metadata: Metadata = { title: "Заявки" };

const PAGE_SIZE = 30;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; kind?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = isLeadStatus(params.status) ? params.status : "";
  const kind = isLeadKind(params.kind) ? params.kind : "";
  const q = (params.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, Math.trunc(Number(params.page)) || 1);

  const supabase = await createSessionClient();
  let query = supabase
    .from("leads")
    .select(
      "id, number, kind, status, customer_name, phone, total, utm_source, utm_campaign, fbclid, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (status) query = query.eq("status", status);
  if (kind) query = query.eq("kind", kind);
  if (q) {
    const digits = q.replace(/\D/g, "");
    const safe = q.replace(/[%,()*]/g, " ");
    const filters = [`customer_name.ilike.%${safe}%`, `external_id.ilike.%${safe}%`];
    if (digits.length >= 3) filters.push(`phone.ilike.%${digits.slice(-9)}%`);
    if (/^\d{1,9}$/.test(q)) filters.push(`number.eq.${q}`);
    query = query.or(filters.join(","));
  }
  const { data: leads, count, error } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const link = (overrides: Record<string, string | number>) => {
    const next = new URLSearchParams();
    const merged = { status, kind, q, page: 1, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value && !(key === "page" && value === 1)) next.set(key, String(value));
    }
    const s = next.toString();
    return s ? `/admin/leads?${s}` : "/admin/leads";
  };

  return (
    <>
      <PageTitle title="Заявки" subtitle="Замовлення з кошика, зворотні дзвінки та звернення з форм" />

      <div className="mb-3 flex flex-wrap gap-1.5">
        <FilterChip href={link({ status: "" })} active={!status} label="Усі статуси" />
        {LEAD_STATUSES.map((s) => (
          <FilterChip key={s.id} href={link({ status: s.id })} active={status === s.id} label={s.label} />
        ))}
      </div>

      <form className="mb-4 flex flex-wrap gap-2" action="/admin/leads">
        {status && <input type="hidden" name="status" value={status} />}
        <select name="kind" defaultValue={kind} className={inputBaseClass}>
          <option value="">Усі типи</option>
          {LEAD_KINDS.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>
        <input
          name="q"
          defaultValue={q}
          placeholder="Імʼя, телефон або №"
          className={`${inputBaseClass} w-64 max-w-full`}
        />
        <button type="submit" className="h-9 rounded-lg border bg-background px-3 text-sm font-medium hover:bg-muted">
          Знайти
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-rose-700">Помилка завантаження: {error.message}</p>}

      <Card className="overflow-x-auto p-0 sm:p-0">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">№</th>
              <th className="px-4 py-2.5 font-medium">Клієнт</th>
              <th className="px-4 py-2.5 font-medium">Тип</th>
              <th className="px-4 py-2.5 font-medium">Сума</th>
              <th className="px-4 py-2.5 font-medium">Джерело</th>
              <th className="px-4 py-2.5 font-medium">Статус</th>
              <th className="px-4 py-2.5 font-medium">Створено</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(leads ?? []).map((lead) => (
              <tr key={lead.id} className="hover:bg-muted/50">
                <td className="px-4 py-2.5 font-mono text-muted-foreground">
                  <Link href={`/admin/leads/${lead.id}`} className="hover:text-foreground">
                    {lead.number}
                  </Link>
                </td>
                <td className="px-4 py-2.5">
                  <Link href={`/admin/leads/${lead.id}`} className="font-medium hover:text-primary">
                    {lead.customer_name || "Без імені"}
                  </Link>
                  <div className="text-xs text-muted-foreground">{lead.phone}</div>
                </td>
                <td className="px-4 py-2.5">{kindLabel(lead.kind)}</td>
                <td className="px-4 py-2.5">{Number(lead.total) > 0 ? formatUah(Number(lead.total)) : "—"}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">
                  {lead.utm_source || (lead.fbclid ? "facebook" : "—")}
                  {lead.utm_campaign && <div className="max-w-40 truncate">{lead.utm_campaign}</div>}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={lead.status} />
                </td>
                <td className="px-4 py-2.5 text-xs whitespace-nowrap text-muted-foreground">
                  {formatDateTime(lead.created_at)}
                </td>
              </tr>
            ))}
            {!leads?.length && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  Нічого не знайдено.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Сторінка {page} з {totalPages} · всього {count}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link className="rounded-lg border bg-background px-3 py-1.5 hover:bg-muted" href={link({ page: page - 1 })}>
                ← Назад
              </Link>
            )}
            {page < totalPages && (
              <Link className="rounded-lg border bg-background px-3 py-1.5 hover:bg-muted" href={link({ page: page + 1 })}>
                Далі →
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background"
          : "rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      }
    >
      {label}
    </Link>
  );
}
