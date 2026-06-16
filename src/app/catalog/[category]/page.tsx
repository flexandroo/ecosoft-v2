import type { Metadata } from "next";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { notFound } from "next/navigation";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { CatalogView } from "@/components/catalog/catalog-view";
import { CategoryGrid } from "@/components/catalog/category-grid";
import { CategoryHero } from "@/components/catalog/category-hero";
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

// Auto-detect a generated banner at /public/images/categories/<key>.<ext>.
// Drop a file there and the category hero switches to it — no code change.
function categoryImage(key: string): string | undefined {
  for (const ext of ["webp", "jpg", "jpeg", "png", "avif"]) {
    const rel = `images/categories/${key}.${ext}`;
    if (existsSync(join(process.cwd(), "public", rel))) return `/${rel}`;
  }
  return undefined;
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
        <section className="mx-auto max-w-[1600px] px-4 pt-8 md:px-8 md:pt-10">
          <h2 className="mb-5 font-[family-name:var(--font-manrope)] text-xl font-bold tracking-tight md:text-2xl">
            Категорії товарів
          </h2>
          <CategoryGrid activeKey={category as CategoryKey} />
        </section>
        <CatalogView products={products} lockedCategory={category as CategoryKey} />
      </main>
      <Footer />
    </>
  );
}
