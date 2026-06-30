import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { PageHeader } from "@/components/site/page-header";
import { BLOG_POSTS } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Блог про очищення води",
  description:
    "Поради з вибору фільтрів, догляду за системами та покращення якості води вдома чи в бізнесі.",
};

const dateFmt = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default function BlogPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <PageHeader
          title="Блог про очищення води"
          subtitle="Поради з вибору фільтрів, догляду за системами та покращення якості води вдома чи в бізнесі."
          crumbs={[
            { href: "/", label: "Головна" },
            { label: "Блог" },
          ]}
        />

        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <div className="grid gap-4 sm:grid-cols-2">
            {BLOG_POSTS.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
              >
                <time className="text-xs text-muted-foreground tabular">
                  {dateFmt.format(new Date(post.date))}
                </time>
                <h2 className="mt-2 font-[family-name:var(--font-manrope)] text-lg font-bold leading-snug tracking-tight transition-colors group-hover:text-primary">
                  {post.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {post.excerpt}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Читати
                  <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
