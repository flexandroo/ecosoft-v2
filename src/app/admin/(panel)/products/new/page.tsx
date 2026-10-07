import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES } from "@/lib/products";
import { createSessionClient } from "@/lib/supabase/server";
import { PageTitle } from "../../ui";
import { NewProductForm, type NewProductDefaults } from "./new-product-form";

export const metadata: Metadata = { title: "Новий товар" };

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  let defaults: NewProductDefaults = { name: "", category: "", price: "" };
  let sourceName: string | null = null;

  if (from && /^[0-9a-f-]{36}$/i.test(from)) {
    const supabase = await createSessionClient();
    const { data } = await supabase.from("products").select("id, name, category, price").eq("id", from).maybeSingle();
    if (data) {
      sourceName = data.name;
      defaults = { from: data.id, name: `${data.name} (копія)`, category: data.category, price: String(data.price) };
    }
  }

  return (
    <>
      <div className="mb-2 text-sm">
        <Link href="/admin/products" className="text-muted-foreground hover:text-foreground">
          ← Товари
        </Link>
      </div>
      <PageTitle title={sourceName ? "Копія товару" : "Новий товар"} subtitle={sourceName ? `На основі «${sourceName}»` : undefined} />
      <NewProductForm categories={CATEGORIES.map((c) => ({ key: c.key, title: c.title }))} defaults={defaults} />
    </>
  );
}
