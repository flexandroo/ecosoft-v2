import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { PageHeader } from "@/components/site/page-header";
import { ProductCard } from "@/components/catalog/product-card";
import { getCollectionProducts } from "@/lib/collections";

/** Managers fill this page through the "Акційні пропозиції" collection in /admin/collections. */
const PROMO_COLLECTION = "promo";

export const metadata: Metadata = {
  title: "Акційні пропозиції",
  description: "Фільтри для води, системи очищення та картриджі Ecosoft за вигідною ціною. Доставка по Україні, монтаж під ключ.",
  alternates: { canonical: "/promo" },
};

export default async function PromoPage() {
  const promo = await getCollectionProducts(PROMO_COLLECTION);
  const products = promo?.products ?? [];

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <PageHeader
          title={promo?.title || "Акційні пропозиції"}
          subtitle="Фільтри, системи очищення та картриджі Ecosoft за вигідною ціною."
          crumbs={[{ href: "/", label: "Головна" }, { label: "Акції" }]}
        />
        <section className="mx-auto max-w-[1600px] px-4 py-10 md:px-8 md:py-14">
          {products.length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <h2 className="font-[family-name:var(--font-manrope)] text-xl font-bold">Зараз акцій немає</h2>
              <p className="mt-2 text-sm text-muted-foreground">Загляньте пізніше або оберіть товар у каталозі.</p>
              <Link
                href="/catalog"
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                До каталогу <ArrowRight className="size-4" />
              </Link>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
