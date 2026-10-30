import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createSessionClient } from "@/lib/supabase/server";
import { Card, PageTitle } from "../../../ui";
import { ServiceItemForm } from "../../forms";

export const metadata: Metadata = { title: "Графік заміни" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CARTRIDGE_CATEGORIES = ["ro-cartridges", "mainline-cartridges", "filter-media"];

export default async function BotPlanPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  if (!UUID.test(productId)) notFound();
  const supabase = await createSessionClient();
  const [{ data: product }, { data: items }, { data: cartridges }, { data: guides }, { count: owners }] = await Promise.all([
    supabase.from("products").select("id, sku, name").eq("id", productId).maybeSingle(),
    supabase.from("bot_service_items").select("id, title, interval_days, cartridge_product_id, guide_id, sort").eq("product_id", productId).order("sort"),
    supabase.from("products").select("id, sku, name").in("category", CARTRIDGE_CATEGORIES).order("name"),
    supabase.from("bot_guides").select("id, title").order("sort"),
    supabase.from("bot_client_filters").select("id", { count: "exact", head: true }).eq("product_id", productId),
  ]);
  if (!product) notFound();
  const cartridgeOptions = (cartridges ?? []).map((c) => ({ id: c.id, label: `${c.name} (${c.sku})` }));
  const guideOptions = (guides ?? []).map((g) => ({ id: g.id, label: g.title }));

  return (
    <>
      <Link href="/admin/bot/plans" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Графіки заміни
      </Link>
      <PageTitle
        title={product.name}
        subtitle={`${product.sku} · у боті цей фільтр мають ${owners ?? 0} клієнтів. Зміна інтервалу одразу змінює дати наступних замін у них.`}
      />
      <Card>
        <div className="grid gap-3">
          {(items ?? []).map((item) => (
            <ServiceItemForm key={item.id} productId={product.id} item={item} cartridges={cartridgeOptions} guides={guideOptions} />
          ))}
          <div>
            <h2 className="mb-2 mt-2 text-sm font-semibold">{(items ?? []).length ? "Додати ще картридж" : "Додати перший картридж до графіка"}</h2>
            <ServiceItemForm productId={product.id} item={null} cartridges={cartridgeOptions} guides={guideOptions} />
          </div>
        </div>
      </Card>
    </>
  );
}
