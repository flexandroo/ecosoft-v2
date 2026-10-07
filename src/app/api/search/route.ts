import { getListedProducts } from "@/lib/catalog";
import { searchScore } from "@/lib/catalog-filters";
import { getProductDisplayImage } from "@/lib/product-identity";

export type SearchSuggestion = {
  slug: string;
  href: string;
  name: string;
  sku: string;
  price: number;
  oldPrice: number | null;
  inStock: boolean;
  image: string | null;
};

const LIMIT = 6;

/** Live suggestions for the header search box: best matches with photo and price. */
export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 100);
  if (q.length < 2) return Response.json({ total: 0, items: [] });

  const scored = (await getListedProducts())
    .map((p) => ({ p, score: searchScore(p, q) }))
    .filter((x) => x.score > 0)
    // In-stock first, then relevance; ties keep catalogue order.
    .sort((a, b) => Number(b.p.inStock) - Number(a.p.inStock) || b.score - a.score);

  const items: SearchSuggestion[] = scored.slice(0, LIMIT).map(({ p }) => ({
    slug: p.slug,
    href: `/catalog/${p.category}/${p.slug}`,
    name: p.name,
    sku: p.sku ?? "",
    price: p.price,
    oldPrice: p.oldPrice || null,
    inStock: p.inStock,
    image: getProductDisplayImage(p) || null,
  }));

  return Response.json(
    { total: scored.length, items },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } },
  );
}
