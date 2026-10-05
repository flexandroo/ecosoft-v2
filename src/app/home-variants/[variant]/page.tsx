import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { Footer } from "@/components/site/footer";
import { WaterProblems } from "@/components/site/water-problems";
import { HeroSlider } from "@/components/home/hero-slider";
import { InlineCallbackForm } from "@/components/home/inline-callback-form";
import {
  BenefitsRow,
  BusinessBlock,
  CallbackPanel,
  CategoryChips,
  CategoryMenu,
  CategoryTiles,
  Container,
  FeaturedProduct,
  ProductGrid,
  ProductRail,
  PromoTile,
  SectionHeading,
  StoreContactCard,
} from "@/components/home/sections";
import { StoreHeader } from "@/components/home/store-header";
import { getHomeData, type HomeData } from "@/lib/home";

// Design review pages for the homepage redesign. They exist only in dev/preview
// builds (NEXT_PUBLIC_DISABLE_TRACKING=1); production builds return 404.
const PREVIEW_ENABLED = process.env.NEXT_PUBLIC_DISABLE_TRACKING === "1";

const VARIANTS = ["a", "b", "c"] as const;
type Variant = (typeof VARIANTS)[number];

export const metadata: Metadata = {
  title: { absolute: "Варіант головної (чернетка)" },
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return PREVIEW_ENABLED ? VARIANTS.map((variant) => ({ variant })) : [];
}

export const dynamicParams = false;

export default async function HomeVariantPage({ params }: { params: Promise<{ variant: string }> }) {
  const { variant } = await params;
  if (!PREVIEW_ENABLED || !VARIANTS.includes(variant as Variant)) notFound();
  const data = await getHomeData();

  return (
    <>
      <StoreHeader />
      <main id="main-content" className="flex-1 bg-[oklch(0.985_0.004_240)] pb-16">
        {variant === "a" && <VariantCatalog data={data} />}
        {variant === "b" && <VariantShowcase data={data} />}
        {variant === "c" && <VariantConsult data={data} />}
      </main>
      <Footer />
    </>
  );
}

/** A — catalogue-first, closest to the reference: menu + slider + promo tiles. */
function VariantCatalog({ data }: { data: HomeData }) {
  return (
    <>
      <Container className="pt-4 md:pt-6">
        <CategoryChips categories={data.categories} className="mb-4 lg:hidden" />
        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_300px]">
          <CategoryMenu categories={data.categories} className="hidden lg:block" />
          <HeroSlider slides={data.slides} />
          <div className="grid grid-cols-2 gap-4 lg:col-span-2 xl:col-span-1 xl:grid-cols-1">
            {data.sideTiles.map((tile) => (
              <PromoTile key={tile.id} tile={tile} />
            ))}
          </div>
        </div>
        <BenefitsRow className="mt-4" />
      </Container>

      <Container className="mt-12 md:mt-16">
        <SectionHeading title="Хіти продажів" href="/catalog" hrefLabel="Весь каталог" />
        <ProductRail label="Хіти продажів" products={data.hits} />
      </Container>

      {data.promo.length > 0 ? (
        <Container className="mt-12 md:mt-16">
          <SectionHeading title="Акційні пропозиції" />
          <ProductRail label="Акції" products={data.promo} />
        </Container>
      ) : (
        <Container className="mt-12 md:mt-16">
          <SectionHeading eyebrow="Обслуговування" title="Картриджі на заміну" href="/catalog/ro-cartridges" hrefLabel="Усі картриджі" />
          <ProductRail label="Картриджі" products={data.cartridges} />
        </Container>
      )}

      <div className="mt-8">
        <WaterProblems />
      </div>

      <Container className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <CallbackPanel source="home-a" />
        <StoreContactCard />
      </Container>

      <Container className="mt-12 md:mt-16">
        <BusinessBlock />
      </Container>
    </>
  );
}

