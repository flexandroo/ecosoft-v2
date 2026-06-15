import { Header } from "@/components/site/header";
import { Hero } from "@/components/site/hero";
import { TrustStrip } from "@/components/site/trust-strip";
import { Categories } from "@/components/site/categories";
import { Footer } from "@/components/site/footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <TrustStrip />
        <Categories />
      </main>
      <Footer />
    </>
  );
}
