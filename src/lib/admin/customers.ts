import "server-only";
import { createSessionClient } from "@/lib/supabase/server";

/** Customers are derived from leads: one customer per phone number (last 9 digits). */
export function phoneKey(phone: string): string {
  return phone.replace(/\D/g, "").slice(-9);
}

export type CustomerSummary = {
  key: string;
  name: string;
  phone: string;
  email: string | null;
  leads: number;
  orders: number;
  completedTotal: number;
  lastAt: string;
  firstAt: string;
};

type LeadRow = {
  phone: string;
  customer_name: string;
  email: string | null;
  kind: string;
  status: string;
  total: number | string;
  created_at: string;
};

export async function listCustomers(search = ""): Promise<{ customers: CustomerSummary[]; error?: string }> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("leads")
    .select("phone, customer_name, email, kind, status, total, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) return { customers: [], error: error.message };

  const byKey = new Map<string, CustomerSummary>();
  for (const row of (data ?? []) as LeadRow[]) {
    const key = phoneKey(row.phone);
    if (!key) continue;
    let c = byKey.get(key);
    if (!c) {
      // Rows are newest first, so the first row carries the latest name/contact.
      c = {
        key,
        name: row.customer_name,
        phone: row.phone,
        email: row.email,
        leads: 0,
        orders: 0,
        completedTotal: 0,
        lastAt: row.created_at,
        firstAt: row.created_at,
      };
      byKey.set(key, c);
    }
    c.leads += 1;
    if (row.kind === "order") c.orders += 1;
    if (row.status === "completed") c.completedTotal += Number(row.total) || 0;
    if (!c.email && row.email) c.email = row.email;
    if ((!c.name || c.name === "Без імені") && row.customer_name) c.name = row.customer_name;
    c.firstAt = row.created_at;
  }

  let customers = [...byKey.values()];
  const q = search.trim().toLowerCase();
  if (q) {
    const digits = q.replace(/\D/g, "");
    customers = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (digits.length >= 3 && c.key.includes(digits.slice(-9))),
    );
  }
  return { customers };
}
