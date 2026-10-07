"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  ChevronRight,
  LayoutGrid,
  MapPin,
  Menu,
  Phone,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
  X,
} from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { CallbackButton } from "@/components/site/callback-button";
import { useSiteSettings } from "@/components/site/settings-context";
import { toPhoneContacts } from "@/lib/settings-shared";
import { useStoreCategories } from "@/components/site/categories-context";
import { useHeaderMenu } from "@/components/site/menus-context";
import { useDialog } from "@/components/site/use-dialog";
import { MenuLink } from "@/components/site/menu-link";
import { CATEGORY_GROUPS } from "@/lib/categories-shared";
import { SUBCATEGORIES, subcategoryQuery } from "@/lib/catalog-facets";
import { cn } from "@/lib/utils";

function SearchForm({ className }: { className?: string }) {
  return (
    <form action="/search" role="search" className={cn("flex h-11 overflow-hidden rounded-xl border border-border bg-card", className)}>
      <label htmlFor="store-search" className="sr-only">
        Пошук товарів
      </label>
      <input
        id="store-search"
        name="q"
        type="search"
        placeholder="Фільтр, картридж, артикул…"
        className="min-w-0 flex-1 bg-transparent px-4 text-[15px] outline-none placeholder:text-muted-foreground"
      />
      <button
        type="submit"
        className="inline-flex items-center gap-2 bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Search className="size-4" aria-hidden />
        <span className="hidden sm:inline">Знайти</span>
      </button>
    </form>
  );
}

