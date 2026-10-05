import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";
import { PageTitle } from "../../ui";
import { CollectionEditor, type CollectionProduct } from "./editor";

export const metadata: Metadata = { title: "Підбірка" };

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createSessionClient();
  const [{ data: collection }, { data: items }, { data: products }] = await Promise.all([
    supabase.from("collections").select("id, slug, title, eyebrow, link_href, link_label, show_on_home").eq("id", id).maybeSingle(),
    supabase.from("collection_items").select("product_id, sort").eq("collection_id", id).order("sort"),
    supabase.from("products").select("id, sku, name, price, old_price, image, in_stock, is_hidden").order("sort"),
  ]);
  if (!collection) notFound();

  const all = (products ?? []) as CollectionProduct[];
  const byId = new Map(all.map((p) => [p.id, p]));
  const selected = (items ?? []).map((i) => byId.get(i.product_id)).filter((p): p is CollectionProduct => Boolean(p));

  return (
    <>
      <div className="mb-2 text-sm">
        <Link href="/admin/collections" className="text-muted-foreground hover:text-foreground">
          ← Підбірки
        </Link>
      </div>
      <PageTitle title={collection.title} subtitle={`${selected.length} товарів`} />
      <CollectionEditor collection={collection} selected={selected} allProducts={all} />
    </>
  );
}
