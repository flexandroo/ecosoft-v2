import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { PageHeader } from "@/components/site/page-header";
import { ProductDetail } from "@/components/product/product-detail";
import { JsonLd } from "@/components/seo/json-ld";
import { getProductImagePath } from "@/lib/product-identity";
import { getProduct, getProducts } from "@/lib/catalog";
import { getSiteSettings } from "@/lib/settings";
import { toPhoneContacts } from "@/lib/settings-shared";
import { findCategory } from "@/lib/products";

type Params = { category: string; slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return (await getProducts()).map((p) => ({ category: p.category, slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const product = await getProduct(category, slug);
  if (!product) return {};
  const metaDescription = `${product.name}${product.sku ? ` (${product.sku})` : ""} — ціна ${product.price.toLocaleString("uk-UA")} грн. Опис, характеристики, доставка по Україні та консультація з підбору.`;
  return {
    title: product.name,
    description: metaDescription,
    alternates: { canonical: `/catalog/${category}/${slug}` },
    openGraph: {
      type: "website",
      url: `/catalog/${category}/${slug}`,
      title: product.name,
      description: metaDescription,
      images: [{ url: getProductImagePath(product), alt: product.name }],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category, slug } = await params;
  const product = await getProduct(category, slug);
  if (!product) notFound();
  const [allProducts, settings] = await Promise.all([getProducts(), getSiteSettings()]);
  const cat = findCategory(category)!;
  const url = `https://sofiivkawater.com/catalog/${category}/${slug}`;
  const image = `https://sofiivkawater.com${getProductImagePath(product)}`;

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description,
            image: [image],
            sku: product.sku,
            brand: { "@type": "Brand", name: "Ecosoft" },
            offers: {
              "@type": "Offer",
              url,
              priceCurrency: "UAH",
              price: product.price,
              availability: product.inStock
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
              itemCondition: "https://schema.org/NewCondition",
            },
          }}
        />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Головна", item: "https://sofiivkawater.com/" },
              { "@type": "ListItem", position: 2, name: "Каталог", item: "https://sofiivkawater.com/catalog" },
              { "@type": "ListItem", position: 3, name: cat.title, item: `https://sofiivkawater.com/catalog/${category}` },
              { "@type": "ListItem", position: 4, name: product.name, item: url },
            ],
          }}
        />
        <PageHeader
          crumbs={[
            { href: "/", label: "Головна" },
            { href: "/catalog", label: "Каталог" },
            { href: `/catalog/${cat.key}`, label: cat.title },
            { label: product.name },
          ]}
        />
        <ProductDetail product={product} allProducts={allProducts} phones={toPhoneContacts(settings.phones)} />
      </main>
      <Footer />
    </>
  );
}
