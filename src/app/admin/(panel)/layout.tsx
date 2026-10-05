import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Image as ImageIcon, Inbox, LayoutDashboard, LogOut, Package } from "lucide-react";
import { requireStaff } from "@/lib/admin/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { signOut } from "../actions";
import { AdminNavLink } from "./nav-link";

export const metadata: Metadata = {
  // `absolute` keeps the storefront's "· Магазин Ecosoft" template out of admin tabs.
  title: { absolute: "Адмінка Sofiivka Water", template: "%s · Адмінка Sofiivka Water" },
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  const supabase = await createSessionClient();
  const { count: newLeads } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");

  const nav = [
    { href: "/admin", label: "Огляд", icon: <LayoutDashboard />, exact: true },
    { href: "/admin/leads", label: "Заявки", icon: <Inbox />, badge: newLeads ?? 0 },
    { href: "/admin/products", label: "Товари", icon: <Package /> },
    { href: "/admin/banners", label: "Банери", icon: <ImageIcon /> },
  ];

  return (
    <div className="min-h-screen bg-muted/40 lg:grid lg:grid-cols-[232px_1fr]">
      <aside className="border-b bg-card lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between px-4 py-3 lg:block lg:px-5 lg:py-5">
          <Link href="/admin" className="block">
            <span className="block text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Sofiivka Water
            </span>
            <span className="font-heading text-lg font-bold">Адмінка</span>
          </Link>
          <form action={signOut} className="lg:hidden">
            <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground" type="submit">
              <LogOut className="size-4" /> Вийти
            </button>
          </form>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {nav.map((item) => (
            <AdminNavLink key={item.href} {...item} />
          ))}
        </nav>
        <div className="hidden space-y-3 border-t px-5 py-4 text-sm lg:block">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="size-4" /> Відкрити сайт
          </a>
          <div>
            <p className="truncate font-medium">{staff.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {staff.role === "admin" ? "Адміністратор" : "Менеджер"}
            </p>
          </div>
          <form action={signOut}>
            <button
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              type="submit"
            >
              <LogOut className="size-4" /> Вийти
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 px-4 py-5 lg:px-8 lg:py-8">{children}</div>
    </div>
  );
}
