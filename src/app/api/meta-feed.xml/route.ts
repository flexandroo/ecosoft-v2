import { createMetaProductFeed } from "@/lib/meta-feed";
import { PRODUCTS } from "@/lib/products";

export const dynamic = "force-dynamic";

export function GET(): Response {
  return new Response(createMetaProductFeed(PRODUCTS), {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Disposition": 'inline; filename="meta-feed.xml"',
      "Content-Type": "application/rss+xml; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
