import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ArrowRight, ArrowUpRight } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { PageHeader } from "@/components/site/page-header";
import { ProductCard } from "@/components/catalog/product-card";
import { SOLUTIONS, findSolution } from "@/lib/solutions";
import { PRODUCTS } from "@/lib/products";
import { matchesQuery } from "@/lib/catalog-filters";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return SOLUTIONS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = findSolution(slug);
  if (!s) return {};
  return { title: s.seoTitle, description: s.seoDescription };
}

export default async function SolutionPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const s = findSolution(slug);
  if (!s) notFound();

  const recommended = PRODUCTS.filter(
    (p) =>
      p.category === s.recommend.category &&
      (s.recommend.query ? matchesQuery(p, s.recommend.query) : true),
  )
    .sort((a, b) => a.price - b.price)
    .slice(0, 4);

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <PageHeader
          title={s.title}
          subtitle={s.intro}
          crumbs={[
            { href: "/", label: "Головна" },
            { href: "/solutions", label: "Рішення" },
            { label: s.title },
          ]}
        />

        <div className="mx-auto max-w-[1100px] space-y-12 px-4 py-12 md:px-8 md:py-16">
          {/* Кому підходить */}
          <section>
            <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight">
              Кому підходить
            </h2>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {s.audience.map((a) => (
                <li
                  key={a}
                  className="flex items-start gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground"
                >
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {a}
                </li>
              ))}
            </ul>
          </section>

          {/* Які рішення підходять */}
          <section>
            <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight">
              Які рішення підходять
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {s.solutions.map((sol) => (
                <Link
                  key={sol.href}
                  href={sol.href}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {sol.label}
                  <ArrowUpRight className="size-4" />
                </Link>
              ))}
            </div>
          </section>

          {/* Рекомендовані товари */}
          {recommended.length > 0 && (
            <section>
              <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight">
                Рекомендовані товари
              </h2>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {recommended.map((p) => (
                  <ProductCard key={p.slug} product={p} />
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8">
            <p className="max-w-2xl text-base text-foreground">
              Не впевнені, що підійде саме вам? Розкажіть про вашу воду й тип
              обʼєкта — підберемо рішення з першого разу.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contacts"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
              >
                Отримати консультацію з підбору
                <ArrowRight className="size-4" />
              </Link>
              {s.links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
