"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Box,
  ExternalLink,
  FileSignature,
  FileText,
  Image as ImageIcon,
  Images,
  LayoutGrid,
  LayoutList,
  ListTree,
  LogOut,
  Menu,
  MessageSquareText,
  Settings,
  ShoppingCart,
  User,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "../_actions/session";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: "orders" | "leads"; exact?: boolean };

const SECTIONS: { title: string; items: NavItem[] }[] = [
  { title: "Головне", items: [{ href: "/admin", label: "Огляд", icon: LayoutGrid, exact: true }] },
  {
    title: "Продажі",
    items: [
      { href: "/admin/orders", label: "Замовлення", icon: ShoppingCart, badge: "orders" },
      { href: "/admin/leads", label: "Заявки", icon: MessageSquareText, badge: "leads" },
      { href: "/admin/customers", label: "Клієнти", icon: User },
      { href: "/admin/proposals", label: "Генератор КП", icon: FileSignature },
    ],
  },
  {
    title: "Каталог",
    items: [
      { href: "/admin/products", label: "Товари", icon: Box },
      { href: "/admin/collections", label: "Підбірки", icon: LayoutList },
    ],
  },
  {
    title: "Сайт",
    items: [
      { href: "/admin/banners", label: "Банери головної", icon: ImageIcon },
      { href: "/admin/pages", label: "Сторінки", icon: FileText },
      { href: "/admin/blog", label: "Блог і кейси", icon: BookOpen },
      { href: "/admin/menu", label: "Меню сайту", icon: Menu },
    ],
  },
  {
    title: "Дані",
    items: [
      { href: "/admin/categories", label: "Категорії", icon: ListTree },
      { href: "/admin/media", label: "Медіатека", icon: Images },
    ],
  },
  {
    title: "Система",
    items: [
      { href: "/admin/settings", label: "Налаштування", icon: Settings },
      { href: "/admin/staff", label: "Працівники", icon: Users },
    ],
  },
];

export function AdminSidebar({
  staff,
  badges,
}: {
  staff: { name: string; roleLabel: string };
  badges: { orders: number; leads: number };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <>
      {/* Phone top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-foreground px-4 py-3 text-white lg:hidden">
        <Link href="/admin" className="font-heading text-base font-bold">
          Адмінка <span className="font-normal text-white/50">Sofiivka Water</span>
        </Link>
        <button
          type="button"
          aria-label="Відкрити меню"
          onClick={() => setOpen(true)}
          className="inline-flex size-9 items-center justify-center rounded-lg bg-white/10"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col bg-foreground text-white/80 transition-transform lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <Link href="/admin" className="block leading-tight">
            <span className="block text-[11px] font-semibold tracking-widest text-white/40 uppercase">Sofiivka Water</span>
            <span className="font-heading text-lg font-bold text-white">Адмінка</span>
          </Link>
          <button
            type="button"
            aria-label="Закрити меню"
            onClick={() => setOpen(false)}
            className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-white/10 lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 [scrollbar-color:rgb(255_255_255/0.15)_transparent] [scrollbar-width:thin]">
          {SECTIONS.map((section) => (
            <div key={section.title} className="mt-4">
              <p className="px-2 pb-1.5 text-[11px] font-semibold tracking-widest text-white/40 uppercase">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item);
                  const Icon = item.icon;
                  const count = item.badge ? badges[item.badge] : 0;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          active ? "bg-primary/25 text-white" : "hover:bg-white/5 hover:text-white",
                        )}
                      >
                        {active && <span className="absolute top-1.5 bottom-1.5 -left-3 w-[3px] rounded-r bg-accent" />}
                        <Icon className={cn("size-[18px] shrink-0", active ? "text-accent" : "text-white/60")} />
                        <span className="truncate">{item.label}</span>
                        {count > 0 && (
                          <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[11px] leading-none font-bold text-primary-foreground">
                            {count}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-accent">
              {staff.name.trim().charAt(0).toUpperCase() || "?"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{staff.name}</p>
              <p className="truncate text-xs text-white/50">{staff.roleLabel}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <form action={signOut}>
              <button type="submit" className="inline-flex items-center gap-2 text-white/60 hover:text-white">
                <LogOut className="size-4" /> Вийти
              </button>
            </form>
            <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white">
              <ExternalLink className="size-4" /> Сайт
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