/** B — showcase: wide slider, photo category tiles, bestsellers grid. */
function VariantShowcase({ data }: { data: HomeData }) {
  return (
    <>
      <Container className="pt-4 md:pt-6">
        <HeroSlider slides={data.slides} size="wide" />
      </Container>

      <Container className="mt-10 md:mt-14">
        <SectionHeading title="Каталог" href="/catalog" hrefLabel="Усі товари" />
        <CategoryTiles categories={data.categories} />
      </Container>

      <Container className="mt-12 md:mt-16">
        <SectionHeading title="Хіти продажів" href="/catalog" hrefLabel="Весь каталог" />
        <ProductGrid products={data.hits.slice(0, 8)} />
      </Container>

      <div className="mt-12 border-y border-border bg-card py-6 md:mt-16">
        <Container>
          <BenefitsRow tone="plain" />
        </Container>
      </div>

      <div className="mt-6">
        <WaterProblems />
      </div>

      <Container className="mt-4">
        <SectionHeading eyebrow="Обслуговування" title="Картриджі на заміну" href="/catalog/ro-cartridges" hrefLabel="Усі картриджі" />
        <ProductRail label="Картриджі" products={data.cartridges} />
      </Container>

      <Container className="mt-12 grid gap-4 md:mt-16 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <CallbackPanel source="home-b" />
        <StoreContactCard />
      </Container>

      <Container className="mt-12 md:mt-16">
        <BusinessBlock />
      </Container>
    </>
  );
}

/** C — consultation-first: offer + callback form and the bestseller in the first screen. */
function VariantConsult({ data }: { data: HomeData }) {
  return (
    <>
      <Container className="pt-4 md:pt-8">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-6">
          <section className="rounded-2xl border border-border bg-card p-6 md:p-10">
            <p className="text-xs font-bold tracking-[0.14em] text-primary uppercase">Офіційний партнер Ecosoft</p>
            <h1 className="mt-3 font-[family-name:var(--font-manrope)] text-[30px] leading-[1.08] font-extrabold tracking-tight md:text-[44px]">
              Чиста вода вдома.{" "}
              <span className="text-primary">Підберемо фільтр за&nbsp;5&nbsp;хвилин</span>
            </h1>
            <ul className="mt-5 grid gap-2 text-[15px] sm:grid-cols-2">
              {["Підбір під вашу воду безкоштовно", "Доставка по Україні 1–3 дні", "Монтаж під ключ за 24 год", "Гарантія до 5 років"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="size-4 shrink-0 text-primary" /> {t}
                </li>
              ))}
            </ul>
            <InlineCallbackForm source="home-c-hero" submitLabel="Підібрати фільтр" className="mt-7" />
          </section>
          <div className="grid gap-4">
            {data.featured && <FeaturedProduct product={data.featured} />}
          </div>
        </div>
        <CategoryChips categories={data.categories} className="mt-5 md:hidden" />
      </Container>

      <Container className="mt-10 hidden md:block">
        <CategoryTiles categories={data.categories} />
      </Container>

      <Container className="mt-12 md:mt-16">
        <SectionHeading title="Хіти продажів" href="/catalog" hrefLabel="Весь каталог" />
        <ProductRail label="Хіти продажів" products={data.hits.slice(1)} />
      </Container>

      <Container className="mt-12 grid gap-4 md:mt-16 md:grid-cols-2">
        {data.sideTiles.map((tile) => (
          <PromoTile key={tile.id} tile={tile} className="min-h-[220px]" />
        ))}
      </Container>

      <div className="mt-8">
        <WaterProblems />
      </div>

      <Container className="mt-4">
        <SectionHeading eyebrow="Обслуговування" title="Картриджі на заміну" href="/catalog/ro-cartridges" hrefLabel="Усі картриджі" />
        <ProductRail label="Картриджі" products={data.cartridges} />
      </Container>

      <Container className="mt-12 grid gap-4 md:mt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <StoreContactCard />
        <BusinessBlock className="md:grid-cols-1 xl:grid-cols-2" />
      </Container>
    </>
  );
}
