import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORY_GROUPS, mergeCategories, type CategoryRow } from "@/lib/categories-shared";
import { createSessionClient } from "@/lib/supabase/server";
import { Card, PageTitle } from "../ui";
import { CategoryRowControls } from "./row-controls";

export const metadata: Metadata = { title: "Категорії" };

export default async function CategoriesPage() {
  const supabase = await createSessionClient();
  const [{ data: rows }, { data: products }] = await Promise.all([
    supabase.from("categories").select("key, title, short_title, subtitle, seo_title, meta_description, seo_text, image, group_key, sort, is_hidden"),
    supabase.from("products").select("category, is_hidden"),
  ]);
  const categories = mergeCategories((rows ?? []) as CategoryRow[]);
  const groupTitle = new Map(CATEGORY_GROUPS.map((g) => [g.key, g.title]));
  const counts = new Map<string, number>();
  for (const p of products ?? []) if (!p.is_hidden) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);

  return (
    <>
      <PageTitle
        title="Категорії"
        subtitle="Назви, описи, картинки й порядок категорій на сайті. Адреси категорій не змінюються."
      />
      <Card className="overflow-x-auto p-0 sm:p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Категорія</th>
              <th className="px-4 py-2.5 font-medium">Група в меню</th>
              <th className="px-4 py-2.5 font-medium">Товарів</th>
              <th className="px-4 py-2.5 font-medium">Показ</th>
              <th className="px-4 py-2.5 text-right font-medium">Порядок</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map((c, index) => (
              <tr key={c.key} className={c.hidden ? "bg-muted/40 text-muted-foreground" : "hover:bg-muted/50"}>
                <td className="px-4 py-2">
                  <Link href={`/admin/categories/${c.key}`} className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.image} alt="" className="h-10 w-16 shrink-0 rounded-md border object-cover" />
                    <span>
                      <span className="block font-medium hover:text-primary">{c.title}</span>
                      <span className="text-xs text-muted-foreground">/catalog/{c.key}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-2">{groupTitle.get(c.group)}</td>
                <td className="px-4 py-2">{counts.get(c.key) ?? 0}</td>
                <CategoryRowControls categoryKey={c.key} hidden={c.hidden} first={index === 0} last={index === categories.length - 1} />
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-3 text-xs text-muted-foreground">
        Прихована категорія зникає з меню й головної, але її сторінка відкривається — посилання з реклами не зламаються.
        У фід Meta і події аналітики йдуть незмінні технічні назви категорій.
      </p>
    </>
  );
}
