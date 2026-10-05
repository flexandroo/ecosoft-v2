import { createMetaProductFeed } from "@/lib/meta-feed";
import { getProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return new Response(createMetaProductFeed(await getProducts()), {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Disposition": 'inline; filename="meta-feed.xml"',
      "Content-Type": "application/rss+xml; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
