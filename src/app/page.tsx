import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { WaterProblems } from "@/components/site/water-problems";
import { HeroSlider } from "@/components/home/hero-slider";
import {
  BenefitsRow,
  BusinessBlock,
  CallbackPanel,
  CategoryChips,
  CategoryMenu,
  Container,
  ProductRail,
  PromoTile,
  SectionHeading,
  StoreContactCard,
} from "@/components/home/sections";
import { getHomeData } from "@/lib/home";

export default async function Home() {
  const data = await getHomeData();

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 bg-[oklch(0.985_0.004_240)] pb-16">
        <h1 className="sr-only">Системи очищення води Ecosoft — офіційний партнерський магазин</h1>

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

        {data.promo.length > 0 && (
          <Container className="mt-12 md:mt-16">
            <SectionHeading title="Акційні пропозиції" href="/catalog" hrefLabel="Весь каталог" />
            <ProductRail label="Акційні пропозиції" products={data.promo} />
          </Container>
        )}

        <Container className="mt-12 md:mt-16">
          <SectionHeading eyebrow="Обслуговування" title="Картриджі на заміну" href="/catalog/ro-cartridges" hrefLabel="Усі картриджі" />
          <ProductRail label="Картриджі на заміну" products={data.cartridges} />
        </Container>

        <div className="mt-8">
          <WaterProblems />
        </div>

        <Container className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <CallbackPanel source="home" />
          <StoreContactCard />
        </Container>

        <Container className="mt-12 md:mt-16">
          <BusinessBlock />
        </Container>
      </main>
      <Footer />
    </>
  );
}
