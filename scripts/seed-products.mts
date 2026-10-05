// Seeds public.products from the bundled catalogue through the Supabase REST API.
// Existing rows (same slug) are left untouched, so re-running never overwrites
// edits made in the admin.
//
// Usage:
//   node scripts/seed-products.mts <env-file>
// The env file must define NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.

import fs from "node:fs";
import { PRODUCTS, type Product } from "../src/lib/products.ts";

const envFile = process.argv[2];
if (!envFile) {
  console.error("usage: node scripts/seed-products.mts <env-file>");
  process.exit(1);
}
const env = Object.fromEntries(
  fs
    .readFileSync(envFile, "utf8")
    .split(/\r?\n/)
    .filter((line) => /^[A-Z0-9_]+=/.test(line))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const secret = env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required in", envFile);
  process.exit(1);
}

const TOP_LEVEL = new Set<string>([
  "slug", "sku", "category", "name", "price", "oldPrice", "inStock",
  "ctaType", "description", "image", "images", "details",
]);

function toRow(p: Product, index: number) {
  return {
    slug: p.slug,
    sku: p.sku ?? null,
    category: p.category,
    name: p.name,
    price: p.price,
    old_price: p.oldPrice ?? null,
    in_stock: p.inStock,
    cta_type: p.ctaType,
    description: p.description,
    image: p.image ?? null,
    images: p.images ?? [],
    details: p.details ?? {},
    attributes: Object.fromEntries(Object.entries(p).filter(([key]) => !TOP_LEVEL.has(key))),
    sort: index * 10,
  };
}

const rows = PRODUCTS.map(toRow);
const BATCH = 40;
for (let i = 0; i < rows.length; i += BATCH) {
  const response = await fetch(`${url}/rest/v1/products?on_conflict=slug`, {
    method: "POST",
    headers: {
      apikey: secret,
      "Content-Type": "application/json",
      Prefer: "resolution=ignore-duplicates,return=minimal",
    },
    body: JSON.stringify(rows.slice(i, i + BATCH)),
  });
  if (!response.ok) {
    console.error(`batch ${i / BATCH + 1} failed: HTTP ${response.status}`, await response.text());
    process.exit(1);
  }
  console.log(`seeded ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
}
