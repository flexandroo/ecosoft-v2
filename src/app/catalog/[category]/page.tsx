import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { PageHeader } from "@/components/site/page-header";
import { CatalogView } from "@/components/catalog/catalog-view";
import {
  CATEGORIES,
  findCategory,
  productsByCategory,
  type CategoryKey,
} from "@/lib/products";

type Params = { category: string };

export function generateStaticParams(): Params[] {
  return CATEGORIES.map((c) => ({ category: c.key }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = findCategory(category);
  if (!cat) return {};
  return {
    title: cat.title,
    description: `${cat.title} — каталог Ecosoft. Доставка по Україні, гарантія, монтаж під ключ.`,
  };
}

export default async function CategoryCatalogPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category } = await params;
  const cat = findCategory(category);
  if (!cat) notFound();
  const products = productsByCategory(category as CategoryKey);

  return (
    <>
      <Header />
      <main className="flex-1">
        <PageHeader
          title={cat.title}
          crumbs={[
            { href: "/", label: "Головна" },
            { href: "/catalog", label: "Каталог" },
            { label: cat.title },
          ]}
        />
        <CatalogView products={products} lockedCategory={category as CategoryKey} />
      </main>
      <Footer />
    </>
  );
}
