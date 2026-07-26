import {
  CATEGORIES,
  type CategoryKey,
  type Product,
} from "@/lib/products";
import { getProductItemId } from "@/lib/product-identity";

export const SITE_URL = "https://sofiivkawater.com";

const categoryTitles = new Map<CategoryKey, string>(
  CATEGORIES.map((category) => [category.key, category.title]),
);

function decodeHtmlEntities(value: string): string {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value.replace(
    /&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi,
    (entity, decimal: string | undefined, hex: string | undefined, named: string | undefined) => {
      if (decimal) return String.fromCodePoint(Number.parseInt(decimal, 10));
      if (hex) return String.fromCodePoint(Number.parseInt(hex, 16));
      return namedEntities[named?.toLowerCase() ?? ""] ?? entity;
    },
  );
}

function plainText(value: string): string {
  return decodeHtmlEntities(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function xmlText(value: string | number): string {
  return String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function absoluteUrl(value: string, siteUrl: string): string {
  return new URL(value, `${siteUrl}/`).toString();
}

function formatPrice(value: number): string {
  return `${value.toFixed(2)} UAH`;
}

function productImages(product: Product, siteUrl: string): string[] {
  const candidates = [product.image, ...(product.images ?? [])].filter(
    (image): image is string => Boolean(image),
  );

  return [...new Set(candidates.map((image) => absoluteUrl(image, siteUrl)))];
}

function productXml(product: Product, siteUrl: string): string {
  const itemId = getProductItemId(product);
  const images = productImages(product, siteUrl);
  const [mainImage, ...additionalImages] = images;
  const hasSalePrice =
    typeof product.oldPrice === "number" && product.oldPrice > product.price;
  const regularPrice = hasSalePrice ? product.oldPrice! : product.price;
  const description = plainText(
    product.description || product.details?.longDescription || product.name,
  );

  if (!itemId) {
    throw new Error(`Meta feed: product "${product.slug}" has no item ID.`);
  }
  if (!mainImage) {
    throw new Error(`Meta feed: product "${product.slug}" has no image.`);
  }

  const fields = [
    `<g:id>${xmlText(itemId)}</g:id>`,
    `<g:title>${xmlText(product.name)}</g:title>`,
    `<g:description>${xmlText(description)}</g:description>`,
    `<g:link>${xmlText(absoluteUrl(`/catalog/${product.category}/${product.slug}`, siteUrl))}</g:link>`,
    `<g:image_link>${xmlText(mainImage)}</g:image_link>`,
    `<g:price>${xmlText(formatPrice(regularPrice))}</g:price>`,
    hasSalePrice
      ? `<g:sale_price>${xmlText(formatPrice(product.price))}</g:sale_price>`
      : "",
    `<g:availability>${product.inStock ? "in stock" : "out of stock"}</g:availability>`,
    "<g:condition>new</g:condition>",
    "<g:brand>Ecosoft</g:brand>",
    `<g:product_type>${xmlText(categoryTitles.get(product.category) ?? product.category)}</g:product_type>`,
    ...additionalImages.map(
      (image) =>
        `<g:additional_image_link>${xmlText(image)}</g:additional_image_link>`,
    ),
  ].filter(Boolean);

  return `    <item>\n      ${fields.join("\n      ")}\n    </item>`;
}

export function createMetaProductFeed(
  products: readonly Product[],
  siteUrl = SITE_URL,
): string {
  const normalizedSiteUrl = siteUrl.replace(/\/+$/, "");
  const items = products
    .map((product) => productXml(product, normalizedSiteUrl))
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Sofiivka Water — каталог</title>
    <link>${xmlText(normalizedSiteUrl)}</link>
    <description>Товарний фід для Meta</description>
${items}
  </channel>
</rss>`;
}
