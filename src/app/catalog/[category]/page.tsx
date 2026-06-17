import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { CatalogView } from "@/components/catalog/catalog-view";
import { CategoryHero } from "@/components/catalog/category-hero";
import { CategoryPills } from "@/components/catalog/category-pills";
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

// Generated category banners — keep in sync with files in /public/images/categories.
const CATEGORY_IMAGES: Record<string, string> = {
  "reverse-osmosis": "/images/categories/reverse-osmosis.png",
  "flow-filters": "/images/categories/flow-filters.jpeg",
  "filtration-systems": "/images/categories/filtration-systems.png",
  "mainline-filters": "/images/categories/mainline-filters.jpeg",
  "ro-cartridges": "/images/categories/ro-cartridges.jpeg",
  "mainline-cartridges": "/images/categories/mainline-cartridges.jpeg",
  "filter-media": "/images/categories/filter-media.jpeg",
  horeca: "/images/categories/horeca.jpeg",
};

function categoryImage(key: string): string | undefined {
  return CATEGORY_IMAGES[key];
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
      <main id="main-content" className="flex-1">
        <CategoryHero
          categoryKey={category as CategoryKey}
          title={cat.title}
          products={products}
          image={categoryImage(category)}
        />
        <div className="mx-auto max-w-[1600px] px-4 pt-6 md:px-8">
          <CategoryPills />
        </div>
        <CatalogView products={products} lockedCategory={category as CategoryKey} />
      </main>
      <Footer />
    </>
  );
}
