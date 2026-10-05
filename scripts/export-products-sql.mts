// Generates SQL that seeds public.products from the bundled catalogue
// (src/lib/products.ts). Existing rows are left untouched (on conflict do nothing),
// so it is safe to re-run after managers have edited products in the admin.
//
// Usage: node scripts/export-products-sql.mts <out-dir> [chunk-size]
// Writes products-001.sql, products-002.sql, ... into <out-dir>.

import fs from "node:fs";
import path from "node:path";
import { PRODUCTS, type Product } from "../src/lib/products.ts";

const outDir = process.argv[2];
const chunkSize = Number(process.argv[3] ?? 20);
if (!outDir) {
  console.error("usage: node scripts/export-products-sql.mts <out-dir> [chunk-size]");
  process.exit(1);
}

const TOP_LEVEL = new Set<keyof Product>([
  "slug",
  "sku",
  "category",
  "name",
  "price",
  "oldPrice",
  "inStock",
  "ctaType",
  "description",
  "image",
  "images",
  "details",
]);

function lit(value: string | null | undefined): string {
  if (value === null || value === undefined) return "null";
  return `'${value.replace(/'/g, "''")}'`;
}

function json(value: unknown): string {
  return `${lit(JSON.stringify(value ?? null))}::jsonb`;
}

function row(p: Product, index: number): string {
  const attributes = Object.fromEntries(
    Object.entries(p).filter(([key]) => !TOP_LEVEL.has(key as keyof Product)),
  );
  return `(${[
    lit(p.slug),
    lit(p.sku ?? null),
    lit(p.category),
    lit(p.name),
    String(p.price),
    p.oldPrice == null ? "null" : String(p.oldPrice),
    String(p.inStock),
    lit(p.ctaType),
    lit(p.description),
    lit(p.image ?? null),
    json(p.images ?? []),
    json(p.details ?? {}),
    json(attributes),
    String(index * 10),
  ].join(", ")})`;
}

fs.mkdirSync(outDir, { recursive: true });
const chunks = Math.ceil(PRODUCTS.length / chunkSize);
for (let c = 0; c < chunks; c++) {
  const slice = PRODUCTS.slice(c * chunkSize, (c + 1) * chunkSize);
  const values = slice.map((p, i) => row(p, c * chunkSize + i)).join(",\n");
  const sql =
    "insert into public.products (slug, sku, category, name, price, old_price, in_stock, cta_type, description, image, images, details, attributes, sort)\nvalues\n" +
    values +
    "\non conflict (slug) do nothing;\n";
  fs.writeFileSync(path.join(outDir, `products-${String(c + 1).padStart(3, "0")}.sql`), sql);
}
console.log(`${PRODUCTS.length} products -> ${chunks} files in ${outDir}`);