export function Header() {
  const settings = useSiteSettings();
  const PRIMARY_PHONE = toPhoneContacts(settings.phones)[0];
  const categories = useStoreCategories();
  const menu = useHeaderMenu();
  const desktopPages = menu.filter((p) => p.desktop);
  const mobilePages = menu.filter((p) => p.mobile);
  const { count, hydrated } = useCart();
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const catalogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!catalogOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!catalogRef.current?.contains(e.target as Node)) setCatalogOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCatalogOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [catalogOpen]);

  const drawerRef = useRef<HTMLDivElement>(null);
  useDialog(drawerOpen, drawerRef, () => setDrawerOpen(false));

  const cartCount = hydrated ? count : 0;

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-[60] focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lg"
      >
        Перейти до вмісту
      </a>

      {/* Utility bar */}
      <div className="hidden bg-foreground text-[13px] text-white/80 md:block">
        <div className="mx-auto flex h-9 max-w-[1600px] items-center gap-6 px-4 md:px-8">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5 text-accent" aria-hidden /> {settings.address.short}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Truck className="size-3.5 text-accent" aria-hidden /> Доставка по Україні 1–3 дні
          </span>
          <span className="hidden items-center gap-1.5 lg:inline-flex">
            <ShieldCheck className="size-3.5 text-accent" aria-hidden /> Офіційний партнер Ecosoft
          </span>
          {desktopPages.length > 0 && (
            <nav className="ml-auto hidden items-center gap-5 lg:flex" aria-label="Інформація">
              {desktopPages.map((p, i) => (
                <MenuLink key={i} href={p.href} className="transition-colors hover:text-white">
                  {p.label}
                </MenuLink>
              ))}
            </nav>
          )}
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 md:h-[72px] md:gap-5 md:px-8">
          <button
            type="button"
            aria-label="Відкрити меню"
            onClick={() => setDrawerOpen(true)}
            className="grid size-11 place-items-center rounded-xl text-foreground hover:bg-muted lg:hidden"
          >
            <Menu className="size-6" />
          </button>

          <Link href="/" aria-label="Ecosoft — головна" className="shrink-0 leading-none">
            <span className="block font-[family-name:var(--font-manrope)] text-[26px] font-extrabold tracking-tight text-primary lowercase">
              ecosoft
            </span>
            <span className="hidden text-[10.5px] font-semibold tracking-wide text-muted-foreground uppercase md:block">
              офіційний партнер
            </span>
          </Link>

          <div ref={catalogRef} className="relative hidden lg:block">
            <button
              type="button"
              aria-expanded={catalogOpen}
              aria-haspopup="true"
              onClick={() => setCatalogOpen((v) => !v)}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {catalogOpen ? <X className="size-4" /> : <LayoutGrid className="size-4" />}
              Каталог
            </button>
            {catalogOpen && (
              <div className="absolute top-[calc(100%+10px)] left-0 grid max-h-[calc(100vh-140px)] w-[min(1000px,calc(100vw-12rem))] grid-cols-4 gap-x-6 gap-y-5 overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-foreground/10">
                {CATEGORY_GROUPS.filter((group) => categories.some((c) => c.group === group.key)).map((group) => (
                  <div key={group.key}>
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{group.title}</p>
                    <ul className="mt-2 space-y-3">
                      {categories.filter((c) => c.group === group.key).map((c) => (
                        <li key={c.key}>
                          <Link
                            href={`/catalog/${c.key}`}
                            onClick={() => setCatalogOpen(false)}
                            className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[15px] font-semibold leading-snug hover:bg-muted"
                          >
                            {c.title}
                            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                          </Link>
                          {SUBCATEGORIES[c.key].length > 0 && (
                            <ul className="mt-0.5">
                              {SUBCATEGORIES[c.key].map((sub) => (
                                <li key={sub.key}>
                                  {/* Full page load: the catalogue reads its preset filter from the URL on mount. */}
                                  <a
                                    href={`/catalog/${c.key}${subcategoryQuery(sub)}`}
                                    className="block rounded-md px-2 py-1 text-[13.5px] leading-snug text-muted-foreground hover:bg-muted hover:text-foreground"
                                  >
                                    {sub.label}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          <SearchForm className="hidden flex-1 md:flex" />

          <div className="ml-auto flex items-center gap-1 md:ml-0 md:gap-3">
            <div className="hidden text-right xl:block">
              <a href={PRIMARY_PHONE.href} className="block text-[15px] font-bold tabular hover:text-primary">
                {PRIMARY_PHONE.display}
              </a>
              <CallbackButton
                source="header"
                className="text-xs font-medium text-primary underline-offset-2 hover:underline"
              >
                Передзвоніть мені
              </CallbackButton>
            </div>
            <a
              href={PRIMARY_PHONE.href}
              aria-label={`Зателефонувати ${PRIMARY_PHONE.display}`}
              className="grid size-11 place-items-center rounded-xl text-foreground hover:bg-muted xl:hidden"
            >
              <Phone className="size-5" />
            </a>
            <Link
              href="/cart"
              aria-label={`Кошик${cartCount ? `, товарів: ${cartCount}` : ""}`}
              className="relative inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-foreground hover:bg-muted"
            >
              <ShoppingCart className="size-5" />
              <span className="hidden md:inline">Кошик</span>
              {cartCount > 0 && (
                <span className="absolute top-0.5 left-6 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground tabular ring-2 ring-background">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
        <div className="px-4 pb-3 md:hidden">
          <SearchForm />
        </div>
      </div>

      {/* Phone drawer, portalled to <body>: the header's backdrop-blur would
          otherwise clip a fixed-position child to the header's own height. */}
      {drawerOpen && createPortal(
        <div ref={drawerRef} className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Меню">
          <button aria-label="Закрити меню" className="absolute inset-0 bg-foreground/50" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[min(86vw,360px)] flex-col overflow-y-auto bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="font-[family-name:var(--font-manrope)] text-xl font-extrabold text-primary lowercase">ecosoft</span>
              <button aria-label="Закрити" onClick={() => setDrawerOpen(false)} className="grid size-11 place-items-center rounded-xl hover:bg-muted">
                <X className="size-5" />
              </button>
            </div>
            <p className="px-4 pt-4 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Каталог</p>
            <ul className="px-2">
              {categories.map((c) => (
                <li key={c.key}>
                  <Link
                    href={`/catalog/${c.key}`}
                    onClick={() => setDrawerOpen(false)}
                    className="flex min-h-11 items-center justify-between rounded-lg px-2 text-[15px] font-medium hover:bg-muted"
                  >
                    {c.title}
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
            {mobilePages.length > 0 && (
              <>
                <p className="px-4 pt-4 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Покупцям</p>
                <ul className="px-2 pb-4">
                  {mobilePages.map((p, i) => (
                    <li key={i}>
                      <MenuLink
                        href={p.href}
                        onClick={() => setDrawerOpen(false)}
                        className="flex min-h-11 items-center rounded-lg px-2 text-[15px] hover:bg-muted"
                      >
                        {p.label}
                      </MenuLink>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="mt-auto space-y-2 border-t border-border p-4">
              <a
                href={PRIMARY_PHONE.href}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-border text-[15px] font-bold tabular"
              >
                <Phone className="size-4" /> {PRIMARY_PHONE.display}
              </a>
              <CallbackButton
                source="mobile-menu"
                className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground"
              >
                Передзвоніть мені
              </CallbackButton>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </header>
  );
}
