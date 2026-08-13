// Mirrors the primary catalogue images into our own public directory so Meta
// never depends on third-party hotlinks. Run after importing catalogue data.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "public", "images", "meta-products");
const PRODUCTS_PATH = path.join(__dirname, "source", "products.data.json");

const FALLBACK_IMAGES = {
  CPV4POST:
    "https://vencon.ua/uploads/goods/301675/main/ecosoft-cpv4post.jpg",
  CPV4MIN:
    "https://vencon.ua/uploads/goods/301089/main/ecosoft-cpv4min.jpg",
  CPV5POSTMIN:
    "https://vencon.ua/uploads/goods/301674/main/ecosoft-cpv5postmin.jpg",
  CPV5POST50GPD:
    "https://vencon.ua/uploads/goods/223170/main/ecosoft-standard-bez-mineralizatora-cpv5post50gpd.jpg",
  CPV5MCSVECO:
    "https://vencon.ua/uploads/goods/301090/main/ecosoft-cpv5mcsveco.jpg",
  CPV6POSTMIN50GPD:
    "https://vencon.ua/uploads/goods/223173/main/ecosoft-standard-s-mineralizatorom-cpv6postmin50gpd.jpg",
  CPV9MIN50GPD:
    "https://vencon.ua/uploads/goods/301091/main/ecosoft-cpv9min50gpd.jpg",
  CPV15POST50GPD:
    "https://vencon.ua/uploads/goods/191351/main/ecosoft-standard-bez-mineralizatora-cpv15post50gpd.jpg",
  CPV17POSTMIN50GPD:
    "https://vencon.ua/uploads/goods/191352/main/ecosoft-standard-s-mineralizatorom-cpv17postmin50gpd.jpg",
  CHV5PUREMAC:
    "https://vencon.ua/uploads/goods/301166/main/ecosoft-p-ure-aquacalcium-mint-6-mes-chv5puremac.jpg",
  CHV6PUREMAC:
    "https://vencon.ua/uploads/goods/301167/main/ecosoft-p-ure-aquacalcium-mint-12-mes-chv6puremac.jpg",
};

const USER_AGENT =
  "Mozilla/5.0 (compatible; SofiivkaWaterFeed/1.0; +https://sofiivkawater.com)";

function itemId(product) {
  return String(product.sku || product.id || product.slug || "");
}

function imageFilename(id) {
  return `${id.replace(/[^a-zA-Z0-9._-]/g, "_")}.jpg`;
}

async function downloadImage(product) {
  const id = itemId(product);
  const sourceUrl = FALLBACK_IMAGES[id] || product.image;

  if (!id) throw new Error(`Product "${product.slug}" has no item ID.`);
  if (!sourceUrl) throw new Error(`Product "${id}" has no primary image.`);

  const response = await fetch(sourceUrl, {
    headers: { Accept: "image/*,*/*;q=0.8", "User-Agent": USER_AGENT },
    redirect: "follow",
    signal: AbortSignal.timeout(30_000),
  });
  const contentType = response.headers.get("content-type") || "";

  if (!response.ok || !contentType.toLowerCase().startsWith("image/")) {
    throw new Error(
      `Product "${id}" image returned ${response.status} ${contentType}: ${sourceUrl}`,
    );
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  const destination = path.join(OUTPUT_DIR, imageFilename(id));
  await sharp(bytes)
    .rotate()
    .flatten({ background: "#ffffff" })
    .resize({
      width: 800,
      height: 800,
      fit: "contain",
      background: "#ffffff",
    })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(destination);

  return { id, sourceUrl };
}

async function mapLimit(values, limit, mapper) {
  const results = new Array(values.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex++;
      results[index] = await mapper(values[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, () => worker()),
  );
  return results;
}

const products = JSON.parse(await fs.readFile(PRODUCTS_PATH, "utf8"));
const ids = products.map(itemId);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);

if (duplicateIds.length) {
  throw new Error(`Duplicate product IDs: ${[...new Set(duplicateIds)].join(", ")}`);
}

await fs.mkdir(OUTPUT_DIR, { recursive: true });
const downloaded = await mapLimit(products, 8, downloadImage);
const fallbackCount = downloaded.filter(({ id }) => FALLBACK_IMAGES[id]).length;

console.log(
  `Synced ${downloaded.length} Meta product images (${fallbackCount} curated fallbacks).`,
);
