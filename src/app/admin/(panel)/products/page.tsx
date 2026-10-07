import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CATEGORIES } from "@/lib/products";
import { formatUah } from "@/lib/format";
import { createSessionClient } from "@/lib/supabase/server";
import { Card, PageTitle, inputBaseClass } from "../ui";
import { ProductFlagToggle } from "./flag-toggle";

export const metadata: Metadata = { title: "Товари" };

const VIEWS = [
  { id: "", label: "Усі" },
  { id: "sale", label: "Зі знижкою" },
  { id: "out", label: "Немає в наявності" },
  { id: "hidden", label: "Приховані" },
] as const;

const PAGE_SIZE = 100;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; view?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 100);
  const category = CATEGORIES.some((c) => c.key === params.category) ? params.category! : "";
  const view = VIEWS.some((v) => v.id === params.view) ? params.view! : "";
  const page = Math.max(1, Math.trunc(Number(params.page)) || 1);

  const supabase = await createSessionClient();
  let query = supabase
    .from("products")
    .select("id, slug, sku, category, name, price, old_price, in_stock, image, is_hidden", { count: "exact" })
    .order("sort")
    .order("name")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (category) query = query.eq("category", category);
  if (view === "sale") query = query.not("old_price", "is", null);
  if (view === "out") query = query.eq("in_stock", false);
  if (view === "hidden") query = query.eq("is_hidden", true);
  if (q) {
    const safe = q.replace(/[%,()*]/g, " ");
    query = query.or(`name.ilike.%${safe}%,sku.ilike.%${safe}%`);
  }
  const { data: products, error, count } = await query;
  const total = count ?? products?.length ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const categoryTitle = new Map(CATEGORIES.map((c) => [c.key, c.short]));

  const viewLink = (id: string, toPage = 1) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (category) next.set("category", category);
    if (id) next.set("view", id);
    if (toPage > 1) next.set("page", String(toPage));
    const s = next.toString();
    return s ? `/admin/products?${s}` : "/admin/products";
  };

  return (
    <>
      <PageTitle
        title="Товари"
        subtitle={`${total} позицій`}
        actions={
          <Link
            href="/admin/products/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" /> Новий товар
          </Link>
        }
      />

      <div className="mb-3 flex flex-wrap gap-1.5">
        {VIEWS.map((v) => (
          <Link
            key={v.id}
            href={viewLink(v.id)}
            className={
              view === v.id
                ? "rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background"
                : "rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            }
          >
            {v.label}
          </Link>
        ))}
      </div>

      <form className="mb-4 flex flex-wrap gap-2" action="/admin/products">
        {view && <input type="hidden" name="view" value={view} />}
        <select name="category" defaultValue={category} className={inputBaseClass}>
          <option value="">Усі категорії</option>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.title}
            </option>
          ))}
        </select>
        <input name="q" defaultValue={q} placeholder="Назва або артикул" className={`${inputBaseClass} w-64 max-w-full`} />
        <button type="submit" className="h-9 rounded-lg border bg-background px-3 text-sm font-medium hover:bg-muted">
          Знайти
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-rose-700">Помилка завантаження: {error.message}</p>}

      <Card className="overflow-x-auto p-0 sm:p-0">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="border-b text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Товар</th>
              <th className="px-4 py-2.5 font-medium">Ціна</th>
              <th className="px-3 py-2.5 text-center font-medium">В наявності</th>
              <th className="px-3 py-2.5 text-center font-medium">Приховано</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(products ?? []).map((p) => (
              <tr key={p.id} className={p.is_hidden ? "bg-muted/40 text-muted-foreground" : "hover:bg-muted/50"}>
                <td className="px-4 py-2">
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt="" className="size-10 shrink-0 rounded-md border bg-white object-contain" />
                    ) : (
                      <span className="size-10 shrink-0 rounded-md border bg-muted" />
                    )}
                    <span>
                      <span className="line-clamp-2 font-medium hover:text-primary">{p.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {p.sku ?? "без артикула"} · {categoryTitle.get(p.category as never) ?? p.category}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {formatUah(Number(p.price))}
                  {p.old_price != null && (
                    <div className="text-xs text-muted-foreground line-through">{formatUah(Number(p.old_price))}</div>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  <ProductFlagToggle id={p.id} field="in_stock" value={p.in_stock} />
                </td>
                <td className="px-3 py-2 text-center">
                  <ProductFlagToggle id={p.id} field="is_hidden" value={p.is_hidden} />
                </td>
              </tr>
            ))}
            {!products?.length && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  Нічого не знайдено.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
      {pages > 1 && (
        <nav aria-label="Сторінки" className="mt-4 flex items-center justify-center gap-3 text-sm">
          {page > 1 ? (
            <Link href={viewLink(view, page - 1)} className="rounded-lg border bg-background px-3 py-1.5 hover:bg-muted">
              ← Попередня
            </Link>
          ) : (
            <span className="rounded-lg border px-3 py-1.5 text-muted-foreground opacity-50">← Попередня</span>
          )}
          <span className="text-muted-foreground">
            Сторінка {page} з {pages}
          </span>
          {page < pages ? (
            <Link href={viewLink(view, page + 1)} className="rounded-lg border bg-background px-3 py-1.5 hover:bg-muted">
              Наступна →
            </Link>
          ) : (
            <span className="rounded-lg border px-3 py-1.5 text-muted-foreground opacity-50">Наступна →</span>
          )}
        </nav>
      )}
    </>
  );
}
