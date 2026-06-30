import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { PageHeader } from "@/components/site/page-header";
import { SOLUTIONS } from "@/lib/solutions";

export const metadata: Metadata = {
  title: "Рішення для очищення води",
  description:
    "Підбір систем очищення води за завданням: квартира, будинок, свердловина, залізо, накип, помʼякшення, осмос з мінералізатором, кавʼярня, картриджі.",
};

export default function SolutionsPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <PageHeader
          title="Рішення для очищення води"
          subtitle="Оберіть сценарій — покажемо відповідні системи Ecosoft і допоможемо з підбором."
          crumbs={[
            { href: "/", label: "Головна" },
            { label: "Рішення" },
          ]}
        />

        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SOLUTIONS.map((s) => (
              <Link
                key={s.slug}
                href={`/solutions/${s.slug}`}
                className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
              >
                <h2 className="font-[family-name:var(--font-manrope)] text-lg font-bold leading-snug tracking-tight transition-colors group-hover:text-primary">
                  {s.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {s.intro}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Детальніше
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
