import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { PageHeader } from "@/components/site/page-header";
import { getPosts } from "@/lib/posts";
import type { Post } from "@/lib/posts-shared";

export const metadata: Metadata = {
  title: "Блог про очищення води",
  alternates: { canonical: "/blog" },
  description:
    "Поради з вибору фільтрів, догляду за системами та покращення якості води вдома чи в бізнесі.",
};

const dateFmt = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Kyiv",
});

export default async function BlogPage() {
  const posts = await getPosts();
  const cases = posts.filter((p) => p.kind === "case");
  const articles = posts.filter((p) => p.kind === "article");

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <PageHeader
          title="Блог про очищення води"
          subtitle="Поради з вибору фільтрів, догляду за системами та покращення якості води вдома чи в бізнесі."
          image="/images/page-headers/blog-water-quality-v2.png"
          imageAlt="Перевірка якості води та фільтрувальні матеріали"
          crumbs={[
            { href: "/", label: "Головна" },
            { label: "Блог" },
          ]}
        />

        <div className="mx-auto max-w-[1100px] space-y-14 px-4 py-12 md:px-8 md:py-16">
          {cases.length > 0 && (
            <section aria-labelledby="cases-title">
              <h2 id="cases-title" className="mb-5 font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight">
                Наші роботи
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cases.map((post) => (
                  <PostCard key={post.slug} post={post} headingLevel={cases.length ? "h3" : "h2"} />
                ))}
              </div>
            </section>
          )}

          {articles.length > 0 && (
            <section aria-labelledby={cases.length ? "articles-title" : undefined}>
              {cases.length > 0 && (
                <h2 id="articles-title" className="mb-5 font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight">
                  Статті
                </h2>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                {articles.map((post) => (
                  <PostCard key={post.slug} post={post} headingLevel={cases.length ? "h3" : "h2"} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function PostCard({ post, headingLevel: Heading }: { post: Post; headingLevel: "h2" | "h3" }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
    >
      {post.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverImage} alt="" loading="lazy" className="aspect-[16/9] w-full bg-muted object-cover" />
      )}
      <div className="flex flex-1 flex-col p-6">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {post.kind === "case" && post.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden /> {post.location}
            </span>
          ) : (
            <time dateTime={post.publishedAt} className="tabular">
              {dateFmt.format(new Date(post.publishedAt))}
            </time>
          )}
        </p>
        <Heading className="mt-2 font-[family-name:var(--font-manrope)] text-lg font-bold leading-snug tracking-tight transition-colors group-hover:text-primary">
          {post.title}
        </Heading>
        {post.excerpt && <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>}
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
          {post.kind === "case" ? "Дивитися кейс" : "Читати"}
          <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
