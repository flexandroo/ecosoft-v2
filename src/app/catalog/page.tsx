import type { Metadata } from "next";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { PageHeader } from "@/components/site/page-header";
import { CatalogView } from "@/components/catalog/catalog-view";
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
        <CatalogView products={PRODUCTS} />
      </main>
      <Footer />
    </>
  );
}
