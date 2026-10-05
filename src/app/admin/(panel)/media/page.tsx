import type { Metadata } from "next";
import Link from "next/link";
import { mediaUsage } from "@/lib/admin/media";
import type { MediaAsset } from "@/lib/media-upload";
import { createSessionClient } from "@/lib/supabase/server";
import { PageTitle, inputBaseClass } from "../ui";
import { MediaGrid } from "./media-grid";

export const metadata: Metadata = { title: "Медіатека" };

const FOLDERS = [
  { id: "", label: "Усі" },
  { id: "library", label: "Загальні" },
  { id: "products", label: "Товари" },
  { id: "banners", label: "Банери" },
  { id: "blog", label: "Блог" },
  { id: "pages", label: "Сторінки" },
] as const;

const PAGE_SIZE = 60;

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string; q?: string; page?: string; unused?: string }>;
}) {
  const params = await searchParams;
  const folder = FOLDERS.some((f) => f.id === params.folder) ? params.folder! : "";
  const q = (params.q ?? "").trim().slice(0, 100);
  const onlyUnused = params.unused === "1";
  const page = Math.max(1, Math.trunc(Number(params.page)) || 1);

  const supabase = await createSessionClient();
  let query = supabase
    .from("media_assets")
    .select("id, path, url, folder, mime_type, size_bytes, width, height, alt, created_at", { count: "exact" })
    .order("created_at", { ascending: false });
  if (folder) query = query.eq("folder", folder);
  if (q) {
    const safe = q.replace(/[%,()*]/g, " ");
    query = query.or(`path.ilike.%${safe}%,alt.ilike.%${safe}%`);
  }
  // The "unused" filter needs usage data, so it is applied after loading (library sizes stay small).
  if (!onlyUnused) query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const [{ data, count, error }, usage] = await Promise.all([query, mediaUsage(supabase)]);

  let assets = (data ?? []) as MediaAsset[];
  if (onlyUnused) assets = assets.filter((a) => !usage.has(a.url));
  const total = onlyUnused ? assets.length : (count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const link = (overrides: Record<string, string | number>) => {
    const next = new URLSearchParams();
    const merged = { folder, q, unused: onlyUnused ? "1" : "", page: 1, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value && !(key === "page" && value === 1)) next.set(key, String(value));
    }
    const s = next.toString();
    return s ? `/admin/media?${s}` : "/admin/media";
  };

  return (
    <>
      <PageTitle title="Медіатека" subtitle={`${total} файлів · фото товарів, банерів і загальні зображення`} />

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {FOLDERS.map((f) => (
          <Link
            key={f.id}
            href={link({ folder: f.id })}
            className={
              folder === f.id
                ? "rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background"
                : "rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            }
          >
            {f.label}
          </Link>
        ))}
        <Link
          href={link({ unused: onlyUnused ? "" : "1" })}
          className={
            onlyUnused
              ? "ml-2 rounded-full bg-amber-500 px-3 py-1 text-xs font-medium text-white"
              : "ml-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          }
        >
          Невикористані
        </Link>
      </div>

      <form className="mb-4 flex flex-wrap gap-2" action="/admin/media">
        {folder && <input type="hidden" name="folder" value={folder} />}
        {onlyUnused && <input type="hidden" name="unused" value="1" />}
        <input name="q" defaultValue={q} placeholder="Назва файлу або опис" className={`${inputBaseClass} w-64 max-w-full`} />
        <button type="submit" className="h-9 rounded-lg border bg-background px-3 text-sm font-medium hover:bg-muted">
          Знайти
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-rose-700">Помилка завантаження: {error.message}</p>}

      <MediaGrid
        assets={onlyUnused ? assets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : assets}
        usage={Object.fromEntries(assets.map((a) => [a.url, usage.get(a.url) ?? []]))}
      />

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Сторінка {page} з {totalPages}
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
