// Replaces the locally mirrored product photos with the manufacturer's
// full-size originals. The old export only gave 564×564 resized copies; the
// current ecosoft.ua product pages link originals (usually 1200×1200).
//
// Each photo is matched by file name, so the same photo in the same place gets
// sharper and no catalogue data changes. Photos without an original are left
// as they are. Run: node scripts/sync-hires-images.mjs [--dry-run]
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SOURCE = path.join(__dirname, "source");
const META_DIR = path.join(ROOT, "public", "images", "meta-products");
const USER_AGENT = "Mozilla/5.0 (compatible; SofiivkaWaterAssets/1.0; +https://sofiivkawater.com)";
const DRY_RUN = process.argv.includes("--dry-run");

/** Primary images that sync-meta-images.mjs takes from a curated fallback, not from ecosoft.ua. */
const CURATED_MAIN = new Set([
  "CPV4POST", "CPV4MIN", "CPV5POSTMIN", "CPV5POST50GPD", "CPV5MCSVECO", "CPV6POSTMIN50GPD",
  "CPV9MIN50GPD", "CPV15POST50GPD", "CPV17POSTMIN50GPD", "CHV5PUREMAC", "CHV6PUREMAC",
]);

const products = JSON.parse(await fs.readFile(path.join(SOURCE, "products.data.json"), "utf8"));
const details = JSON.parse(await fs.readFile(path.join(SOURCE, "product-details.data.json"), "utf8"));
const manifest = JSON.parse(await fs.readFile(path.join(SOURCE, "product-assets.manifest.json"), "utf8"));

/** "…/564_564_x/mo650mecostd_15_.webp" and "…/images/mo650mecostd_15_.jpg" → "mo650mecostd_15_". */
const baseName = (url) =>
  decodeURIComponent(url.split("/").pop().split("?")[0])
    .replace(/\.webp$/i, "")
    .replace(/\.(jpe?g|png)$/i, "")
    .toLowerCase();

async function fetchOk(url, accept) {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: accept },
    redirect: "follow",
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
  return response;
}

/** The new site re-uploaded some files with a "_0"/"_1" suffix; the photo itself is the same. */
const withoutCopySuffix = (base) => base.replace(/_\d$/, "");

/**
 * Original image URLs linked from the product page (gallery originals and
 * og:image), by base name and by base name without a copy suffix. Only name
 * matches are used, so a page that shows another model's photo is ignored.
 */
async function originalsFor(product) {
  const html = await (await fetchOk(product.url, "text/html")).text();
  const urls = [...html.matchAll(/sites\/default\/files\/styles\/original_webp\/public\/([^"?\s]+?)\.webp/g)].map(
    (m) => `https://ecosoft.ua/sites/default/files/${m[1]}`,
  );
  const og = html.match(/property="og:image" content="(https:\/\/ecosoft\.ua\/sites\/default\/files\/[^"]+)"/)?.[1];
  if (og) urls.push(og);
  const originals = new Map();
  for (const url of urls) {
    for (const key of [baseName(url), withoutCopySuffix(baseName(url))]) if (!originals.has(key)) originals.set(key, url);
  }
  return originals;
}

async function download(url) {
  const response = await fetchOk(url, "image/*");
  const type = response.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) throw new Error(`Not an image (${type}): ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

/** Longest side, in pixels, of the product itself (white margins trimmed). */
async function productPixels(input) {
  try {
    const { info } = await sharp(input)
      .flatten({ background: "#ffffff" })
      .trim({ threshold: 18 })
      .toBuffer({ resolveWithObject: true });
    return Math.max(info.width, info.height);
  } catch {
    const meta = await sharp(input).metadata();
    return Math.max(meta.width ?? 0, meta.height ?? 0);
  }
}

/**
 * Some "originals" are a tiny product on a huge white canvas (e.g. FPV12ECO),
 * which looks smaller than the photo we already have. Only replace when the
 * new file shows the product at least as large as the current one.
 */
async function isUpgrade(bytes, currentFile) {
  const current = await fs.readFile(currentFile).catch(() => null);
  if (!current) return true;
  return (await productPixels(bytes)) >= (await productPixels(current));
}

async function mapLimit(values, limit, mapper) {
  const results = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, async () => {
      while (next < values.length) {
        const index = next++;
        results[index] = await mapper(values[index]);
      }
    }),
  );
  return results;
}

const report = { main: { replaced: 0, kept: [] }, gallery: { replaced: 0, kept: [] }, errors: [] };
const doneGallery = new Set();

await mapLimit(products, 4, async (product) => {
  const id = String(product.sku || product.id || product.slug);
  let originals;
  try {
    originals = await originalsFor(product);
  } catch (error) {
    report.errors.push(`${id}: ${error.message}`);
    return;
  }

  // Primary image → public/images/meta-products/<ID>.jpg (also used by the Meta feed).
  const mainOriginal = !CURATED_MAIN.has(id) && product.image ? originals.get(baseName(product.image)) : undefined;
  if (mainOriginal) {
    try {
      const bytes = await download(mainOriginal);
      const target = path.join(META_DIR, `${id.replace(/[^a-zA-Z0-9._-]/g, "_")}.jpg`);
      if (!(await isUpgrade(bytes, target))) {
        report.main.kept.push(`${id} (original shows the product smaller)`);
      } else {
        if (!DRY_RUN) {
          await sharp(bytes)
            .rotate()
            .flatten({ background: "#ffffff" })
            .resize({ width: 1200, height: 1200, fit: "contain", background: "#ffffff", withoutEnlargement: true })
            .jpeg({ quality: 88, mozjpeg: true })
            .toFile(target);
        }
        report.main.replaced++;
      }
    } catch (error) {
      report.errors.push(`${id} main: ${error.message}`);
    }
  } else {
    report.main.kept.push(id);
  }

  // Gallery images → the same local files the catalogue already points to.
  for (const url of details[product.slug]?.images ?? []) {
    const local = manifest[url];
    if (!local || doneGallery.has(local)) continue;
    const original = originals.get(baseName(url));
    if (!original) {
      report.gallery.kept.push(`${id}: ${baseName(url)}`);
      continue;
    }
    doneGallery.add(local);
    try {
      const bytes = await download(original);
      const target = path.join(ROOT, "public", local);
      if (!(await isUpgrade(bytes, target))) {
        report.gallery.kept.push(`${id}: ${baseName(url)} (original shows the product smaller)`);
        continue;
      }
      if (!DRY_RUN) {
        await sharp(bytes)
          .rotate()
          .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 82, alphaQuality: 86, effort: 5 })
          .toFile(target);
      }
      report.gallery.replaced++;
    } catch (error) {
      doneGallery.delete(local);
      report.errors.push(`${id} gallery ${baseName(url)}: ${error.message}`);
    }
  }
});

console.log(
  `${DRY_RUN ? "[dry run] " : ""}Main images: ${report.main.replaced} replaced, ${report.main.kept.length} kept. ` +
    `Gallery files: ${report.gallery.replaced} replaced, ${report.gallery.kept.length} kept. Errors: ${report.errors.length}.`,
);
if (report.main.kept.length) console.log("Main kept:", report.main.kept.join(", "));
if (report.errors.length) console.log("Errors:\n" + report.errors.join("\n"));
