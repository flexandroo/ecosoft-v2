import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { BANNER_PLACEMENTS } from "@/lib/admin/constants";
import { createSessionClient } from "@/lib/supabase/server";
import { Card, PageTitle, formatDateTime } from "../ui";

export const metadata: Metadata = { title: "Банери" };

type BannerRow = {
  id: string;
  placement: string;
  title: string;
  eyebrow: string;
  href: string;
  image_desktop: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  sort: number;
};

function liveState(b: BannerRow): { label: string; tone: string } {
  const now = Date.now();
  if (!b.is_active) return { label: "Вимкнено", tone: "bg-slate-200 text-slate-700" };
  if (b.starts_at && Date.parse(b.starts_at) > now) return { label: "Заплановано", tone: "bg-amber-100 text-amber-800" };
  if (b.ends_at && Date.parse(b.ends_at) <= now) return { label: "Завершено", tone: "bg-slate-200 text-slate-700" };
  return { label: "Показується", tone: "bg-emerald-100 text-emerald-800" };
}

export default async function BannersPage() {
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("banners")
    .select("id, placement, title, eyebrow, href, image_desktop, is_active, starts_at, ends_at, sort")
    .order("placement")
    .order("sort");
  const banners = (data ?? []) as BannerRow[];

  return (
    <>
      <PageTitle
        title="Банери"
        subtitle="Слайдер і промо-блоки на головній сторінці"
        actions={
          <Link
            href="/admin/banners/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/85"
          >
            <Plus className="size-4" /> Новий банер
          </Link>
        }
      />
      {error && <p className="mb-4 text-sm text-rose-700">Помилка завантаження: {error.message}</p>}

      {BANNER_PLACEMENTS.map((placement) => {
        const list = banners.filter((b) => b.placement === placement.id);
        return (
          <section key={placement.id} className="mb-8">
            <h2 className="mb-3 font-semibold">{placement.label}</h2>
            {list.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((b) => {
                  const state = liveState(b);
                  return (
                    <Link key={b.id} href={`/admin/banners/${b.id}`} className="group block">
                      <Card className="h-full p-0 sm:p-0">
                        <div className="aspect-[16/7] overflow-hidden rounded-t-xl bg-muted">
                          {b.image_desktop && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={b.image_desktop} alt="" className="size-full object-cover" />
                          )}
                        </div>
                        <div className="space-y-1 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${state.tone}`}>
                              {state.label}
                            </span>
                            <span className="text-xs text-muted-foreground">порядок {b.sort}</span>
                          </div>
                          {b.eyebrow && <p className="text-xs text-muted-foreground uppercase">{b.eyebrow}</p>}
                          <p className="font-medium group-hover:text-primary">{b.title}</p>
                          <p className="truncate text-xs text-muted-foreground">→ {b.href}</p>
                          {(b.starts_at || b.ends_at) && (
                            <p className="text-xs text-muted-foreground">
                              {b.starts_at ? `з ${formatDateTime(b.starts_at)} ` : ""}
                              {b.ends_at ? `до ${formatDateTime(b.ends_at)}` : ""}
                            </p>
                          )}
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Немає банерів — на сайті показується стандартний блок.</p>
            )}
          </section>
        );
      })}
    </>
  );
}
