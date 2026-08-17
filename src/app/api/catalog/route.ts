import { CATEGORIES, PRODUCTS } from "@/lib/products";

const STORE_ORIGIN = "https://sofiivkawater.com";
const categoryNames = new Map(CATEGORIES.map((category) => [category.key, category.title]));

export async function GET() {
  const products = PRODUCTS.map((product) => ({
    id: product.sku || product.slug,
    sku: product.sku || "",
    slug: product.slug,
    name: product.name,
    category: product.category,
    categoryName: categoryNames.get(product.category) || product.category,
    price: product.price,
    oldPrice: product.oldPrice || null,
    currency: "UAH",
    inStock: product.inStock,
    ctaType: product.ctaType,
    description: product.description,
    image: product.image ? new URL(product.image, STORE_ORIGIN).href : null,
    url: `${STORE_ORIGIN}/catalog/${product.category}/${product.slug}`,
  }));

  return Response.json(
    {
      ok: true,
      source: "sofiivkawater.com",
      currency: "UAH",
      count: products.length,
      products,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
