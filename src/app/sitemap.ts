import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/lib/blog";
import { CATEGORIES, PRODUCTS } from "@/lib/products";
import { SOLUTIONS } from "@/lib/solutions";

const SITE_URL = "https://sofiivkawater.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/catalog`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/solutions`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/blog`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contacts`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/delivery`, lastModified, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/returns`, lastModified, changeFrequency: "monthly", priority: 0.5 },
  ];

  const categoryPages: MetadataRoute.Sitemap = CATEGORIES.map((category) => ({
    url: `${SITE_URL}/catalog/${category.key}`,
    lastModified,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const productPages: MetadataRoute.Sitemap = PRODUCTS.map((product) => ({
    url: `${SITE_URL}/catalog/${product.category}/${product.slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.7,
    images: product.image ? [product.image] : undefined,
  }));

  const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const solutionPages: MetadataRoute.Sitemap = SOLUTIONS.map((solution) => ({
    url: `${SITE_URL}/solutions/${solution.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...productPages, ...blogPages, ...solutionPages];
}
