import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { mergeCategories, type CategoryRow } from "@/lib/categories-shared";
import { CATEGORIES } from "@/lib/products";
import { createSessionClient } from "@/lib/supabase/server";
import { PageTitle } from "../../ui";
import { CategoryForm } from "./category-form";

export const metadata: Metadata = { title: "Категорія" };

export default async function CategoryEditPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const technical = CATEGORIES.find((c) => c.key === key);
  if (!technical) notFound();
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("categories")
    .select("key, title, short_title, subtitle, seo_title, meta_description, seo_text, image, group_key, sort, is_hidden")
    .eq("key", key)
    .maybeSingle();
  const category = mergeCategories(data ? [data as CategoryRow] : []).find((c) => c.key === key)!;

  return (
    <>
      <div className="mb-2 text-sm">
        <Link href="/admin/categories" className="text-muted-foreground hover:text-foreground">
          ← Категорії
        </Link>
      </div>
      <PageTitle
        title={category.title}
        subtitle={`/catalog/${key} · у рекламі: «${technical.title}»`}
        actions={
          <a
            href={`/catalog/${key}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-background px-3 text-sm font-medium hover:bg-muted"
          >
            <ExternalLink className="size-4" /> На сайті
          </a>
        }
      />
      <CategoryForm category={category} />
    </>
  );
}
