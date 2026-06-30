import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { PageHeader } from "@/components/site/page-header";
import { BLOG_POSTS, findPost } from "@/lib/blog";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) return {};
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) notFound();

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <PageHeader
          title={post.title}
          crumbs={[
            { href: "/", label: "Головна" },
            { href: "/blog", label: "Блог" },
            { label: post.title },
          ]}
        />

        <div className="mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-16">
          <article className="space-y-4 text-base leading-relaxed text-muted-foreground">
            {post.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </article>

          <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <p className="text-sm font-medium text-foreground">
              Потрібна допомога з вибором? Підкажемо рішення під вашу воду.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link
                href={post.relatedHref}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
              >
                {post.relatedLabel}
                <ArrowRight className="size-4" />
              </Link>
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
            <ArrowLeft className="size-4" /> Усі статті
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
