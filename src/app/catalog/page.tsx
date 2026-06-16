import type { Metadata } from "next";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { PageHeader } from "@/components/site/page-header";
import { CatalogView } from "@/components/catalog/catalog-view";
import { CategoryGrid } from "@/components/catalog/category-grid";
import { PRODUCTS } from "@/lib/products";

export const metadata: Metadata = {
  title: "Каталог",
  description:
    "Системи зворотного осмосу, помʼякшувачі, фільтри, картриджі та промислові рішення. Підбір під аналіз води.",
};

export default function CatalogPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <PageHeader
          title="Каталог"
          subtitle="Системи очищення води для дому, квартири та бізнесу — підбір під аналіз води."
          crumbs={[
            { href: "/", label: "Головна" },
            { label: "Каталог" },
          ]}
        />
        <section className="mx-auto max-w-[1600px] px-4 pt-8 md:px-8 md:pt-10">
          <h2 className="mb-5 font-[family-name:var(--font-manrope)] text-xl font-bold tracking-tight md:text-2xl">
            Категорії товарів
          </h2>
          <CategoryGrid />
        </section>
        <CatalogView products={PRODUCTS} />
      </main>
      <Footer />
    </>
  );
}
