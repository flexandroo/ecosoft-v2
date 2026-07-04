import type { Metadata } from "next";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { PageHeader } from "@/components/site/page-header";
import { CatalogCategories } from "@/components/catalog/catalog-categories";

export const metadata: Metadata = {
  title: "Каталог",
  description:
    "Категорії систем очищення води Ecosoft: зворотний осмос, фільтраційні системи, магістральні фільтри, картриджі, матеріали та рішення для бізнесу.",
};

export default function CatalogPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <PageHeader
          title="Каталог"
          subtitle="Оберіть категорію — усередині зручний пошук, фільтри та сортування під вашу воду."
          crumbs={[
            { href: "/", label: "Головна" },
            { label: "Каталог" },
          ]}
        />
        <div className="mx-auto max-w-[1600px] px-4 py-10 md:px-8 md:py-14">
          <CatalogCategories />
        </div>
      </main>
      <Footer />
    </>
  );
}
