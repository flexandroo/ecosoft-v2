import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const products = JSON.parse(
  fs.readFileSync(path.join(root, "scripts", "source", "products.data.json"), "utf8"),
);
const seen = new Set();
const errors = [];

for (const product of products) {
  const id = String(product.sku || product.id || product.slug || "");
  const filename = `${id.replace(/[^a-zA-Z0-9._-]/g, "_")}.jpg`;
  if (!id) errors.push(`Product without an ID: ${product.slug || "unknown"}`);
  if (seen.has(id)) errors.push(`Duplicate product ID: ${id}`);
  seen.add(id);
  if (!(Number(product.price) > 0)) errors.push(`Invalid price: ${id}`);
  if (!fs.existsSync(path.join(root, "public", "images", "meta-products", filename))) {
    errors.push(`Missing local product image: ${id}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Verified ${products.length} products: IDs, prices and local images are valid.`);
