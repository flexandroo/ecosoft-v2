import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { CatalogView } from "@/components/catalog/catalog-view";
import { CatalogHeader } from "@/components/catalog/catalog-header";
import { CategoryPills } from "@/components/catalog/category-pills";
import { CATEGORIES, type CategoryKey } from "@/lib/products";
import { getStoreCategory } from "@/lib/categories";
import { getProductsByCategory, toListingProduct } from "@/lib/catalog";

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
  const cat = await getStoreCategory(category);
  if (!cat || cat.hidden) return {};
  const title = cat.seoTitle || cat.title;
  const description =
    cat.metaDescription || `${cat.title} — каталог Ecosoft. Доставка по Україні, гарантія, монтаж під ключ.`;
  return {
    title,
    description,
    alternates: { canonical: `/catalog/${category}` },
    openGraph: {
      url: `/catalog/${category}`,
      title,
      description,
      images: [{ url: cat.image }],
    },
  };
}

export default async function CategoryCatalogPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category } = await params;
  const cat = await getStoreCategory(category);
  if (!cat || cat.hidden) notFound();
  const products = await getProductsByCategory(category as CategoryKey);

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <CatalogHeader
          title={cat.title}
          crumbs={[
            { href: "/", label: "Головна" },
            { href: "/catalog", label: "Каталог" },
            { label: cat.title },
          ]}
        />
        <div className="mx-auto max-w-[1600px] px-4 pt-4 md:px-8">
          <CategoryPills />
        </div>
        <CatalogView products={products.map(toListingProduct)} lockedCategory={category as CategoryKey} />
        {cat.seoText && (
          <section className="mx-auto max-w-[1600px] px-4 pb-16 md:px-8">
            <div className="max-w-3xl border-t border-border pt-8 text-[15px] leading-relaxed whitespace-pre-line text-muted-foreground">
              {cat.seoText}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
