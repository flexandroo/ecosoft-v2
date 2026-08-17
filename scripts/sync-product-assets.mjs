// Mirrors secondary product images and PDF documents into /public so product
// pages do not depend on third-party hotlinks. The generated manifest is read
// by import-products.mjs and keeps future catalogue imports deterministic.
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PRODUCTS_PATH = path.join(ROOT, "src", "lib", "products.ts");
const MANIFEST_PATH = path.join(__dirname, "source", "product-assets.manifest.json");
const IMAGE_DIR = path.join(ROOT, "public", "images", "product-gallery");
const DOCUMENT_DIR = path.join(ROOT, "public", "documents", "products");
const USER_AGENT =
  "Mozilla/5.0 (compatible; SofiivkaWaterAssets/1.0; +https://sofiivkawater.com)";
const args = new Set(process.argv.slice(2));
const syncImages = !args.has("--documents-only");
const syncDocuments = !args.has("--images-only");
const maxDocumentArg = process.argv.find((arg) => arg.startsWith("--max-document-mb="));
const maxDocumentMb = Math.max(
  0.1,
  Number(maxDocumentArg?.split("=")[1] ?? 30) || 30,
);
const MAX_DOCUMENT_BYTES = maxDocumentMb * 1024 * 1024;

function readGeneratedProducts(source) {
  const marker = "export const PRODUCTS: Product[] = ";
  const start = source.indexOf(marker);
  const end = source.indexOf(";\n\nexport function findCategory", start);
  if (start === -1 || end === -1) {
    throw new Error("Could not locate the generated PRODUCTS array.");
  }
  return JSON.parse(source.slice(start + marker.length, end));
}

function sourceUrls(products) {
  const images = new Set();
  const documents = new Set();
  for (const product of products) {
    for (const url of product.images ?? []) {
      if (/^https?:\/\//i.test(url)) images.add(url);
    }
    for (const document of product.details?.documents ?? []) {
      if (/^https?:\/\//i.test(document.href)) documents.add(document.href);
    }
  }
  return { images: [...images], documents: [...documents] };
}

function slugFromUrl(url, fallback) {
  try {
    const pathname = new URL(url).pathname;
    const decoded = decodeURIComponent(path.basename(pathname, path.extname(pathname)));
    const slug = decoded
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 56);
    return slug || fallback;
  } catch {
    return fallback;
  }
}

function assetName(url, extension, fallback) {
  const hash = crypto.createHash("sha256").update(url).digest("hex").slice(0, 16);
  return `${hash}-${slugFromUrl(url, fallback)}.${extension}`;
}

async function loadManifest() {
  try {
    return JSON.parse(await fs.readFile(MANIFEST_PATH, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return {};
    throw error;
  }
}

async function fetchAsset(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return {
    bytes: Buffer.from(await response.arrayBuffer()),
    contentType: (response.headers.get("content-type") ?? "").toLowerCase(),
  };
}

async function syncImage(url, manifest) {
  const existing = manifest[url];
  if (existing?.startsWith("/images/product-gallery/")) {
    const existingPath = path.join(ROOT, "public", existing.slice(1));
    try {
      await fs.access(existingPath);
      return { status: "existing", bytes: 0 };
    } catch {
      // Re-download missing files referenced by the manifest.
    }
  }

  const { bytes, contentType } = await fetchAsset(url);
  if (!contentType.startsWith("image/")) {
    throw new Error(`Unexpected content type ${contentType || "unknown"}`);
  }

  const name = assetName(url, "webp", "product");
  const destination = path.join(IMAGE_DIR, name);
  await sharp(bytes)
    .rotate()
    .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 86, effort: 5 })
    .toFile(destination);
  const stat = await fs.stat(destination);
  manifest[url] = `/images/product-gallery/${name}`;
  return { status: "downloaded", bytes: stat.size };
}

async function syncDocument(url, manifest) {
  const existing = manifest[url];
  if (existing?.startsWith("/documents/products/")) {
    const existingPath = path.join(ROOT, "public", existing.slice(1));
    try {
      await fs.access(existingPath);
      return { status: "existing", bytes: 0 };
    } catch {
      // Re-download missing files referenced by the manifest.
    }
  }

  const head = await fetch(url, {
    method: "HEAD",
    headers: { "User-Agent": USER_AGENT, Accept: "application/pdf,*/*;q=0.8" },
    redirect: "follow",
    signal: AbortSignal.timeout(30_000),
  });
  const declaredSize = Number(head.headers.get("content-length")) || 0;
  if (head.ok && declaredSize > MAX_DOCUMENT_BYTES) {
    return {
      status: "skipped",
      bytes: declaredSize,
      reason: `larger than ${maxDocumentMb} MB`,
    };
  }

  const { bytes, contentType } = await fetchAsset(url);
  const isPdf = contentType.includes("pdf") || bytes.subarray(0, 5).toString() === "%PDF-";
  if (!isPdf) throw new Error(`Unexpected content type ${contentType || "unknown"}`);
  if (bytes.length > MAX_DOCUMENT_BYTES) {
    return {
      status: "skipped",
      bytes: bytes.length,
      reason: `larger than ${maxDocumentMb} MB`,
    };
  }

  const name = assetName(url, "pdf", "document");
  const destination = path.join(DOCUMENT_DIR, name);
  await fs.writeFile(destination, bytes);
  manifest[url] = `/documents/products/${name}`;
  return { status: "downloaded", bytes: bytes.length };
}

async function mapLimit(values, limit, mapper) {
  const results = new Array(values.length);
  let next = 0;
  async function worker() {
    while (next < values.length) {
      const index = next++;
      const url = values[index];
      try {
        results[index] = { url, ...(await mapper(url)) };
      } catch (error) {
        results[index] = { url, status: "failed", bytes: 0, reason: String(error) };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, worker));
  return results;
}

function report(kind, results) {
  const counts = results.reduce((acc, result) => {
    acc[result.status] = (acc[result.status] ?? 0) + 1;
    return acc;
  }, {});
  const bytes = results
    .filter((result) => result.status === "downloaded")
    .reduce((sum, result) => sum + result.bytes, 0);
  console.log(`${kind}: ${JSON.stringify(counts)}; added ${(bytes / 1024 / 1024).toFixed(1)} MB.`);
  for (const result of results.filter((item) => item.status === "failed" || item.status === "skipped")) {
    console.warn(`${result.status.toUpperCase()}\t${result.url}\t${result.reason ?? ""}`);
  }
}

const source = await fs.readFile(PRODUCTS_PATH, "utf8");
const products = readGeneratedProducts(source);
const urls = sourceUrls(products);
const manifest = await loadManifest();

await fs.mkdir(IMAGE_DIR, { recursive: true });
await fs.mkdir(DOCUMENT_DIR, { recursive: true });

if (syncImages) {
  const results = await mapLimit(urls.images, 8, (url) => syncImage(url, manifest));
  report("Product gallery images", results);
}
if (syncDocuments) {
  const results = await mapLimit(urls.documents, 4, (url) => syncDocument(url, manifest));
  report("Product documents", results);
}

const sortedManifest = Object.fromEntries(
  Object.entries(manifest).sort(([left], [right]) => left.localeCompare(right)),
);
await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(sortedManifest, null, 2)}\n`, "utf8");
console.log(`Manifest contains ${Object.keys(sortedManifest).length} mirrored assets.`);
