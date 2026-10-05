import type { Metadata } from "next";
import { requireStaff } from "@/lib/admin/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { AdminSidebar } from "./sidebar";

export const metadata: Metadata = {
  // `absolute` keeps the storefront's "· Магазин Ecosoft" template out of admin tabs.
  title: { absolute: "Адмінка Sofiivka Water", template: "%s · Адмінка Sofiivka Water" },
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  const supabase = await createSessionClient();
  const countNew = (kinds: string[]) =>
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new").in("kind", kinds);
  const [orders, leads] = await Promise.all([countNew(["order"]), countNew(["callback", "contact"])]);

  return (
    <div className="min-h-screen bg-muted/40 lg:grid lg:grid-cols-[248px_1fr]">
      <AdminSidebar
        staff={{ name: staff.name, roleLabel: staff.role === "admin" ? "Адміністратор" : "Менеджер" }}
        badges={{ orders: orders.count ?? 0, leads: leads.count ?? 0 }}
      />
      <div className="min-w-0 px-4 py-5 lg:px-8 lg:py-8">{children}</div>
    </div>
  );
}
