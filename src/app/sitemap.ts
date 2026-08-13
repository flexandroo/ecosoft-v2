import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/lib/blog";
import { CATEGORIES, PRODUCTS } from "@/lib/products";
import { SOLUTIONS } from "@/lib/solutions";
import { getProductImagePath } from "@/lib/product-identity";

const SITE_URL = "https://sofiivkawater.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/catalog`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/solutions`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/blog`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contacts`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/delivery`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/returns`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const categoryPages: MetadataRoute.Sitemap = CATEGORIES.map((category) => ({
    url: `${SITE_URL}/catalog/${category.key}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const productPages: MetadataRoute.Sitemap = PRODUCTS.map((product) => ({
    url: `${SITE_URL}/catalog/${product.category}/${product.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
    images: [`${SITE_URL}${getProductImagePath(product)}`],
  }));

  const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const solutionPages: MetadataRoute.Sitemap = SOLUTIONS.map((solution) => ({
    url: `${SITE_URL}/solutions/${solution.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...productPages, ...blogPages, ...solutionPages];
}
