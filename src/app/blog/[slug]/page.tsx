import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowLeft, MapPin } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { PageHeader } from "@/components/site/page-header";
import { getPost, getPosts } from "@/lib/posts";
import { parsePostBody } from "@/lib/posts-shared";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/site";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return (await getPosts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  const description = post.metaDescription || post.excerpt;
  return {
    title: post.seoTitle || post.title,
    description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      url: `/blog/${slug}`,
      title: post.seoTitle || post.title,
      description,
      images: post.coverImage
        ? [{ url: post.coverImage, alt: post.title }]
        : [{ url: "/opengraph-image", alt: "Sofiivka Water — партнерський магазин Ecosoft" }],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const url = `${SITE_URL}/blog/${slug}`;
  const isCase = post.kind === "case";

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": isCase ? "Article" : "BlogPosting",
            headline: post.title,
            description: post.metaDescription || post.excerpt,
            datePublished: post.publishedAt,
            dateModified: post.updatedAt,
            mainEntityOfPage: url,
            ...(post.coverImage ? { image: [post.coverImage, ...post.gallery] } : {}),
            author: { "@type": "Organization", name: "Sofiivka Water" },
            publisher: { "@id": `${SITE_URL}/#store` },
          }}
        />
        <PageHeader
          title={post.title}
          image={post.coverImage ?? "/images/page-headers/blog-water-quality-v2.png"}
          imageAlt={post.coverImage ? post.title : "Перевірка якості води та фільтрувальні матеріали"}
          crumbs={[
            { href: "/", label: "Головна" },
            { href: "/blog", label: "Блог" },
            { label: post.title },
          ]}
        />

        <div className="mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-16">
          {isCase && post.location && (
            <p className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <MapPin className="size-4" aria-hidden /> {post.location}
            </p>
          )}

          <article className="space-y-4 text-base leading-relaxed text-muted-foreground">
            {parsePostBody(post.body).map((block, i) => {
              if (block.type === "h2") {
                return (
                  <h2 key={i} className="pt-4 font-[family-name:var(--font-manrope)] text-xl font-bold tracking-tight text-foreground">
                    {block.text}
                  </h2>
                );
              }
              if (block.type === "ul") {
                return (
                  <ul key={i} className="list-disc space-y-1.5 pl-5 marker:text-primary">
                    {block.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                );
              }
              return <p key={i}>{block.text}</p>;
            })}
          </article>

          {post.gallery.length > 0 && (
            <section aria-label="Фото з обʼєкта" className="mt-10 grid gap-3 sm:grid-cols-2">
              {post.gallery.map((src, i) => (
                <a key={src} href={src} target="_blank" rel="noopener" className="block overflow-hidden rounded-xl bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`${post.title} — фото ${i + 1}`}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                  />
                </a>
              ))}
            </section>
          )}

          <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <p className="text-sm font-medium text-foreground">
              {isCase
                ? "Хочете так само? Підберемо й встановимо систему під вашу воду."
                : "Потрібна допомога з вибором? Підкажемо рішення під вашу воду."}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              {post.relatedHref && post.relatedLabel && (
                <Link
                  href={post.relatedHref}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
                >
                  {post.relatedLabel}
                  <ArrowRight className="size-4" />
                </Link>
              )}
              <Link
                href="/contacts"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Отримати консультацію
              </Link>
            </div>
          </div>

          <Link
            href="/blog"
            className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="size-4" /> Усі матеріали
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
