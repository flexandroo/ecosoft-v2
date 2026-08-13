import type { Metadata } from "next";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { PageHeader } from "@/components/site/page-header";
import { CatalogView } from "@/components/catalog/catalog-view";
import { PRODUCTS } from "@/lib/products";

export const metadata: Metadata = {
  title: "Пошук товарів",
  description: "Пошук систем очищення води, фільтрів і картриджів Ecosoft.",
  alternates: { canonical: "/search" },
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <PageHeader
          title="Пошук товарів"
          subtitle="Шукайте за назвою, моделлю, SKU або призначенням фільтра."
          crumbs={[{ href: "/", label: "Головна" }, { label: "Пошук" }]}
        />
        <CatalogView products={PRODUCTS} initialQuery={q.slice(0, 100)} searchMode />
      </main>
      <Footer />
    </>
  );
}
