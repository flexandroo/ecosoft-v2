import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Copy, ExternalLink } from "lucide-react";
import { findCategory } from "@/lib/products";
import { createSessionClient } from "@/lib/supabase/server";
import { getStaff } from "@/lib/admin/auth";
import { deleteProduct } from "../../../actions";
import { ConfirmSubmitButton } from "../../form-status";
import { PageTitle, formatDateTime } from "../../ui";
import { ProductForm } from "./product-form";

export const metadata: Metadata = { title: "Товар" };

export default async function ProductEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const [{ id }, { created }, staff] = await Promise.all([params, searchParams, getStaff()]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createSessionClient();
  const [{ data: product }, { data: collections }, { data: memberships }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("collections").select("id, title, show_on_home").order("sort"),
    supabase.from("collection_items").select("collection_id").eq("product_id", id),
  ]);
  if (!product) notFound();
  const memberOf = new Set((memberships ?? []).map((m) => m.collection_id));
  const category = findCategory(product.category);
  const publicUrl = `/catalog/${product.category}/${product.slug}`;

  return (
    <>
      <div className="mb-2 text-sm">
        <Link href="/admin/products" className="text-muted-foreground hover:text-foreground">
          ← Товари
        </Link>
      </div>
      <PageTitle
        title={product.name}
        subtitle={`${category?.title ?? product.category} · оновлено ${formatDateTime(product.updated_at)}`}
        actions={
          <>
            <Link
              href={`/admin/products/new?from=${product.id}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-background px-3 text-sm font-medium hover:bg-muted"
            >
              <Copy className="size-4" /> Дублювати
            </Link>
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-background px-3 text-sm font-medium hover:bg-muted"
            >
              <ExternalLink className="size-4" /> На сайті
            </a>
          </>
        }
      />
      {created && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Товар створено й приховано. Додайте фото, перевірте дані та зніміть «Приховати з сайту».
        </p>
      )}
      <ProductForm
        product={{
          id: product.id,
          slug: product.slug,
          sku: product.sku,
          category: product.category,
          name: product.name,
          price: Number(product.price),
          old_price: product.old_price == null ? null : Number(product.old_price),
          in_stock: product.in_stock,
          cta_type: product.cta_type,
          description: product.description,
          images: (product.images as string[] | null)?.length ? (product.images as string[]) : product.image ? [product.image] : [],
          is_hidden: product.is_hidden,
          sort: product.sort,
          updated_at: product.updated_at,
        }}
        collections={(collections ?? []).map((c) => ({
          id: c.id,
          title: c.title,
          showOnHome: c.show_on_home,
          included: memberOf.has(c.id),
        }))}
      />
      {staff?.role === "admin" && (
        <form action={deleteProduct} className="mt-10 border-t pt-5">
          <input type="hidden" name="id" value={product.id} />
          <p className="mb-2 text-sm text-muted-foreground">
            Щоб тимчасово прибрати товар із сайту, використовуйте «Приховати з сайту». Видалення остаточне: зникне
            сторінка товару, а реклама з цим артикулом перестане працювати.
          </p>
          <ConfirmSubmitButton
            confirmText={`Видалити «${product.name}» назавжди? Це не можна скасувати.`}
            className="text-sm font-medium text-rose-700 hover:underline disabled:opacity-50"
          >
            Видалити товар назавжди
          </ConfirmSubmitButton>
        </form>
      )}
    </>
  );
}
