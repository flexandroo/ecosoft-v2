import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { PageHeader } from "@/components/site/page-header";
import { ProductDetail } from "@/components/product/product-detail";
import {
  findProduct,
  findCategory,
  PRODUCTS,
} from "@/lib/products";

type Params = { category: string; slug: string };

export function generateStaticParams(): Params[] {
  return PRODUCTS.map((p) => ({ category: p.category, slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const product = findProduct(category, slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category, slug } = await params;
  const product = findProduct(category, slug);
  if (!product) notFound();
  const cat = findCategory(category)!;

  return (
    <>
      <Header />
      <main className="flex-1">
        <PageHeader
          crumbs={[
            { href: "/", label: "Головна" },
            { href: "/catalog", label: "Каталог" },
            { href: `/catalog/${cat.key}`, label: cat.title },
            { label: product.name },
          ]}
        />
        <ProductDetail product={product} />
      </main>
      <Footer />
    </>
  );
}
