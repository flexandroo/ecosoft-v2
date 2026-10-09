import type { Metadata } from "next";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { CatalogHeader } from "@/components/catalog/catalog-header";
import { CatalogView } from "@/components/catalog/catalog-view";
import { CategoryPills } from "@/components/catalog/category-pills";
import { getListedProducts, toListingProduct } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Каталог",
  alternates: { canonical: "/catalog" },
  description:
    "Повний каталог систем очищення води Ecosoft: зворотний осмос, фільтраційні системи, магістральні фільтри, картриджі, матеріали та рішення для бізнесу.",
};

export default async function CatalogPage() {
  const products = (await getListedProducts()).map(toListingProduct);
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <CatalogHeader title="Каталог" />
        <div className="mx-auto max-w-[1600px] px-4 pt-4 md:px-8">
          <CategoryPills />
        </div>
        <CatalogView products={products} />
      </main>
      <Footer />
    </>
  );
}
