import type { Metadata } from "next";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { PageHeader } from "@/components/site/page-header";
import { CatalogView } from "@/components/catalog/catalog-view";
import { CategoryPills } from "@/components/catalog/category-pills";
import { PRODUCTS } from "@/lib/products";

export const metadata: Metadata = {
  title: "Каталог",
  alternates: { canonical: "/catalog" },
  description:
    "Повний каталог систем очищення води Ecosoft: зворотний осмос, фільтраційні системи, магістральні фільтри, картриджі, матеріали та рішення для бізнесу.",
};

export default function CatalogPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <PageHeader
          title="Каталог"
          subtitle="Усі товари Ecosoft в одному каталозі — оберіть категорію або скористайтеся пошуком і фільтрами."
          crumbs={[
            { href: "/", label: "Головна" },
            { label: "Каталог" },
          ]}
        />
        <div className="mx-auto max-w-[1600px] px-4 pt-6 md:px-8">
          <CategoryPills />
        </div>
        <CatalogView products={PRODUCTS} />
      </main>
      <Footer />
    </>
  );
}
